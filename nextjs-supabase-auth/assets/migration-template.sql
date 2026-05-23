-- ============================================================================
-- 0001_init.sql — initial schema
-- ============================================================================
-- This file is a TEMPLATE. Replace the placeholder `items` / `item_logs`
-- tables with your domain tables, following the same RLS patterns.
--
-- Concepts illustrated here:
--   1. References to `auth.users` (managed by Supabase)
--   2. Foreign keys with ON DELETE CASCADE (delete-user-then-data)
--   3. UNIQUE constraints as business-rule enforcement
--   4. Row Level Security (RLS) for per-user isolation
--   5. A trigger that auto-creates a profile row on signup
-- ============================================================================


-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users. Holds app-level user info (display name etc.)
-- ---------------------------------------------------------------------------
-- Nothing sensitive lives here — that's in `auth.users`. Keeping a separate
-- `profiles` table is the standard Supabase pattern; the `auth` schema is
-- meant to be a black box.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- EXAMPLE: items — a per-user table (rename this to your domain table)
-- ---------------------------------------------------------------------------
-- Pattern: top-level resource owned by a user. Direct user_id FK, RLS scoped
-- by `auth.uid() = user_id`.
create table public.items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  -- ...add your columns here
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Most queries filter by user_id; index helps even at small N.
create index items_user_id_idx on public.items (user_id);


-- ---------------------------------------------------------------------------
-- EXAMPLE: item_logs — a child table belonging to items
-- ---------------------------------------------------------------------------
-- Pattern: nested resource. No direct user_id; ownership flows through the
-- parent. The RLS policy below shows how to gate by traversing the FK.
create table public.item_logs (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);
create index item_logs_item_id_idx on public.item_logs (item_id);


-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- RLS is a Postgres feature where each row visibility check answers: "is this
-- row visible to the current user?" Supabase sets `auth.uid()` to the JWT's
-- user id, so `WHERE user_id = auth.uid()` becomes "WHERE this row is mine."
--
-- Once RLS is enabled, *no row is visible by default*. You must explicitly
-- allow access via policies — deny-by-default is the safer security model.
-- ============================================================================

alter table public.profiles  enable row level security;
alter table public.items     enable row level security;
alter table public.item_logs enable row level security;


-- profiles: a user can only read/write their own row.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);


-- items: standard per-user table policy. "FOR ALL" covers SELECT, INSERT,
-- UPDATE, DELETE in one policy.
create policy "items_own" on public.items
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- item_logs: no direct user_id column, so we check through the parent.
-- The EXISTS subquery says "the parent item is mine."
create policy "item_logs_own" on public.item_logs
  for all
  using (exists (
    select 1 from public.items i
    where i.id = item_logs.item_id
      and i.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.items i
    where i.id = item_logs.item_id
      and i.user_id = auth.uid()
  ));


-- ============================================================================
-- Auto-create a profile row whenever a new auth.users row is inserted
-- ============================================================================
-- This trigger runs as the database superuser (SECURITY DEFINER) so it can
-- write to public.profiles even though the RLS policy "only the owner" would
-- normally forbid inserting a row for someone else.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- Keep items.updated_at fresh on any update
-- ============================================================================
-- Delete this section if you don't display "last edited" anywhere.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();
