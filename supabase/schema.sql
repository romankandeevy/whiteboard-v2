create extension if not exists "pgcrypto";

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled board',
  data jsonb not null default '{"elements":[],"appState":{},"files":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boards_user_id_idx on public.boards (user_id);

alter table public.boards enable row level security;

create policy "Users can view their own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own boards"
  on public.boards for delete
  using (auth.uid() = user_id);
