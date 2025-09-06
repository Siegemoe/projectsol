-- Supabase Security Remediation: Move pgvector extension out of public
-- Date: 2025-09-06
-- Safe to run multiple times (idempotent)

SET statement_timeout = 0;

BEGIN;

-- 1) Create dedicated extensions schema owned by postgres
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION postgres;

-- 2) Lock down the schema: remove public access, grant only what is needed
REVOKE ALL ON SCHEMA extensions FROM PUBLIC;
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
-- NOTE: Do NOT grant to anon unless absolutely required by your app.
-- If needed, uncomment the following line:
-- GRANT USAGE ON SCHEMA extensions TO anon;

-- 3) Move the pgvector extension (named "vector") into the extensions schema if not already
DO $$
DECLARE
  target_schema text := 'extensions';
  current_schema text;
BEGIN
  SELECT n.nspname
    INTO current_schema
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'vector';

  IF current_schema IS NULL THEN
    RAISE NOTICE 'Extension "vector" (pgvector) is not installed; skipping move';
  ELSIF current_schema = target_schema THEN
    RAISE NOTICE 'Extension "vector" already in schema %; nothing to do', target_schema;
  ELSE
    EXECUTE format('ALTER EXTENSION %I SET SCHEMA %I', 'vector', target_schema);
    RAISE NOTICE 'Moved extension "vector" from % to %', current_schema, target_schema;
  END IF;
END $$;

-- 4) Ensure unqualified names still resolve to the extension by setting search_path
-- Database-wide default for new sessions
ALTER DATABASE postgres SET search_path = public, extensions, pg_temp;

-- Optionally also set per-role defaults (skips if roles are missing)
-- Note: ALTER ROLE ... IN DATABASE requires PostgreSQL 16+. For PG < 16, we rely on the database-level default above.
DO $$
DECLARE
  db text := current_database();
  v int := current_setting('server_version_num')::int;
BEGIN
  IF v >= 160000 THEN
    -- authenticated
    BEGIN
      EXECUTE format('ALTER ROLE authenticated IN DATABASE %I SET search_path = public, extensions, pg_temp', db);
    EXCEPTION WHEN undefined_object THEN
      RAISE NOTICE 'Role "authenticated" not found; skipping';
    END;

    -- service_role
    BEGIN
      EXECUTE format('ALTER ROLE service_role IN DATABASE %I SET search_path = public, extensions, pg_temp', db);
    EXCEPTION WHEN undefined_object THEN
      RAISE NOTICE 'Role "service_role" not found; skipping';
    END;

    -- anon: keep pg_temp but do not include extensions unless explicitly required
    BEGIN
      EXECUTE format('ALTER ROLE anon IN DATABASE %I SET search_path = public, pg_temp', db);
    EXCEPTION WHEN undefined_object THEN
      RAISE NOTICE 'Role "anon" not found; skipping';
    END;
  ELSE
    RAISE NOTICE 'Per-role database-specific defaults require PostgreSQL 16+; using database-level default only';
  END IF;
END $$;

-- 5) Optional hardening:
-- If your app does NOT need to create objects in public, you can tighten permissions.
-- REVOKE CREATE ON SCHEMA public FROM PUBLIC;

COMMIT;

-- ========== Verification (read-only; run separately) ==========
-- SHOW search_path;
-- SELECT extname, nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE extname = 'vector';
-- SELECT '[-0.25, 0.5, 0.25]'::vector;  -- should cast OK

-- ========== Notes ==========
-- - Existing columns of type "vector" remain valid; moving the extension does not change the type OID.
-- - If you have code referencing schema-qualified "public.vector", update it to either "extensions.vector"
--   or rely on the search_path.
-- - To locate such references:
--   -- Routines:
--   SELECT routine_schema, routine_name
--   FROM information_schema.routines
--   WHERE routine_definition ILIKE '%public.vector%';
--
--   -- Views/materialized views:
--   SELECT relname, pg_get_viewdef(oid)
--   FROM pg_class
--   WHERE relkind IN ('v','m') AND pg_get_viewdef(oid) ILIKE '%public.vector%';
--
-- - Rollback (not recommended): ALTER EXTENSION vector SET SCHEMA public;
