# Deployment guide: Supabase + Vercel

The two halves of getting this on the internet: a Supabase project (where the data + auth live) and a Vercel deployment (where the app runs).

## Supabase: one-time setup

These steps happen in the browser — no CLI does this end-to-end.

1. <https://supabase.com> → **New project**.
   - Name: anything.
   - Database password: strong, save it.
   - Region: pick one close to your users.
   - Plan: Free.
2. Wait ~1 minute for provisioning.

3. Apply the schema. **SQL Editor** → new query → paste `supabase/migrations/0001_init.sql` → **Run**. Expect "Success. No rows returned." Confirm with **Table Editor** that your tables show up.

4. (Dev only) Disable email confirmation. **Authentication → Sign In / Up → Email**, find "Confirm email" and toggle OFF. Without this, signup→login is one step. Re-enable for production once you're ready to actually send emails.

5. Get the API credentials. **Project Settings → API Keys**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** or **publishable** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Never** copy the `service_role secret` to a public env or to the browser.

6. Update Site URL after first deploy. **Authentication → URL Configuration**:
   - Set Site URL to the production URL.
   - Add the production URL to Redirect URLs as `https://yourapp.com/**`.

   This isn't urgent if email confirmation is off, but get it right before going to production — it controls where confirmation/password-reset emails point.

## Vercel: first deploy (CLI-driven)

Assumes the project is already linked to Vercel (`.vercel/project.json` exists). If not, run `vercel link` first.

### Adding env vars

```bash
# Production
echo "<SUPABASE_URL>"  | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "<ANON_KEY>"      | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Development
echo "<SUPABASE_URL>"  | vercel env add NEXT_PUBLIC_SUPABASE_URL development
echo "<ANON_KEY>"      | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
```

Verify:

```bash
vercel env ls
```

### Preview environment (gotcha)

`vercel env add NAME preview` errors with `git_branch_required` because preview env vars can be scoped per branch. `--yes` doesn't bypass this cleanly in some CLI versions. Options:

- Skip Preview and add it via the dashboard if you actually use it.
- Or pass a branch explicitly: `vercel env add NAME preview <branch> --value <v> --yes`.

For solo side projects, skipping Preview is usually fine.

### Deploy

```bash
vercel --prod
```

Output ends with the deployment URL + the alias (your custom domain or `*.vercel.app`).

## Vercel: connecting to GitHub for auto-deploy

If the project has been deployed via `vercel --prod` directly and you want `git push` to auto-deploy:

1. Make sure the repo exists on GitHub: `gh repo create <name> --private --source=. --remote=origin --description "..."`
2. `git push -u origin master`
3. `vercel git connect --yes` (run from inside the project, NOT from `~`)

After this, `git push origin master` triggers a production deploy. Pushing to any other branch triggers a preview deploy.

## When auth misbehaves in production

Order of checks when something works locally but not on prod:

1. Env vars on Vercel match the `.env.local` values exactly. Check `vercel env ls`.
2. Site URL in Supabase points to production, not localhost.
3. Redirect URLs in Supabase include the production domain.
4. Cookies — is the proxy/middleware actually running? Look at `vercel logs --follow` while loading the site; proxy errors show up here.
5. RLS — if a logged-in user gets empty data, that's usually RLS. Drop into Supabase SQL Editor (which runs queries with no user context) and verify the rows exist. Then test as a user with `SELECT … FROM table WHERE user_id = '<uuid>'`.
