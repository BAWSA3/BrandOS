# Launch: dashboard + title screen → prod

Prepared 2026-10-12. Promotion of `staging` → `main` (PRs #50–#120). Held until
Jeffrey's go (X tease first). The aim: launch day is one "go".

## What goes live

**The product (demo-week work)**
- Sign-in lands on the title screen (`/home`), with the real station, score and Brand Pass (#100).
- Dashboard (#100–#116):
  - XP and streaks.
  - Score drill-down with timeline, phase views and full scan reports.
  - Rescan, which saves to the account.
  - Station tile (day/night).
  - Brand Pass share and download.
  - Touch feel and sounds.
- Photoreal 3D stations on station pages, the scan card and the main menu (#93–#99, #106, #119).

**Also public, and worth a conscious yes**
- #50 / #51: claim your station with X; the polaroid wall on station pages.
- #60 / #61: BrandOS MCP (keyless `analyze_post` / `analyze_profile`), and MCP links that land on a running scan.
- #105: the homepage scan ends on the score card plus **Get The Full Breakdown** (email). This replaces the station card and reservation form.
  - #104, the main-based copy of #105, is still open. Close it when promoting, because the promotion includes #105.
- #114: new link previews.
  - Station: 3D art.
  - `/scan` and `/card`: real scores, no URL spoofing.
  - Homepage: a 1200×630 card.

Already on prod via hotfixes: #55/#56 (as #57) and the security fix (#117 plus migration 031).

## 1. Database (before the code)

Run the preflight. It is read-only and exits 1 on any blocker:

```bash
node --env-file=.env.prod.local scripts/launch-preflight.mjs
```

On 2026-10-12, prod had **3 blockers**: `Station`, `StationNote`, `NoteReport`. Apply:

```bash
node --env-file=.env.prod.local scripts/apply-migration.mjs supabase-migrations/026_stations.sql
node --env-file=.env.prod.local scripts/apply-migration.mjs supabase-migrations/027_station_notes.sql
# optional (API v1 usage logging has been failing quietly without it):
node --env-file=.env.prod.local scripts/apply-migration.mjs supabase-migrations/032_api_usage_log.sql
```

Re-run the preflight. It should finish with `✓ ready`.

All of these migrations are additive and idempotent (`IF NOT EXISTS`). They are safe while the old code is still live.

Already on prod: 016, 018–020, 029, 031. Not needed: 030, which is a no-op on prod.

## 2. Environment (Vercel, `brandos` production)

Checked 2026-10-12 by name only, and all are present:
- RESEND_API_KEY, EMAIL_FROM, NEXT_PUBLIC_APP_URL
- DATABASE_URL, DIRECT_URL
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- ANTHROPIC_API_KEY, GOOGLE_GEMINI_API_KEY, SOCIALDATA_API_KEY
- MOTION_PLUS_TOKEN, X_OAUTH_ENCRYPTION_KEY, INTERNAL_API_SECRET

Missing, but not used by anything launching: Stripe, the social connectors, PostHog, the extension.

## 3. Promote

1. Open the PR `staging` → `main`. Confirm CI is green, including "Lint & Type Check", which only runs against `main`.
2. Merge, then watch the `Vercel – brandos` deploy.

## 4. Smoke test on mybrandos.app (right after deploy)

- [ ] Homepage scan → score card → **Get The Full Breakdown** → email arrives with the right score.
- [ ] Sign in with X → lands on `/home` (title screen, PRESS START, your station).
- [ ] Continue → `/dashboard`:
  - [ ] Bento with score, history and phases.
  - [ ] Score panel, timeline, phase view and scan report all open.
  - [ ] Station tile switches day/night.
  - [ ] Share ↗ downloads the pass.
- [ ] Main menu **Rescan** → overlay → new score saved. Rescan costs AI credits and is capped at 5/day.
- [ ] `/station/jbawsa` → 3D loop.
  - [ ] Post the link in X's composer and check the preview card. Don't send it.
- [ ] Unsubscribe link from a test email → `/unsubscribe?success=true`, and the row is `unsubscribed`.
- [ ] `node --env-file=.env.prod.local scripts/launch-preflight.mjs` → `✓ ready`.

## 5. Rollback

- **Code:** Vercel → `brandos` → Deployments → promote the previous production deployment (instant). Or revert the merge PR.
- **Database:** nothing to undo. Every migration above only adds tables and locks access, and the old code ignores the new tables.
