-- TimeTravel Heritage Explorer — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

-- ────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────
-- 2. USER FAVORITES
-- ────────────────────────────────────────────────
create table if not exists public.user_favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  monument_id  text not null,
  added_at     timestamptz not null default now(),
  unique (user_id, monument_id)
);

alter table public.user_favorites enable row level security;

drop policy if exists "favorites_all_own" on public.user_favorites;
create policy "favorites_all_own" on public.user_favorites
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────
-- 3. USER HISTORY (recently viewed monuments)
-- ────────────────────────────────────────────────
create table if not exists public.user_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  monument_id  text not null,
  visited_at   timestamptz not null default now()
);

alter table public.user_history enable row level security;

drop policy if exists "history_all_own" on public.user_history;
create policy "history_all_own" on public.user_history
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_history_user_visited
  on public.user_history (user_id, visited_at desc);

-- ────────────────────────────────────────────────
-- 4. QUIZ RESULTS
-- ────────────────────────────────────────────────
create table if not exists public.quiz_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  score        integer not null,
  total        integer not null,
  difficulty   text not null,
  category     text not null,
  completed_at timestamptz not null default now()
);

alter table public.quiz_results enable row level security;

drop policy if exists "quiz_results_all_own" on public.quiz_results;
create policy "quiz_results_all_own" on public.quiz_results
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
