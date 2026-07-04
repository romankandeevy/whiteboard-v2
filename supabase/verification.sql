-- Stores short-lived email verification codes for the custom sign-up flow.
-- Only the service role (used inside edge functions) ever touches this table.
create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  purpose text not null default 'signup',
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists email_verifications_email_idx
  on public.email_verifications (lower(email));

-- Lock the table down completely: RLS on, no policies => anon/authenticated
-- clients cannot read or write it. The edge functions use the service role,
-- which bypasses RLS.
alter table public.email_verifications enable row level security;

-- Also remove it from the public REST API entirely — only the service role
-- (edge functions) should ever read or write verification codes.
revoke all on table public.email_verifications from anon, authenticated;

-- Look up a user's auth status by email without exposing the auth schema to
-- the client. SECURITY DEFINER so it can read auth.users; execution is limited
-- to the service role only.
create or replace function public.auth_user_status(p_email text)
returns table (user_id uuid, confirmed boolean)
language sql
security definer
set search_path = ''
as $$
  select u.id, u.email_confirmed_at is not null
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;
$$;

revoke all on function public.auth_user_status(text) from public, anon, authenticated;
grant execute on function public.auth_user_status(text) to service_role;
