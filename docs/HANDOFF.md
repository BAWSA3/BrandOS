# HANDOFF — Pick up from here

_Last updated: 2026-06-15 (end of the "reconcile Vercel + fix production build" session)_

This is the single doc to read first if you (human or a fresh Claude Code / agent
session) are picking up BrandOS. It tells you exactly where things stand, the
traps to avoid, and what to do next. For deeper context, follow the links in
[Knowledge base](#knowledge-base) at the bottom.

---

## 1. TL;DR — where we are right now

- **Production is healthy and fixed.** `mybrandos.app` serves `main` via the
  Vercel **`brandos`** project. The "Missing Supabase environment variables"
  build failure is resolved.
- **Vercel is reconciled.** `main` is canonical for production; `staging` is the
  development lane (deploys to the **`brandos-staging`** project). See
  `docs/SOLO-DEPLOY-WORKFLOW.md`.
- **Both branches are pushed and in sync with their remotes.**
- **Next focus:** the Minimum Launch Bar (take-money security/legal bar) —
  built on `staging`, promoted to `main` only when green. See
  `docs/MINIMUM-LAUNCH-BAR.md`.

---

## 2. ⚠️ The #1 trap: Supabase env-var names differ between branches

The Phase-1 line renamed the Supabase env vars. The rename is on `staging` but
**NOT** on the production-deployed `main`:

| Concept | `main` (prod / `brandos`) | `staging` (`brandos-staging`) |
| --- | --- | --- |
| Public client key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Server/admin key | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SECRET_KEY` |
| Public URL | `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` (same) |

Consequences:

- The **`brandos`** Vercel project env MUST use the **old** names.
- The **`brandos-staging`** Vercel project env MUST use the **new** names.
- **DO NOT `git merge staging → main` to promote work.** That would drag the
  rename into production while the `brandos` env still uses old names →
  production build/runtime breaks with "Missing Supabase environment variables"
  again. To promote staging work to main you must EITHER:
  1. Cherry-pick the specific non-rename commits to `main` (what we did for the
     build hotfixes), OR
  2. Deliberately merge the rename **and** flip the `brandos` project's env vars
     to the new names in the same change window, then verify.

Decide the long-term direction (standardize on the new names everywhere) as part
of the launch work — but until then, treat the merge direction as a manual,
env-aware operation, never an automatic fast-forward.

---

## 3. What changed this session

Production `main` had actually never been built cleanly before — the live site
was previously served by the `brandos-staging` project, which masked two
build-time prerender bugs in the Phase-1 code. Both are now fixed:

1. **Auth pages were statically prerendered.** `/dashboard` and
   `/migrate-account` call `getCurrentUser()` → `createServerSupabaseClient()`,
   which throws `Missing Supabase environment variables` during build prerender.
   Fix: `export const dynamic = 'force-dynamic'` on both pages (correct for
   auth-gated pages anyway).
   - `main`: commit `da3a5c0` · `staging`: cherry-pick `8010644`
2. **`/tier-list` (ISR) queried the DB at build.** `getTierListData()` threw
   `PrismaClientInitializationError` when the DB was briefly unreachable
   (Supabase mid-wake), failing the whole build. Fix: wrap the queries in
   try/catch and return empty tiers; ISR backfills once the DB is reachable
   (`src/lib/tier-list.ts`).
   - `main`: commit `e5791dd` · `staging`: cherry-pick `99000ed`

Note: `main` also contains two throwaway empty commits (`a3374c0`, `8df6f83`)
that were only used to re-trigger Vercel deploys. Harmless; ignore them.

The Supabase pause/billing issue was a **red herring** for the build — the
errors were prerender bugs, not connectivity. (Reactivating Supabase was still
required for runtime DB access.)

---

## 4. Branch & deploy model (quick reference)

| Branch | Vercel project | Domain | Role |
| --- | --- | --- | --- |
| `main` | `brandos` | `mybrandos.app` | Production. Canonical. Only promote here when green. |
| `staging` | `brandos-staging` | (preview domain) | Active development lane. Do work here. |
| `feat/phase-1-account-model` | — | — | Original Phase-1 branch (merged into both lines). `ahead 9` on origin; now historical. |

Promotion path: `feature → staging → main` (env-aware — see §2). Full details in
`docs/SOLO-DEPLOY-WORKFLOW.md`.

---

## 5. Working tree / untracked files

`.gitignore` (on `staging`) now ignores `.vercel*` and `data/*.csv`. The
following are intentionally untracked — **do not commit** without a reason:

- `data/*.csv` — contain PII (email signup exports). Keep out of git.
- `.vercel.staging/`, `.vercel/` — local Vercel project links.
- `api-examples/`, `interview-coach-skill/`, `verity-trainer/`,
  `docs/verity-launch-v3-assets/` — side projects / large assets.

---

## 6. Next steps (recommended order)

1. **Start the Minimum Launch Bar on `staging`.** Read
   `docs/MINIMUM-LAUNCH-BAR.md`. The gaps still open last we checked were the
   prompt-safety guard (`src/lib/prompt-safety.ts`) and output validation
   (`src/lib/score-schemas.ts`), plus legal pages (`/privacy`, `/terms`) and key
   rotation. Verify current state before assuming.
2. **Decide the Supabase var-name endgame** (see §2) so promotion stops being a
   manual env dance.
3. **Promote to `main` only when green**, env-aware. Verify production with the
   health checks in §7 after every promotion.

---

## 7. How to verify production is healthy

After any production deploy, these should all hold (logged-out):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://mybrandos.app/            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://mybrandos.app/tier-list   # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://mybrandos.app/dashboard  # 307 -> /signup
curl -s -o /dev/null -w "%{http_code}\n" https://mybrandos.app/tier-list/somerandomnobody123  # 200 (graceful "not found")
```

A `500` on `/tier-list/<user>` means the DB is unreachable at runtime or an old
deploy is still serving.

---

## Knowledge base

Read these for the full picture (all live on `staging`):

- `docs/CURRENT-STATE.md` — current product/codebase reality.
- `docs/DECISIONS.md` — append-only log of why things are the way they are.
- `docs/SOLO-DEPLOY-WORKFLOW.md` — the Vercel branch/deploy workflow.
- `docs/MINIMUM-LAUNCH-BAR.md` — the bar to take money + target timeline.
- `docs/SECURITY-HARDENING.md` — full multi-phase security plan.
- `docs/CONSTRAINTS.md` — solo-founder constraints, runway, revenue targets.
