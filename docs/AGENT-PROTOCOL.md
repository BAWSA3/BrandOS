# Agent Protocol — how multiple AI agents build BrandOS together

_Jeffrey signs off; agents build. This file is the coordination contract.
Every agent (Claude Code / Fable, Cursor / Opus, subagents, scheduled
routines) reads this before touching the repo._

## Roles

| Agent | Job | Writes where |
|---|---|---|
| **Fable 5 (Claude Code, main session)** | Lead builder: architecture, data model, security, multi-file ports (consolidation backlog) | Feature branches → PR |
| **Parallel builder subagents** | Independent backlog items, isolated in git worktrees so they never collide with the main session | Own feature branch → own PR |
| **Review agent** | Every PR gets a code-review pass before Jeffrey sees it; findings posted as PR comments | PR comments only |
| **Docs keeper** | After merges: update `docs/CURRENT-STATE.md`, acceptance logs, and the relevant plan doc so the repo never lies about its own state | `docs/` via the same PR or a follow-up docs PR |
| **Cursor (Opus 4.8)** | Quick interactive edits: UI nudges, copy, small fixes. Reads this file + recent `git log` before starting | Own branches (`cursor/<slug>`) → PR |

## The one rule: sign-off = GitHub PR

- **No agent pushes to `staging` or `main` directly.** All work lands as a
  PR into `staging`; Jeffrey approves and merges.
- `staging` → `main` promotion stays a deliberate, checklisted event
  (fresh backup, FULL migration diff vs information_schema, suite runs) —
  see `docs/PHASE-1-PROD-PROMOTION.md` for the pattern.
- PR descriptions must carry: what changed, why, how it was verified
  (suites run, screenshots for UI), and any follow-up the merge creates.

## Coordination is through the repo, not side channels

- Verbose commit messages are the inter-agent message bus.
- Plan docs are the source of truth per effort (consolidation:
  `docs/SPLIT-BRAIN-CONSOLIDATION.md`; security:
  `docs/SECURITY-HARDENING.md`). Update the doc in the same PR that
  changes the code.
- Don't duplicate work: check open PRs (`gh pr list`) and recent
  `git log --all` before starting anything.

## Hard rails (all agents)

- **Never run DB migrations.** Write the SQL into `supabase-migrations/`,
  say so in the PR; Jeffrey applies with
  `node --env-file=.env.local scripts/apply-migration.mjs <file>`.
- **Never touch prod env vars or Vercel project settings.**
- Backend changes run the security guardrail before the PR:
  authZ / input validation / output validation / RLS / cost-abuse, plus
  `npm run test:rls` and `npm run test:safety`.
- UI on dashboard surfaces uses the world CSS variables and the shared
  primitives in `src/components/dashboard/terminal-ui.tsx`. Preview
  harnesses: `/world-preview?wizard=1`, `?dna=1`.
- One branch, one owner. Never commit to a branch another agent has open.

## Division of labor: Fable here vs Opus in Cursor

Fable (this repo's Claude Code sessions) owns anything that spans files or
touches money/auth/data: schema, API routes, syncing, security, the
consolidation ports. Cursor is for the inner loop while Jeffrey is in the
editor: styling tweaks, copy, one-file fixes. If a Cursor task starts
growing past ~2 files or touches an API route, stop and hand it to a
Claude Code session with a note in the PR.
