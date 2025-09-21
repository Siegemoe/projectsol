-- Gmail OAuth token storage (hardened)
-- - No plaintext tokens in DB: stores only secure vault identifiers
-- - Email validated via domain + regex (citext for case-insensitive)
-- - RLS ensures each user can only access their own row
-- - Not-null, length constraints, and column-level comments

-- Extensions
create extension if not exists citext;

-- Create an email domain with validation if it doesn't already exist
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'email_address'
      and n.nspname = 'public'
  ) then
    create domain public.email_address as citext
      check (
        length(value) between 3 and 320
        and value ~* '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      );
  end if;
end
$$;

-- Table
create table if not exists public.user_google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'gmail' check (provider = 'gmail'),
  -- PII: validated email type (nullable; only stored for display/association)
  email public.email_address,
  -- Never store plaintext tokens in DB. These are vault identifiers/handles only.
  access_token_vault_id text,
  refresh_token_vault_id text not null,
  scope text,
  expiry_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  constraint access_token_vault_id_len
    check (access_token_vault_id is null or char_length(access_token_vault_id) between 10 and 255),
  constraint refresh_token_vault_id_len
    check (char_length(refresh_token_vault_id) between 10 and 255),
  constraint scope_len
    check (scope is null or char_length(scope) <= 4096)
);

-- Comments (document PII/credential handling)
comment on table public.user_google_tokens is
  'Per-user Google OAuth metadata without plaintext tokens. Tokens live in an external secure vault; DB stores only vault identifiers.';
comment on column public.user_google_tokens.user_id is
  'FK to auth.users; ON DELETE CASCADE to purge associated PII/credentials when user is removed.';
comment on column public.user_google_tokens.provider is
  'OAuth provider (constrained to ''gmail'').';
comment on column public.user_google_tokens.email is
  'Connected Gmail address (PII). Validated by public.email_address domain. Optional.';
comment on column public.user_google_tokens.access_token_vault_id is
  'Handle/identifier in secure token vault for short-lived access token. Not a token value.';
comment on column public.user_google_tokens.refresh_token_vault_id is
  'Handle/identifier in secure token vault for refresh token. Not a token value.';
comment on column public.user_google_tokens.scope is
  'Granted OAuth scopes (max 4096 chars).';
comment on column public.user_google_tokens.expiry_date is
  'Access token expiry (if applicable).';
comment on column public.user_google_tokens.created_at is
  'Row creation timestamp.';
comment on column public.user_google_tokens.updated_at is
  'Row update timestamp.';

-- Updated-at trigger
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_user_google_tokens on public.user_google_tokens;
create trigger set_updated_at_user_google_tokens
before update on public.user_google_tokens
for each row execute function public.set_updated_at();

-- RLS
alter table public.user_google_tokens enable row level security;

-- Authenticated users can manage their own row only
drop policy if exists "Users can manage own google tokens" on public.user_google_tokens;
create policy "Users can manage own google tokens"
on public.user_google_tokens
as permissive
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
