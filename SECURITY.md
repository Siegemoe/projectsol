# Security Overview (Frontend & API)

This section summarizes application-level hardening implemented in this repo. The Supabase runbook remains below for database-level guidance.

## Global Security Headers (set in next.config.ts)

- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp
- Cross-Origin-Resource-Policy: same-site
- X-DNS-Prefetch-Control: off
- Content-Security-Policy (CSP):
  - default-src 'self'
  - script-src 'self'
  - style-src 'self' 'unsafe-inline'
  - img-src 'self' data: blob:
  - font-src 'self' data:
  - connect-src 'self' https://openrouter.ai https://api.openai.com https://*.supabase.co
  - frame-ancestors 'none'
  - object-src 'none'
  - base-uri 'self'
  - form-action 'self'

Notes:
- If you add third-party analytics/telemetry/CDN/Sentry, update the CSP directives accordingly.
- COEP/COOP are enabled; embedding in iframes is blocked via frame-ancestors 'none'.

## Edge API Hardening (/api/sol-chat)

- Input validation:
  - messages must be an array of { role: 'user'|'assistant', content: string }
  - MAX_MESSAGES=40, MAX_CONTENT_CHARS=10k, MAX_TOTAL_CHARS=50k
  - temperature clamped to [0, 2]
  - system prompt accepted but trimmed to 5k
- Model allowlist:
  - Restricted to OPENROUTER_ALLOWED_MODELS (default: deepseek/deepseek-chat)
- Authentication (optional):
  - REQUIRE_AUTH_FOR_API=1 enforces Supabase-authenticated user
- Rate limiting (optional):
  - RATE_LIMIT_ENABLED=1 enables in-memory sliding-window limiter (Edge best-effort)
  - 30 requests / 5 minutes per userId (if authenticated) or per IP
- Error handling:
  - Upstream error bodies not leaked; we return status and requestId where available
- Runtime:
  - Edge runtime; uses @supabase/ssr with next/headers cookies()

## Environment Flags

Set in Vercel → Project → Settings → Environment Variables (mirror to .env.local for local dev):
- REQUIRE_AUTH_FOR_API: 0|1 — require Supabase-authenticated user for protected APIs
- RATE_LIMIT_ENABLED: 0|1 — enable in-memory rate limiter on Edge routes
- OPENROUTER_ALLOWED_MODELS: CSV of allowed models (e.g., deepseek/deepseek-chat)

## Repo Hygiene and Secrets

- Never commit .env.local (already .gitignore'd)
- Use .env.example for placeholders only
- Public keys under NEXT_PUBLIC_* are expected to be client-visible
- Archive and one-off files:
  - All non-production demo/testing files should live under archive/
  - Current index is maintained at archive/README.md
  - The /demo route has been disabled and now redirects to /
- Secret scanning:
  - Ad-hoc check: search for patterns like `sk-` or provider-specific tokens before pushing

## How to enable the strictest posture in production

1) Set env flags:
   - REQUIRE_AUTH_FOR_API=1
   - RATE_LIMIT_ENABLED=1
   - OPENROUTER_ALLOWED_MODELS to your intended allowlist
2) Confirm Vercel has all server-only secrets (OPENROUTER_API_KEY, SITE_URL)
3) Validate that CSP covers all enabled services (analytics/telemetry/CDN)
4) Redeploy

---

# Supabase Security Remediation Runbook

This runbook documents fixes for the following Supabase security warnings:

1) Extension in Public (pgvector)
- Issue: Extension `vector` (pgvector) installed in `public` schema.
- Risk: The public schema is broadly accessible; extensions/types there increase attack surface.
- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

2) Auth OTP long expiry
- Issue: Email OTP expiry exceeds recommended threshold (> 1 hour).
- Recommendation: Use <= 60 minutes (10–15 minutes typical).
- Reference: https://supabase.com/docs/guides/platform/going-into-prod#security


## A) Move pgvector out of the public schema

A safe, idempotent migration has been added to this repo:

- File: `supabase/migrations/20250906_move_pgvector_out_of_public.sql`

What it does:
- Creates and locks down an `extensions` schema
- Moves the `vector` extension into `extensions`
- Sets `search_path` so unqualified vector names resolve correctly
- Grants `USAGE` on `extensions` to `postgres`, `authenticated`, and `service_role` (omit `anon` by default)

Why this is safe:
- Moving the extension does not change the type OID. Existing `vector` columns remain valid and data is kept.
- Only risk is if code explicitly references `public.vector`, which is uncommon.

Pre-check (optional)
```sql
SELECT extname, nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'vector';
```

Apply the migration

Option A — Supabase Dashboard (SQL Editor)
1) Open your project in Supabase Dashboard
2) SQL Editor → paste the contents of `supabase/migrations/20250906_move_pgvector_out_of_public.sql`
3) Execute

Option B — Supabase CLI (remote)
Prereqs: Supabase CLI installed and logged in
```bash
# Link this repo to your Supabase project once:
supabase link --project-ref <YOUR_PROJECT_REF>

# Push migrations to the linked remote database:
supabase db push
```

Post-checks
```sql
-- Should include `extensions` in the path
SHOW search_path;

-- Extension should now be in `extensions`
SELECT extname, nspname
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE extname = 'vector';

-- Casting should work
SELECT '[-0.25, 0.5, 0.25]'::vector;
```

-- Verify schema USAGE by role
SELECT r.rolname AS role,
       has_schema_privilege(r.rolname, 'extensions', 'USAGE') AS has_usage
FROM pg_roles r
WHERE r.rolname IN ('postgres','authenticated','service_role','anon');

-- Quick runtime check (optional)
SET ROLE authenticated;
SHOW search_path;
SELECT '[-0.25,0.5,0.25]'::vector;
RESET ROLE;
Known behaviors and rollback
- If any SQL explicitly references `public.vector`, update to `extensions.vector` or rely on `search_path`.
- To locate such references:
```sql
-- Routines
SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_definition ILIKE '%public.vector%';

-- Views/materialized views
SELECT relname, pg_get_viewdef(oid)
FROM pg_class
WHERE relkind IN ('v','m') AND pg_get_viewdef(oid) ILIKE '%public.vector%';
```
- Rollback (not recommended): `ALTER EXTENSION vector SET SCHEMA public;`


## B) Reduce Auth Email OTP expiry

Where to change (Dashboard):
1) Authentication → Configuration (or Providers → Email)
2) Find Email OTP / Magic Link expiry (seconds)
3) Set to 600–900 seconds (10–15 minutes) or at most 3600 seconds (1 hour)
4) Save

Rationale:
- Short-lived OTPs reduce the window for token theft/replay.

Impact & Testing:
- End users will have less time to complete OTP sign-in. Ensure emails are delivered reliably.
- Test a full sign-in flow immediately after saving.


## C) Verification

- Re-run the Supabase Database Linter (Dashboard → Database → Linter)
  - “Extension in Public” warning should be cleared
  - “Auth OTP long expiry” warning should be cleared

- Application sanity:
  - Execute a request path that exercises vector queries to confirm operators/types resolve correctly


## D) Current codebase references to vector

On 2025-09-06, a scan of the app source found no explicit references to `public.vector` or to vector operators in code files:
- Searched patterns: `public.vector`, `::vector`, `<->`, `<#>`
- Scope: `src/**/*.ts*`
- Result: No matches

This reduces the likelihood of schema-qualified references breaking after the extension move.


## Appendix: SQL used by the migration (for quick review)

Core operations performed (see file for full details):
```sql
-- Create and secure extensions schema
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA extensions FROM PUBLIC;
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, service_role;

-- Move the pgvector extension
ALTER EXTENSION IF EXISTS vector SET SCHEMA extensions;

-- Set search_path for database and roles
ALTER DATABASE postgres SET search_path = public, extensions, pg_temp;
ALTER ROLE authenticated IN DATABASE postgres SET search_path = public, extensions, pg_temp;
ALTER ROLE service_role  IN DATABASE postgres SET search_path = public, extensions, pg_temp;
ALTER ROLE anon          IN DATABASE postgres SET search_path = public, pg_temp;
