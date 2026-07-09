# Decisions — what's settled and why

Append-only log. Each entry: date, decision, rationale, trade-off, revisit condition.
The point: stop re-litigating settled calls.

---

## 2026-03 — X API: SocialData.tools as primary
Chose SocialData over X Basic tier (~$100/mo → ~$0.0002/req).
X free tier kept as fallback.
Trade-off: third-party dependency on SocialData's uptime.
Revisit if: SocialData breaks, rate-limits us, or goes away.

## 2026-04-?? — Brand scoring: Claude Haiku, not Gemini
Swapped mid-launch (commit dd1d91f). Haiku scored archetypes more
accurately on edge cases in week-1 data.
Trade-off: slightly higher per-call cost vs. Gemini.
Revisit if: latency becomes user-visible, or cost scales past budget.

## 2026-04-?? — Archetype classification: tweet-based with signal engine
Moved from profile-only to tweet-based classification (commits 356a204,
ed7a5ca). Signal detection engine added for accuracy.
Revisit if: free-tier SocialData costs balloon, or accuracy regresses.

## 2026-04-?? — Rename SIGNAL_SAGE → SOURCE
Archetype rename across assets, pricing, billing (commit 774331a).
Revisit: unlikely — treat as final.

## 2026-04-12 — Security hardening gates monetization
"No paying customers until the hardening plan is green. Trust is the
product." Multi-phase plan in SECURITY-HARDENING.md: staging env,
account-model rebuild, RLS, encrypted tokens, key rotation, CSP.
Trade-off: delays first revenue (the explicit cause of the April→May
slip). Accepted because over-permissive RLS = leaked data = no trust.
Revisit if: runway forces revenue before "green," in which case define
a reduced minimum bar rather than abandoning the principle.

## 2026-04-13 — Account model rebuild (workspaces, not solo users)
Moved from a flat user model to Workspace / WorkspaceMember / role-based
access, workspace-scoped BrandScan, plan limits in DB, audit log.
Lives on feat/phase-1-account-model (not merged).
Trade-off: large surface area; grew the hardening timeline from ~4 to
~5 weeks and is the bulk of un-merged work.
Revisit if: the branch stalls — decide merge/park rather than letting it
rot un-merged.

## 2026-04-?? — Supabase API key migration (publishable/secret)
SUPABASE_SERVICE_ROLE_KEY → SUPABASE_SECRET_KEY, ANON_KEY →
PUBLISHABLE_KEY across ~30 files (Supabase's new key scheme).
Trade-off: must set new env vars in every Vercel env group before this
ships or auth breaks. Currently uncommitted in the working tree.
Revisit: none — this follows Supabase's platform change.

## 2026-04 — Worlds V2: manifest-driven themed dashboards
Replaced the legacy seasonal-phase world with a manifest engine
(palette/type/motion/microcopy/audio/OG per world). Custom/premium
worlds as a paid feature (PlanLimit flags). Only terminal-os registered.
Trade-off: new product surface area while pre-revenue — flag against
CONSTRAINTS ("one bet per week").
Revisit if: it isn't pulling its weight on activation/retention by the
time the account model merges.

## 2026-04-13 — Drop partner API + Kreatorsverse; scanning becomes own-handle-only
Per SECURITY-HARDENING.md resolved decisions: "No partner API for now.
Kreatorsverse engagement dropped." The /api/v1 cross-handle key path is
removed in Phase 2 — you must sign in to BrandOS AND connect the target
X handle via OAuth to scan it (kills the impersonation vector).
Trade-off: removes the "API is the B2B wedge" thesis and the named
enterprise prospect; raises free-scan friction (account + X OAuth now
required, vs. the unauthenticated handle-entry that drove 5,400 wk-1 scans).
Revisit if: a concrete B2B buyer reappears, or the auth-gate tanks
top-of-funnel scan volume (watch activation after Phase 2).

## 2026-04 — Onchain attestations (EAS on Avalanche/Base)
Added OnchainAttestation model + /api/onchain/* to attest brand-dna,
content, score, and health onchain. User.walletAddress added.
Trade-off: web3 scope with no supporting strategy/decision/customer-voice
entry — risks being scope creep against the revenue goal.
Revisit BEFORE further investment: is there a customer or revenue thesis?
If not, this is a Parked candidate, not an active bet.

## 2026-07-08 — First dollar: Score Boost Audit ($19)
Chose the anonymous $19 Score Boost Audit over PRO ($29/mo) as the
first-sale target. Rejected leading with subscriptions because that path
depends on the unresolved tier reconciliation (pricing page AGENCY vs.
internal MAX/TEAM model) and on the auth-gated funnel converting.
Why — the audit is sold from the free-scan reveal with zero signup
friction, and its pipeline is already hardened (BotID, webhook
idempotency, validated LLM output, no heuristic fallback on paid output).
Consequences shipped same day: removed the wrongly-applied assertCanScan
from /api/audit/run (it rejected every anonymous buyer after payment,
contradicting SECURITY-HARDENING resolved decision #18 "audit reports
stay à la carte"); abuse bounded instead by paid-session verification +
BotID + IP/session rate limits. Mounted the orphaned ScoreBoostAuditCta
in the reveal state (the product previously had no purchase entry point).
Trade-off: one-time revenue, not MRR; cross-handle audits stay possible
by design (you can buy an audit of any public handle).
Revisit if: audits sell but don't convert buyers into accounts, or
cross-handle audits draw abuse complaints.

## 2026-07-08 — Tier reconciliation: map, don't rename
The pricing page keeps selling FREE/PRO/AGENCY/ENTERPRISE (legacy
SubscriptionTier); the internal Phase 1 model (FREE/PRO/MAX/TEAM/
ENTERPRISE PlanTier) stays canonical for limits. `legacyTierToPlanTier`
(AGENCY→TEAM, CREATOR→FREE) translates at the Stripe webhook, which now
also syncs the buyer's personal `workspace.plan` — previously NOTHING
wrote workspace.plan, so a paying subscriber kept FREE scan/connection
caps forever. Rejected renaming the public page to MAX/TEAM now: no
Stripe prices exist for those tiers and renaming is post-revenue work.
Trade-off: two tier vocabularies live on (bounded by the mapping fn).
Revisit if: MAX is ready to sell, or the AGENCY→TEAM label confuses a
real buyer.

## 2026-07-08 — Defer the payments flip; build product first
Deliberate deferral, not drift: all payment CODE is done and green
(audit path fixed, webhook plan sync, acceptance suites 57/57). The
remaining ~30 min of dashboard config (Stripe $19 price, prod Stripe
env vars, PostHog key, staging test purchase) is parked in favor of
refining the core scan → dashboard experience.
Why — founder call: product quality over first-dollar timing.
Trade-off knowingly accepted: the Jul 13 first-customer target slips
unless the config happens in parallel; this repeats the April/May
pattern the launch bar was written to break.
Revisit: this entry is the tripwire — if no paying customer by
2026-07-20, do the 30-minute config before ANY further product work.

---

## Template for new entries

## YYYY-MM-DD — [Decision in 5 words]
What you chose and rejected.
Why — the constraint or insight that tipped it.
Trade-off you're accepting.
Revisit if: [concrete signal that would reopen this].
