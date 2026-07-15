# Split-brain consolidation: /app vs /dashboard — scoping

_2026-07-09. Input for the consolidation decision. Grounded in a three-way
codebase survey: /app feature inventory, client-vs-server data-layer map,
and a full navigation/entry-point census._

## The fact that reframes everything

**`/app` is already dead in production.** It is not in the middleware
allowlist (`src/middleware.ts:8-32`), so every visit 307-redirects to `/`.
Same for its whole satellite cluster: `/content-engine`, `/conductor`,
`/agents`, `/try`, `/phantom`, `/growth-plan`. Meanwhile every auth surface
(callback default, signup, migrate-account, save prompts) already lands on
`/dashboard`.

So this is not "pick between two live dashboards." It is: **the product's
authenticated home is /dashboard; a large body of feature work is stranded
in an unreachable legacy shell.** The real question is which features to
rescue, and how.

Immediate casualties of the stranding (fix regardless of option):

- `pricing/page.tsx:106` — the PRICING PAGE CTA links to blocked `/app` →
  bounces buyers to the homepage.
- `useAuth.ts:95` — post-OAuth `replaceState` to `/app`.
- ~12 more dead `/app` links across agents/conductor/content-engine/try/
  phantom/growth-plan (census section below has the full list).
- `useAuth.signOut` does not clear `brandos-storage` / `brandos-brandkit-
  storage` → **previous user's brand DNA/voice samples visible to the next
  login on a shared browser.** Privacy bug independent of any option.

## What's stranded in /app (inventory summary)

Crown jewels (real APIs, complete UIs, retention-driving):

| Feature | State | Server persistence today |
|---|---|---|
| Content Check (score + live tone + authenticity + rewrite) | Complete — this is the core loop | APIs real (`/api/check`, `/api/analyze-tone`, voice-fingerprint routes); results client-only |
| Brand DNA editor + 8-step onboarding wizard | Complete | Synced to `Brand` via `/api/brands` (7 core fields only) |
| Voice Fingerprint | Complete; supposed to be PRO but renders ungated | `Brand.voiceFingerprint` column exists, sync drops it |
| Import Hub (URL/images/PDF/social → brand) | Complete, ~3.7k LOC | APIs real; output feeds client store |
| Content Calendar | Complete, PRO-gated | Real server persistence (`ContentDraft`) |
| AI Studio (Gemini asset generation) | Complete, 1.6k LOC | APIs real; assets in localStorage kit store |

Cruft (orphan tabs, dead code, client-only): Brand Memory, competitor
analysis, taste/context/visual orphan tabs, page-level `kit-*` branches,
thin client-side analytics card. The `/app` shell itself is a single
2,453-line client component.

Data layer reality: roughly **one-third of /app's data has a ready server
home** (Brand DNA wired; history + voice fingerprint have models/routes but
aren't wired), **two-thirds needs new schema** (safe zones, brand memory,
design intents, phase progress, full brand-kit assets). Cross-cutting
defects to fix in any migration: browser-global localStorage blob (not
keyed per user), local uuid vs server cuid id mismatch (`useBrandSync`
re-creates duplicates), `/app` never hydrates from the server.

## Status ledger (update in the same PR that ships each step)

| Step | Status | Landed |
| --- | --- | --- |
| 1. Dead links + logout leak | ✅ shipped | `742aa9d` (staging, 2026-07-12) |
| 2. Foundation (Brand↔Workspace, hydration) | ✅ shipped | `303c88f` + migration 014 (staging applied; prod at next promotion) |
| 3. Brand DNA + onboarding wizard | ✅ shipped | `47bb008` (3a) + `5d9998b` (3b) |
| 4. Content Check | ✅ shipped | PR #3 |
| 5. Voice Fingerprint | ✅ approved | PR #4 → re-landed as PR #5 (awaiting merge) |
| 6. Content Calendar | ✅ in PR | `/dashboard/calendar` + `/api/calendar/*` and `/api/repurpose` rewritten on `getWorkspaceContext` (off the dead sb-access-token cookie); repurpose hardened (PRO gate on workspace.plan, BotID, prompt fencing, claude-sonnet-5); migration 015 backfills `Workspace.plan` from `subscriptionTier` for pre-Phase-1 subscribers |
| 7. Import Hub | ⬜ next | — |
| 8. Defer/kill list | ⬜ | — |

Preview harnesses: `/world-preview?wizard=1`, `?dna=1`, `?check=1`, `?voice=1`,
`?calendar=1`. Legacy routes still on the dead cookie auth migrate as each
feature ports (remaining: brands/me, brands/share, drift-alerts, import).

## Option A — /dashboard is home; rescue features onto the workspace model

Port the crown jewels one at a time into the Phase 1 architecture
(server components, Prisma/RLS, workspace-scoped, plan-gated). The shell
already exists and just got its scan/history overhaul.

Phasing (each step ships independently):

1. **Unbreak the dead links + logout leak** (hours). Point the ~14 dead
   `/app` hrefs at `/dashboard` (or hide), fix `useAuth` post-login target,
   clear client stores on signOut. Do this week regardless.
2. **Foundation** (1–2 days). Tie `Brand` to `Workspace` (FK or scoped
   queries), server-first hydration hook to replace `useBrandSync`'s
   push-only model, fix id reconciliation.
3. **Brand DNA + onboarding** (1–2 days). Port editor + wizard onto the
   workspace brand; onboarding doubles as the /dashboard first-run
   experience it currently lacks.
4. **Content Check** (1–2 days). The core loop. APIs already real; port UI,
   persist results to `HistoryEntry` (route already exists, never wired).
5. **Voice Fingerprint** (1 day). Wire the existing column through sync;
   apply the PRO gate it was supposed to have.
6. **Content Calendar** (0.5–1 day). Already server-persisted + gated;
   mount under /dashboard.
7. **Import Hub** (1–2 days). Components are self-contained; re-point output
   at the workspace brand.
8. **Defer:** AI Studio + brand-kit canvas (needs new asset schema), content
   workflow graph (pick between it and the simpler generator first).
   **Kill:** Brand Memory, orphan tabs, dead kit branches.

**Total: ~1.5–2.5 focused weeks for the core loop (steps 1–6), with
shippable value every step.**

Risks: porting temporarily loses any data users had in localStorage (prod
reality: /app is unreachable, so nobody is accumulating data there — the
loss is theoretical); 2,453-line component means extraction, not lifting.

## Option B — resurrect /app as the shell; fold /dashboard into it

Allowlist `/app`, then bring the workspace model to it: per-user keying of
the store, logout clearing, id reconciliation, server hydration, move scan/
connections/history UI in, apply plan gates at the feature layer.

Why it costs more for a worse end-state:

- You do **all the same persistence work as Option A** (the data layer is
  the hard part), but inside a monolithic client component that fights the
  App Router/server-component architecture Phase 1 standardized on.
- The security model regresses: /app is localStorage-first with API-layer
  auth only; Phase 1 is RLS + workspace scoping end-to-end. The hardening
  investment (migrations 004–011, the RLS acceptance suite) protects the
  server path — re-centering on a client-store shell sidelines it.
- Still ends split-brain: /dashboard's scan/connection surface must be
  ported INTO /app (net extra work), or both stay alive (status quo).
- Estimate: **2.5–3+ weeks** with a riskier cutover (all-or-nothing
  allowlist flip vs Option A's incremental ports).

What Option B has going for it: the /app shell's UX (phase navigation,
progressive unlock, polish) is genuinely better than /dashboard's current
skeleton. But that's an argument for **porting the phase-navigation UX
pattern** into /dashboard during step 3 — not for adopting the legacy data
model underneath it.

## Recommendation

**Option A.** Production routing, the auth flow, the security architecture,
and the Phase 1 investment all already point at /dashboard. Option B spends
more to re-legitimize a data model (browser-global localStorage) that has
an active privacy bug and no per-user keying. Adopt /app's best UX ideas
(phases, onboarding, progressive unlock); keep the workspace data model.

Suggested first move either way: **step 1 (dead links + logout leak) —
it's hours, it fixes the pricing-page CTA, and it's required under both
options.**
