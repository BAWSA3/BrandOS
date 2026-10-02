# BrandOS — Current State Snapshot

_Last updated: 2026-07-08 (post-Phase-1-promotion refresh). Previous full reconciliation was 2026-06-15. Regenerate periodically so Claude.ai Project context stays accurate._

## One-liner
A creator-economy intelligence layer. Users scan an X handle → get a brand score, creator archetype, strengths/gaps, and an actionable narrative. Free scan is the top-of-funnel; paid features sit behind PRO/AGENCY tiers; a public API is the B2B wedge.

---

## ⚠️ Read this first — repo reality as of 2026-07-08

**The June reconciliation crisis is resolved.** Phase 1 (account model + security hardening) was merged `staging` → `main` and **promoted to production on 2026-07-05** (merge `ba241a8`, execution log in `docs/`). `main` and `staging` are in sync and pushed to origin; the previously at-risk uncommitted work (Worlds V2, docs knowledge base, migrations, scripts) was committed during the June 15–18 snapshot work. `feat/phase-1-account-model` is superseded — its work reached `main` via `staging`.

**Launch-bar status (see `MINIMUM-LAUNCH-BAR.md`):** Weeks 1–3 are done —
- Week 1 (data isolation + auth gate): RLS validated/repaired (migrations 010/011, `npm run test:rls` 13/13), partner API path removed, `/api/x-tweets` rate-limited.
- Week 2 (prompt safety + output validation): `prompt-safety.ts` + `score-schemas.ts` shipped (`npm run test:safety` 21/21).
- Week 3 (payment-legal + infra): GDPR account-deletion route, TOS/privacy acknowledgment at signup, Vercel BotID on scan/checkout, Stripe webhook idempotency — all landed and promoted 2026-07-05.

**Current work: Week 4 (Jul 6–12) — validate the gated funnel + go-live.** Instrument signup→connect→scan drop-off, pick the first-dollar pricing entry point, final Phase 8 acceptance, flip on payments. Target: first paying customer by 2026-07-13.

---

## Live on `main` (shipped, in production)

### Core product
- **Free scan flow**: handle input → journey/walkthrough → reveal card. Unlimited scans, unauthenticated.
- **Archetype classification**: tweet-based with signal detection engine.
- **Brand scoring**: Claude Haiku (swapped from Gemini, commit `dd1d91f`).
- **Scan tracking + history**: persisted in Supabase (`user_profiles`, `BrandScans`).
- **Dashboard**: `/app` — score history card, posts, basic analytics.
- **Pricing page**: `/pricing` — FREE / PRO ($29/mo) / AGENCY ($99/mo) / ENTERPRISE.
- **Landing + hero**: `XBrandScoreHero`, hybrid terminal/code aesthetic.

### Growth / viral
- **Find Your Opp** (`/opp`): matchup feature. Auto-match or manual challenge + roast prompt.
- **Tier list** (`/tier-list`): leaderboard/ranking view.
- **Shareable cards** (`/card`, `/test-cards`): PFP-embedded score cards via image proxy.

### B2B / platform
- **Public API v1** (`/api/v1/*`): DB-backed keys (`ApiKey`, `ApiUsageLog`), tiered rate limits. Endpoints: `score`, `archetypes`, `batch`, `history`, `keys`, `leaderboard`, `profile`, `usage`. Docs at `/api-docs`. ⚠️ **The hardening plan removes the partner/cross-handle API path in Phase 2** (`SECURITY-HARDENING.md`) — scanning becomes auth-required + own-handle-only. The public B2B API is effectively being deprecated, not extended.
- **Enterprise page**: `/enterprise`.

### Monetization primitives (live but adoption unknown)
- **Stripe checkout** (`/api/stripe/*`) + one-time products in `src/lib/plans.ts`: Intelligence Report ($4.99), Archetype Deep-Dive ($9), Score Boost Audit ($19), Brand DNA Deep-Dive ($39).
- **Newsletter** (`/api/newsletter/*`) + unsubscribe flow.

### Infrastructure
- Next.js 16 App Router, React 19, Tailwind 4, Prisma + Postgres, Supabase for auth/storage.
- **SocialData.tools** primary X API; X free tier fallback.
- Claude (Anthropic SDK), Gemini, Cloudinary, Resend, PostHog, Sentry. Hosted on Vercel.

---

## The big shift since April: a security-hardening + account-model rebuild

This is the dominant initiative and the reason the April paying-customer goal slipped. Lives on **`feat/phase-1-account-model`** (not merged) and in `docs/SECURITY-HARDENING.md` (multi-phase plan).

**Guiding principle from the plan: "No paying customers until this plan is green. Trust is the product."** So this work is explicitly gating monetization.

### What's built on the branch
- **Phase 0 — Staging**: `brandos-staging` Supabase + Vercel project, `staging` branch, parallel env groups. Baseline SQL in `supabase-migrations/staging-setup/`. `.vercel.staging/` linked (gitignored).
- **Phase 1 — Account model + data isolation** (new Prisma models): `Workspace`, `WorkspaceMember`, `CustomWorld`, `PlanLimit`, `BrandScan` (workspace-scoped), `AuditReportShare`, `SecurityAuditLog`. New enums (`PlanTier`, `WorkspaceRole`, `ScanVisibility`, `ScanStatus`, `AuditEventCategory`, `UserRole`, `AccountMigrationStatus`).
- **Auth**: multi-provider Supabase Auth (email/Google — Apple buttons removed, no dev account), workspace auto-creation, `/signup`, `/dashboard`, `/migrate-account` (legacy credential migration), multi-provider callback.
- **Guards/infra**: `assertCanScan` scan guard, DB-driven plan limits, RLS policies (migrations `004`, `005`), libsodium key encryption (ciphertext token columns on `PlatformConnection`), audit logger, admin client.
- **Migrations**: `004_phase1_account_model.sql`, `005_phase1_rls_policies.sql`, `006_make_x_fields_nullable.sql`.
- **Docs**: `SECURITY-HARDENING.md`, `PHASE-0-EXECUTION.md`, `PHASE-1-SCHEMA.md`, `KEY-ROTATION-CHECKLIST.md`, incident-response playbook, `SECURITY-FALSE-POSITIVE-TOLERANCE.md`.

### In-progress key rotation (uncommitted, in working tree)
The Supabase API-key migration is applied across ~30 files but not committed:
`SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. One coherent change; safe to commit as a unit (but verify env vars are set in all Vercel env groups first).

---

## New feature layer (committed on the branch, NOT in any prior state doc)

A large content-ops surface was synced onto `feat/phase-1-account-model` (commit `85d377f`). New Prisma models back these:

- **Brand Health** (`/api/brand-health/*`): `BrandHealthSnapshot` — composite 0–100 across completeness/consistency/voice/engagement/activity, with trend tracking.
- **Content Intelligence** (`/api/content-intelligence/*`): `ContentNiche`, `ViralBenchmark`, `PerformanceSnapshot`, `GapAnalysis` — niche monitoring, viral benchmarking, performance windows, gap analysis.
- **Drift Alerts** (`/api/drift-alerts/*`): `DriftAlert` — flags brand-score/dimension drops.
- **Content Calendar** (`/api/calendar/*`): `ContentDraft` — drafts, scheduling, repurpose chains.
- **Cross-platform content** (`BrandContent`), **Visual DNA** (`BrandVisualDNA`), **Approval workflows** (`ApprovalRequest`).
- **Creator Portfolio**: `Deal`, `Invoice`, `Transaction` models.
- **Onchain attestations** (`/api/onchain/*`): `OnchainAttestation` — EAS attestations on Avalanche/Base for brand-dna/content/score/health. `User.walletAddress` added. ⚠️ **Scope-expansion flag**: web3 attestation isn't referenced in any strategy/decision doc; sanity-check it against CONSTRAINTS before investing more.
- **X feed / repurpose / growth-plan** routes.

> Status caveat: these routes exist as committed code but their production-readiness, test coverage, and gating are unverified. Treat as "built, not validated."

---

## Worlds V2 — themed dashboards (uncommitted, untracked)

A manifest-driven theming engine that re-skins the whole dashboard (palette, typography, motion, microcopy, audio, OG cards) per "world."

- Runtime: `src/worlds/` (`types.ts`, `index.ts`, `fallback.ts`, `og-manifests.ts`, `terminal-os/`) + `src/components/world/` (`WorldProvider`, `WorldScene`, `StaticFallback`, `MuteButton`, `audio.ts`, `scenes.ts`, `variants.ts`). Legacy seasonal-phase world being retired.
- Preview route: `/world-preview` (allowlisted in middleware, dev/unauth).
- Registered worlds: only **`terminal-os`**. **`bonsai-garden`** is spec'd at stage 1 only (`docs/worlds/bonsai-garden/spec.md`).
- Monetization hook: `PlanLimit.customWorldBuilderEnabled` + `premiumWorldsEnabled`; `Workspace.activeWorldId` / `customWorldId`; `CustomWorld` model + RLS (migration `008`).
- Authoring docs: `docs/worlds/world-spec-template.md`, `prompt-library.md`.

---

## VERITY launch page — spec only, not built

`docs/verity-launch-v3-spec.md` — clean/minimal/editorial landing for a `/launch` route (Pokémon-card showcase, gacha + minesweeper). **No `src/app/launch/` exists yet.** Open questions: Pokémon licensing, accent color, waitlist target, dark-mode override. Design-handoff stage.

---

## Plan tiers (Phase 1 model — note: differs from live pricing page)

`PlanLimit` seed (`supabase-migrations/staging-setup/02_post_baseline.sql`) defines: **FREE / PRO / MAX / TEAM / ENTERPRISE** with per-plan scans/day, X accounts/seat, multi-platform, watchlist, scheduled rescans, priority queue, world-builder, premium worlds. This is the new internal model; the public `/pricing` page still shows FREE/PRO/AGENCY/ENTERPRISE. **Reconcile before launch.**

### Gated behind PRO (live, `src/lib/gate.ts`)
Voice Fingerprint, Content Calendar, AI Agents (research, gap-analysis, content, campaign, authority, analytics, market-scanner, performance-tracker, GTM strategist), Content Engine, Conductor, Growth Plan, Brand Sharing, Intelligence Report.

### Gated behind AGENCY
API Access, Advanced Analytics, White-Label Reports, Custom Integrations.

### Gated behind ENTERPRISE
SSO / SAML.

---

## Goal status — needs an explicit re-anchor

- Original: **first paying customer by end of April 2026.**
- Revised in `SECURITY-HARDENING.md` (2026-04-13): _"End-of-April target is no longer realistic — re-aim at mid-to-late May."_
- Re-anchored 2026-06-15: adopted a reduced "minimum safe bar" (`MINIMUM-LAUNCH-BAR.md`) instead of the full 9-phase gate. **Target: first paying customer by ~2026-07-13.**
- **Status 2026-07-08: on track.** Weeks 1–3 of the launch bar are green and promoted to prod (2026-07-05). Week 4 (funnel validation + flip on payments) is in progress with 5 days to target.
- Constraints unchanged: solo founder, ~$25k debt, runway in months, $15–20k/mo target, no paid marketing. (See `CONSTRAINTS.md`.)

---

## Known active workstreams / context
- **Kreatorsverse (B2B lead) — DROPPED.** Per `SECURITY-HARDENING.md` resolved decisions (2026-04-13): "No partner API for now. Kreatorsverse engagement dropped." The cross-handle API key path is removed in Phase 2. (The April snapshot listed this as the active enterprise prospect; it is no longer.)
- **Content/voice system** (`docs/content/*` + `scripts/extract-voice.ts`, `send-newsletter.ts`) — voice extraction, audience, content meta-tracking for `@BawsaXBT` / `@BrandOS`.
- **Investor/strategy deck**: `docs/01-21*.md` (executive summary → investor summary), `GROWTH-PLAN-33K-TO-50K.md`, `BRAND-GROWTH-SYSTEM.md`, `BRANDOS-WORKFLOW-MAP.md`.

---

## Metrics (week 1 post-launch — see `project_soft_launch_metrics.md`)
- 5,400 scans · 4,100 unique handles · 890 signups.

---

## Deploy model (reconciled 2026-06-15)
Production (`brandos`/mybrandos.app) tracks `main`; `main` is now an honest mirror of what's live. Build happens on `staging` -> `brandos-staging`, promoted to `main` only when green. Full rules: `SOLO-DEPLOY-WORKFLOW.md`.

## Reconciliation TODO (updated 2026-07-08)

Items 1–3 of the June backlog are **done** (uncommitted work snapshotted; Phase 1 merged via `staging` → `main` and promoted 2026-07-05; goal re-anchored to Jul 13 via `MINIMUM-LAUNCH-BAR.md`). Still open:

1. **Reconcile plan tiers** — ✅ resolved 2026-07-08 (see `DECISIONS.md`): pricing page keeps selling legacy FREE/PRO/AGENCY; `legacyTierToPlanTier` maps to the internal PlanTier model, and the Stripe webhook now syncs `workspace.plan` on subscription events (it previously never got written — paying users would have kept FREE limits).
2. **Sanity-check scope creep** — onchain attestations, Worlds V2, VERITY launch stay parked until first revenue (see `CONSTRAINTS.md`, `DECISIONS.md`). Housekeeping 2026-07-08: unrelated side-project repos (`api-examples/`, `interview-coach-skill/`, `verity-trainer/`) moved out of this repo to `~/Documents/Bawsa Vibe Coding/`.

---

## What this doc is NOT
Not a roadmap, vision, or positioning doc. Those live in the Claude.ai Project files (`project_strategic_vision.md`, `project_april_goal.md`, etc.) and the numbered `docs/01-21*.md` deck. Use this doc to know **what already exists** so you don't rebuild it.
