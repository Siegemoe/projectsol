-- Gmail OAuth token storage (read-only Phase 1)
-- Stores per-user Google refresh token (encrypted at rest by app code) and optional access/expiry for convenience.
-- RLS ensures each user can only access their own row.

create table if not exists public.user_google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'gmail' check (provider = 'gmail'),
  email text, -- optional: store connected Gmail address for display
  access_token text, -- optional, ephemeral
  refresh_token text not null, -- encrypted by app code with ENCRYPTION_KEY
  scope text,
  expiry_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
create policy "Users can manage own google tokens"
on public.user_google_tokens
as permissive
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
