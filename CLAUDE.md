# BrandOS — agent orientation

**Read `docs/AGENT-PROTOCOL.md` first** — multi-agent coordination contract
(PR-based sign-off, roles, hard rails). Non-negotiables:

- All work lands as PRs into `staging`; never push `staging`/`main` directly.
- Never run DB migrations (write SQL to `supabase-migrations/`, Jeffrey applies).
- Backend changes: run the security guardrail + `npm run test:rls` + `npm run test:safety`.

## Orientation

- Product: brand intelligence for creators (X scan → score → coaching).
  Prod: mybrandos.app (`main`). Staging: brandos-staging-five.vercel.app (`staging`).
- Stack: Next.js App Router + Prisma + Supabase (RLS) + Stripe + Vercel.
- Auth: `getCurrentUser`/`getCurrentWorkspace` from `src/lib/auth.ts` (Phase 1
  workspace model). Legacy `sb-access-token` cookie routes are being retired.
- Active effort: /app → /dashboard consolidation, `docs/SPLIT-BRAIN-CONSOLIDATION.md`.
- Terminal UI primitives for dashboard surfaces: `src/components/dashboard/terminal-ui.tsx`.
- Tests: `npm run test:rls`, `test:safety`, `test:deletion`, `test:webhooks`.
