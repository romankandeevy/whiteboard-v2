create extension if not exists "pgcrypto";

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled board',
  data jsonb not null default '{"elements":[],"appState":{},"files":{}}'::jsonb,
  pinned boolean not null default false,
  is_online boolean not null default false,
  room_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now()
);

-- Additive migrations for boards created before the dashboard rework.
alter table public.boards add column if not exists pinned boolean not null default false;
alter table public.boards add column if not exists is_online boolean not null default false;
alter table public.boards add column if not exists room_code text;
alter table public.boards add column if not exists last_opened_at timestamptz not null default now();

create index if not exists boards_user_id_idx on public.boards (user_id);
create unique index if not exists boards_room_code_idx on public.boards (room_code) where room_code is not null;

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
