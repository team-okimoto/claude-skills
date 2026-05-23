---
name: nextjs-supabase-auth
description: Adds Supabase email/password authentication and per-user Postgres data persistence to an existing Next.js (App Router, TypeScript) project. Trigger this whenever the user wants to add login, signup, accounts, authentication, multi-user support, "real" database persistence, or to move from localStorage to a backend in a Next.js app. Also trigger for "make this app multi-user," "add user accounts," "persist data across devices," "I want users to sign in," "wire up Supabase," or "add Row Level Security." Pick this skill even when Supabase isn't named explicitly — it is the default fit for Vercel-hosted Next.js side projects that need auth + a small Postgres without standing up infra. Use it as a one-shot setup, not for ongoing app feature work.
---

# Next.js + Supabase Auth setup

This skill installs Supabase email/password auth on an existing Next.js (App Router) project and gives each user their own slice of Postgres, gated by Row Level Security. The end result mirrors the kintore-muscle pattern: every DB read/write goes through Server Actions, RLS in the database guarantees a user can only touch their own rows, and a Next.js Proxy (or Middleware on Next 15) refreshes session cookies on every request.

## When to use this skill

Use this when the user has an existing Next.js project and wants to add multi-user auth + persistence. Don't use it for:
- Spinning up a brand-new project from scratch (the user should `create-next-app` first).
- Apps already using a different auth provider (Clerk, Auth.js, NextAuth) — pivoting between auth systems is a different task.
- Apps that need OAuth/social login only (this skill targets email/password as the default; OAuth is a follow-up).

If the user is on Pages Router instead of App Router, stop and tell them — this skill targets App Router and the patterns don't translate cleanly.

## High-level workflow

1. **Detect project context.** Confirm App Router, TypeScript, Next.js major version (15 vs 16), `src/` directory or not, package manager.
2. **Install dependencies.** `@supabase/ssr` + `@supabase/supabase-js`.
3. **Drop in client utilities** at `src/lib/supabase/{client,server,middleware}.ts` (or `lib/...` if no `src/`).
4. **Wire up the request-level helper.** `proxy.ts` for Next 16, `middleware.ts` for Next 15. Place at the same level as `app/` (inside `src/` if used).
5. **Drop in auth pages.** `/login` and `/signup` with Server Actions; `LogoutButton` component.
6. **Generate the SQL migration template** at `supabase/migrations/0001_init.sql`. The template has a `profiles` table + auto-create trigger + RLS skeleton; the user fills in their domain tables.
7. **Help the user customize the schema.** Walk through the table they want per-user, show the RLS pattern, and emit a migration they can paste into Supabase SQL Editor.
8. **Create `.env.local` + `.env.example`.** Placeholders the user fills in after creating a Supabase project.
9. **Walk the user through Supabase project creation** (browser steps — they have to do this, no API for it).
10. **Optionally wire up Vercel via CLI** for env vars + GitHub auto-deploy.

Each step is detailed below. Don't skip the detection step — Next.js 16's middleware → proxy rename is a hard breaking change, and getting the file in the wrong place silently does nothing.

## Step 1: Detect project context

Read `package.json` and the directory layout:

- **Next version**: look at `dependencies.next`. `^15.*` or `15.x.x` → Next 15 (use `middleware.ts`). `^16.*` or `16.x.x` → Next 16 (use `proxy.ts`). For any other version, ask the user — earlier versions are unsupported here.
- **App Router?** Confirm `src/app/` or `app/` exists. If `pages/` exists and no `app/`, stop and tell the user.
- **`src/` directory?** Use `src/` paths when present, root paths otherwise.
- **Package manager**: `package-lock.json` → npm. `pnpm-lock.yaml` → pnpm. `yarn.lock` → yarn. `bun.lockb` → bun.

State your findings to the user briefly: e.g. "Detected Next 16, App Router, `src/`, pnpm — using proxy.ts + pnpm add."

## Step 2: Install dependencies

Run the install command matching the detected package manager:

| Package manager | Command |
|---|---|
| npm  | `npm install @supabase/ssr @supabase/supabase-js` |
| pnpm | `pnpm add @supabase/ssr @supabase/supabase-js` |
| yarn | `yarn add @supabase/ssr @supabase/supabase-js` |
| bun  | `bun add @supabase/ssr @supabase/supabase-js` |

## Step 3: Drop in Supabase client utilities

Three small files, one per execution context. Copy them verbatim from `assets/`:

- `assets/client.ts` → `src/lib/supabase/client.ts` (used from Client Components)
- `assets/server.ts` → `src/lib/supabase/server.ts` (used from Server Components, Route Handlers, Server Actions)
- `assets/middleware-helper.ts` → `src/lib/supabase/middleware.ts` (used by proxy.ts / middleware.ts)

These files are written for Next.js 16's async `cookies()`. On Next 15 they still work — `cookies()` is already async there too — so no changes needed across versions.

## Step 4: Wire up Proxy (Next 16) or Middleware (Next 15)

The two are functionally identical here; only the filename and exported function name differ. Place at `src/proxy.ts` (Next 16) or `src/middleware.ts` (Next 15) — same directory level as `app/`.

- Next 16: copy `assets/proxy.ts` → `src/proxy.ts`
- Next 15: copy `assets/middleware.ts` → `src/middleware.ts`

The matcher excludes static assets and Next internals; everything else runs through `updateSession` which (a) refreshes the access token if expired, (b) bounces unauthenticated visitors to `/login`, (c) bounces logged-in users away from `/login` and `/signup`.

If the user wants additional public routes (a marketing page, public API, etc.), add them to the `isAuthRoute` check inside `middleware-helper.ts`.

## Step 5: Drop in auth pages and actions

Files to copy from `assets/`:

| Source | Destination |
|---|---|
| `assets/auth-actions.ts`   | `src/lib/auth-actions.ts` |
| `assets/login-page.tsx`    | `src/app/login/page.tsx` |
| `assets/login-form.tsx`    | `src/app/login/LoginForm.tsx` |
| `assets/signup-page.tsx`   | `src/app/signup/page.tsx` |
| `assets/signup-form.tsx`   | `src/app/signup/SignupForm.tsx` |
| `assets/logout-button.tsx` | `src/components/LogoutButton.tsx` |

`auth-actions.ts` exports `signIn`, `signUp`, `signOut`. Mount the `<LogoutButton />` somewhere reachable from the app (settings page, account menu, or anywhere the user can find it).

The forms use Server Actions via `useActionState` — error messages from Supabase appear inline without any custom error plumbing. If the user's project doesn't have Tailwind, the styling won't apply; tell them they may want to restyle.

## Step 6: SQL migration template

Read `assets/migration-template.sql` and emit it at `supabase/migrations/0001_init.sql`. The template has:

- A `profiles` table that mirrors `auth.users` 1:1 (extension point for app-level user data).
- A trigger that auto-creates a `profiles` row on signup.
- A worked example of a per-user table (`items`) with RLS that the user can rename + extend or delete.
- A worked example of a child table (`item_logs`) whose RLS gates through the parent table — important pattern they'll reuse.

The file has inline comments explaining each clause. The user pastes this into Supabase SQL Editor → Run.

## Step 7: Help the user customize the schema

The template's `items` / `item_logs` are intentionally placeholder names. Ask the user what they're actually storing per user — get them to tell you the tables and the parent/child relationships — then rewrite the migration in-place. Patterns to apply:

- **Top-level per-user table** (one of: user has many of X): include `user_id uuid not null references auth.users(id) on delete cascade` and an RLS policy `using (auth.uid() = user_id)`.
- **Child table** (X belongs to a Y which belongs to a user): no direct `user_id`; RLS policy uses `exists (select 1 from parent where parent.id = child.parent_id and parent.user_id = auth.uid())`.
- **Uniqueness on (user_id, something)** is the right shape for "user can only have one X per Y" — e.g. one workout session per date, one profile per user.
- **`updated_at` triggers** are worth keeping if the app shows "last edited" anywhere.

For learning value, explain (briefly) *why* RLS is the right layer: a bug in app code can't leak data because the DB itself enforces the boundary. Foreign keys with `on delete cascade` handle "user deletes account → all their data goes too" without manual deletion code.

Run `npx tsc --noEmit` (or equivalent) at the end of Step 8 below to confirm everything compiles before handing back.

## Step 8: .env.local and gitignore

Copy `assets/env.example` → `.env.local` (placeholders) AND `.env.example` (committed template). Verify `.env*` is in `.gitignore` (`!.env.example` exception) — most `create-next-app` outputs ignore env files by default. If not, add it.

## Step 9: Supabase project setup (user does this in browser)

This part can't be automated — Supabase project creation requires the user. Walk them through:

1. <https://supabase.com> → **New project**. Pick a name, set a strong DB password, choose a region close to them.
2. Wait ~1 min for provisioning.
3. **SQL Editor** → paste `supabase/migrations/0001_init.sql` → **Run**. Confirm "Success. No rows returned."
4. **Authentication → Sign In / Up → Email**. For dev convenience, find the "Confirm email" toggle and turn it OFF (re-enable for production). If they can't find it, that's fine — confirmation just adds an email-click step to signup.
5. **Project Settings → API Keys**. Copy the project URL and `anon public` (or `publishable`) key into the local `.env.local`.

Then `npm run dev` (or equivalent), open the dev URL, sign up, and verify the round-trip works (signup → log a row → logout → login → row still there).

## Step 10: Vercel deployment (optional, CLI-driven)

If the project is on Vercel and the user wants automated env var setup, the Vercel CLI can do most of it. Check first: `ls .vercel/project.json` confirms there's a Vercel project linked.

```bash
# 1. Add env vars (do for production + development at minimum)
echo "<SUPABASE_URL>"  | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "<SUPABASE_URL>"  | vercel env add NEXT_PUBLIC_SUPABASE_URL development
echo "<ANON_KEY>"      | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "<ANON_KEY>"      | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

# 2. Deploy
vercel --prod
```

The Preview environment requires either a git branch arg or interactive confirmation that `--yes` doesn't bypass cleanly — skip Preview unless the user specifically asks, and just tell them they can add it later from the dashboard.

After deploy, the user should also update Supabase's **Authentication → URL Configuration → Site URL** to the production URL so confirmation/reset emails point to the right place.

## Step 11: Verify

Hand off to the user with a short checklist they can self-verify:

- [ ] Visit the dev URL — bounced to `/login`?
- [ ] Signup with a real-looking email + password (6+ chars)?
- [ ] After signup, redirected into the app?
- [ ] Reading or writing a per-user row works?
- [ ] Logout, then log back in — data still there?

If any step fails, the failure mode is almost always one of: env vars not loaded (`.env.local` typo, or `NEXT_PUBLIC_` prefix missing), wrong Next.js file location (`proxy.ts` vs `middleware.ts`), or RLS policy too strict (test by selecting from the table while logged in via Supabase SQL Editor — it'll show what the user can see).

## Common pitfalls and gotchas

- **Cookies are async in Next 14+.** All Supabase server-side code uses `await cookies()`. If you see "Cookies can only be modified in a Server Action or Route Handler," that's expected from Server Components — our `server.ts` swallows it because proxy/middleware does the real cookie writing.
- **Don't share clients across requests.** `server.ts` creates a new client per call. Don't memoize it.
- **`getSession()` vs `getUser()`.** `getSession()` reads cookies; the user it returns is unverified. Use `getUser()` for any authorization decision — it contacts the Auth server.
- **The `anon` / `publishable` key is safe in the browser.** RLS is what protects data, not key secrecy. The `service_role` key is the admin one and must never reach the browser.
- **Migration filename:** `supabase/migrations/0001_init.sql` — the user's Supabase project doesn't need the Supabase CLI to apply this; they paste it into the SQL Editor directly. We keep the conventional name for future-proofing.

## Reference files

- `references/schema-design-guide.md` — patterns for normalizing localStorage shapes into tables, common RLS recipes, when to denormalize.
- `references/deployment-guide.md` — full Supabase + Vercel deployment runbook, including site URL config.
