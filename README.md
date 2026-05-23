# claude-skills

Claude Code skills used by team-okimoto. Each subdirectory is one skill.

## Installing

Symlink or copy a skill folder into your `~/.claude/skills/` directory:

```bash
# macOS / Linux
ln -s "$PWD/nextjs-supabase-auth" ~/.claude/skills/nextjs-supabase-auth

# Windows (PowerShell, admin)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills\nextjs-supabase-auth" -Target "$PWD\nextjs-supabase-auth"
```

Restart Claude Code and the skill will appear in the available list.

## Skills

| Skill | Purpose |
|---|---|
| [tech-stack-reporter](./tech-stack-reporter) | Generates a `Report.html` summarizing the tech stack of any project after development tasks. |
| [nextjs-supabase-auth](./nextjs-supabase-auth) | Adds Supabase email/password auth + per-user Postgres data persistence to an existing Next.js (App Router) project. |
