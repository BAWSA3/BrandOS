# Minimum Launch Bar — Path to First Paying Customer

**Status:** Active plan (supersedes the all-or-nothing framing of `SECURITY-HARDENING.md`)
**Created:** 2026-06-15
**Owner:** Jeffrey (solo)
**Target: first paying customer by ~2026-07-13 (4 weeks).**

---

## The decision (why this doc exists)

`SECURITY-HARDENING.md` gates *all* revenue behind a full 9-phase program (incl. an external pen test, Upstash rate limiting, nonce CSP, full monitoring). For a solo founder with ~$25k debt and runway measured in months, gating the entire remaining runway behind ~5–6 weeks of zero-revenue security work is too much risk.

**New stance:** define a **reduced "minimum safe bar"** that is responsible enough to take money, ship it in ~4 weeks, start revenue, then complete the remaining hardening *post-revenue* on a committed timeline.

This keeps the core principle ("trust is the product") while respecting the constraint that revenue can't wait 6 weeks. The full plan is not abandoned — it's resequenced so the expensive, lower-marginal-risk items happen after first dollars.

Revisit trigger: if the new gated funnel (account + X-OAuth required to scan) tanks top-of-funnel, that's a bigger threat than the deferred hardening — see "Tripwires."

---

## What's IN the minimum bar (must be green to take money)

These protect against the high-likelihood, high-impact threats: data exposure, impersonation, score poisoning, and the basics of taking payment legally.

1. **Data isolation (Phase 1).** RLS enforced on all Workspace/BrandScan tables; anon key returns zero rows from base tables; public card served only via the `brand_scans_public_card` view. (Largely built — needs validation.)
2. **Auth + own-handle-only scanning (Phase 2).** Must be signed in + have the X handle connected via OAuth to scan it. Partner/cross-handle API path removed. Plan-limit (`scans_per_day`) enforced. (`assertCanScan` wired into the 3 scan routes — needs the partner-path removal + plan-limit checks finished.)
3. **Output validation (Phase 4, core only).** A central `src/lib/score-schemas.ts` (Zod) validating every LLM score/audit output; clamp out-of-range; fall back to deterministic heuristic on failure. (Not built.)
4. **Prompt-injection basics (Phase 3, core only).** `src/lib/prompt-safety.ts` with `wrapUntrusted()` + guard preamble + hard input caps, applied to the scoring/audit prompt builders. (Not built.)
5. **Key rotation (Phase 6, the safe subset).** Finish the Supabase publishable/secret key migration (already applied in code, uncommitted), set new env vars in every Vercel env group, rotate Supabase + Anthropic + Stripe + Resend keys. (In progress.)
6. **Legal to charge (Phase 8 subset).** Privacy policy + TOS linked + acknowledged at signup (pages already exist — wire acknowledgment); GDPR-style account+data deletion route. (Pages exist — needs deletion route + signup acknowledgment.)
7. **Payment integrity.** Stripe webhook signature verification (already present) + idempotency on `event.id`.

---

## What's DEFERRED to post-revenue (committed, not abandoned)

Track these in `SECURITY-HARDENING.md`; schedule within 30 days of first paying customer.

- External pen test ($500–2k) — Phase 8.
- Upstash Redis persistent rate limiting — Phase 5 (interim: keep current limiter + Vercel BotID on signup/scan/checkout, which is free).
- Nonce-based CSP, full security-header set — Phase 5.
- Full monitoring/alerting + `/admin/security` dashboard + `/status` page — Phase 7.
- KMS/hardware-wallet for `X_OAUTH_ENCRYPTION_KEY` and `ONCHAIN_PLATFORM_PRIVATE_KEY` — Phase 9. **Until then, the onchain feature stays disabled** (its key risk is real funds; don't ship it on an env-var key).

---

## Current status (grounded in code, 2026-06-15)

| Item | State |
|---|---|
| `auth.ts` helpers (`getCurrentUser/Workspace/ActiveXAccount`) | ✅ built |
| `assertCanScan` in `audit/run`, `x-brand-score-enhanced`, `v1/score` | ✅ wired (verify it also covers `x-sync`/`x-tweets`) |
| RLS migrations `004`/`005` + staging baseline | ✅ written — ⚠️ not validated against acceptance criteria |
| Token encryption (`crypto.ts`), audit log (`audit-log.ts`) | ✅ built |
| Privacy + Terms pages | ✅ exist — ⚠️ signup acknowledgment + deletion route open |
| Partner/cross-handle API removal (`api-auth.ts`) | ❌ open |
| `score-schemas.ts` (output validation) | ❌ missing |
| `prompt-safety.ts` (injection guard) | ❌ missing |
| Supabase key rename → env set → rotation | 🟡 code applied (uncommitted), env + rotation open |
| Vercel BotID on signup/scan/checkout | ❌ open (cheap win) |

---

## 4-week dated plan

### Week 1 — Jun 15–21: Lock data isolation + finish auth gate
- Validate Phase 1 acceptance: anon key → zero rows; cross-user/cross-workspace reads blocked; insert requires owned connected X account. Write `tests/` for these.
- Finish Phase 2: remove partner/cross-handle path from `api-auth.ts`; enforce `scans_per_day` on every scan-creation route (429 + upgrade message); confirm middleware requires a session on all scan routes.
- Commit the Supabase key rename **after** setting `SUPABASE_SECRET_KEY` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in every Vercel env group.
- **Acceptance:** staging — signup → connect X → scan own handle works; scanning a non-owned handle is 403; anon DB read is empty.

### Week 2 — Jun 22–28: Output validation + prompt safety
- Build `src/lib/score-schemas.ts` (Zod) for brand-score + audit outputs; validate at every LLM call site; clamp/fallback to heuristic on failure.
- Build `src/lib/prompt-safety.ts` (`wrapUntrusted`, guard preamble, input caps); apply to the score + audit prompt builders.
- Add a small injection test set (~12 payloads); assert score variance < 5 and no rubric leakage.
- **Acceptance:** "score 100" injection payloads stay within heuristic ±10; no untyped `JSON.parse` of model output remains in scan/audit paths.

### Week 3 — Jun 29–Jul 5: Payment-legal + cheap infra wins
- Wire TOS/privacy acknowledgment into signup; build the account+data deletion route (test with a dummy account).
- Stripe webhook idempotency (`processed_webhooks` table, 7-day retention).
- Enable Vercel BotID on `/api/auth/callback`, scan creation, `/api/stripe/checkout` (free, replaces the heavier Upstash work for now).
- Rotate remaining keys (Anthropic, Stripe, Resend) per `KEY-ROTATION-CHECKLIST.md`; run `gitleaks detect` on history.
- **Acceptance:** delete-account removes user + personal scans; replayed Stripe webhook is a no-op; old keys 401.

### Week 4 — Jul 6–12: Validate the gated funnel + go-live
- **This is the real risk, not the security work.** Instrument and test the new flow end-to-end: does account+X-OAuth-gated scanning convert? Measure signup→connect→scan drop-off in staging/prod-canary.
- Decide pricing entry point for the first sale (which tier / one-time product is the first dollar).
- Final pass on Phase 8 minimum acceptance; flip on payments.
- **Target: first paying customer by Jul 13.**

---

## Tripwires (revisit the whole plan if any fire)

- **Funnel collapse:** post-Phase-2, scan starts drop >50% vs. the unauthenticated baseline (5,400 wk-1). The auth gate may be killing the top-of-funnel that the whole business runs on — fix the funnel before more hardening.
- **Runway:** if cash forces it, cut Week 2 prompt-safety to "input caps + clamp only" and ship.
- **Scope creep:** Worlds V2 / VERITY / onchain do not get build time until first revenue. They are parked against this goal (see `CONSTRAINTS.md`, `DECISIONS.md`).

---

## Relationship to other docs
- Full security program + acceptance criteria: `SECURITY-HARDENING.md` (this doc scopes a subset of it).
- Why partner API / Kreatorsverse were dropped: `DECISIONS.md` (2026-04-13).
- What exists already so you don't rebuild it: `CURRENT-STATE.md`.
