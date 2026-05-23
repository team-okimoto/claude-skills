# Schema design guide

Patterns for translating a localStorage-shaped (or fresh) data model into a normalized Postgres schema with RLS. Reference these recipes when helping the user fill in `migration-template.sql`.

## Pattern 1: One thing per user (top-level resource)

User has many items. Each item has one owner.

```sql
create table public.items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index items_user_id_idx on public.items (user_id);

alter table public.items enable row level security;
create policy "items_own" on public.items
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**When to use:** workouts, journal entries, todos, projects, anything top-level the user "has."

## Pattern 2: Child table (gate via parent)

A row belongs to a row that belongs to a user.

```sql
create table public.item_notes (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index item_notes_item_id_idx on public.item_notes (item_id);

alter table public.item_notes enable row level security;
create policy "item_notes_own" on public.item_notes
  for all
  using (exists (
    select 1 from public.items i
    where i.id = item_notes.item_id
      and i.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.items i
    where i.id = item_notes.item_id
      and i.user_id = auth.uid()
  ));
```

**When to use:** sets inside a workout exercise, comments on a post, photos for an entry — anything that doesn't make sense without its parent.

## Pattern 3: Three-level nesting

If you go deeper (grandchild table), the RLS gate walks two FKs:

```sql
create policy "grandchild_own" on public.grandchild
  for all
  using (exists (
    select 1
    from public.child c
    join public.parent p on p.id = c.parent_id
    where c.id = grandchild.child_id
      and p.user_id = auth.uid()
  ));
```

Don't go four levels deep without a really good reason. Usually it means you missed a chance to denormalize or you have an aggregate concept that should be its own top-level table.

## Pattern 4: "One per (user, X)"

Use UNIQUE for "user has at most one X per Y" — it lets you use upsert as `getOrCreate`:

```sql
create table public.daily_journal (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  -- ...
  unique (user_id, date)  -- one entry per user per day
);
```

In Supabase client:
```ts
const { data } = await supabase
  .from('daily_journal')
  .upsert({ user_id, date }, { onConflict: 'user_id,date' })
  .select('id')
  .single();
```

## Normalize, don't JSON

Tempting: store arrays/objects as `jsonb` (e.g. `sets jsonb` for a workout). Don't, unless you're sure you'll only ever read the whole object together.

Cost of normalization: more tables, more JOINs, slightly more boilerplate.

Cost of JSON: rewriting the whole field for every tiny update; can't index inside it cleanly; can't FK from inside it; can't have RLS rules that filter into it.

JSON is the right call for: opaque configuration blobs, audit logs you never query into, third-party API payloads.

## Cascading deletes

Always think through `on delete cascade` chains. If a user deletes their account:

```
auth.users  ─[cascade]→ items  ─[cascade]→ item_notes
```

means deleting the user also deletes their items and the notes on those items. This is usually what you want and saves you writing cleanup code. The alternative (`on delete set null` or `on delete restrict`) is right when child rows should outlive the parent — rarely.

## `updated_at` triggers

If your UI shows "last edited," add a touch trigger:

```sql
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger items_touch
  before update on public.items
  for each row execute function public.touch_updated_at();
```

If you want a *parent* table's `updated_at` to bump when a *child* row changes (e.g., editing a set updates the session it belongs to), look the parent id up in the trigger function and run an UPDATE. Worked example in the kintore-muscle migration.

## Service role bypasses RLS — be careful

The `service_role` key bypasses all RLS. It's meant for server-side admin tools (cron jobs, migrations, internal dashboards). **Never** ship it to the browser. If a Server Action needs to bypass RLS for some reason (rare), prefer a SQL function with `SECURITY DEFINER` over reaching for the service role.
