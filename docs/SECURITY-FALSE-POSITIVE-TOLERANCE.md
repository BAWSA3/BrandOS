# Security False Positive Tolerance — Thinking Doc

**Purpose:** Decide, ahead of implementation, where BrandOS should be strict vs. lenient when detecting abuse, injection attempts, or suspicious activity. This is the companion to `SECURITY-HARDENING.md` — the hardening plan says *what* to build; this doc says *how sensitive to tune the dials*.

**Created:** 2026-04-12
**Why this doc exists:** Jeffrey's user base is creators. Creators are often edgy, political, sarcastic, NSFW-adjacent, or deliberately provocative in their bios and tweets. Tuning security too aggressively will reject legitimate users and kill the product's feel. Tuning too loosely invites the attacks the hardening plan is trying to prevent. This doc is the judgment framework.

---

## Core principle: asymmetric cost of errors

A false positive (legit user blocked) and a false negative (attacker succeeds) are not equally bad. They are differently bad depending on the surface:

| Surface | False positive cost | False negative cost | Bias |
|---|---|---|---|
| Signup / OAuth | User leaves, never returns. Permanent LTV loss. | Bot account created; detectable and reversible later. | **Lean lenient.** |
| Scan creation (own profile) | Creator can't see their own score. Rage quit. | Gamed score on own profile. Mostly self-deception. | **Lean lenient.** |
| Shareable card content | Legit creator's bio flagged, card looks broken. Public embarrassment. | Injected card shows weird content to followers. Also public embarrassment. | **Symmetric — investigate both.** |
| Paid audit | Paying customer's audit fails. Chargeback + support burden. | Attacker's injected audit returns garbage. Attacker's own problem. | **Lean lenient.** |
| Partner API (cross-handle) | Partner's integration breaks. Contractual issue. | Partner scrapes mass data. Major breach. | **Lean strict.** |
| Admin / internal tools | Ops slowed down. | Full system compromise. | **Lean strict.** |
| Stripe webhook | Payment not recorded. Refund war. | Fake payment accepted. Revenue loss. | **Symmetric — investigate both.** |

Rule of thumb: **the closer to the money or the wider the blast radius, the stricter the defense.** The closer to an authenticated user acting on their own data, the more forgiving.

---

## The three-tier response model

Instead of binary allow/block, every defense should produce one of four outcomes. This is how we avoid false-positive rage.

1. **Allow silently.** Default. No friction, no logging beyond baseline.
2. **Allow + flag.** User proceeds normally. A row goes into `security_audit_log` with the signal for later review. Used when we're suspicious but not confident.
3. **Soft-challenge.** User must pass an additional check: re-auth, CAPTCHA, email verification, or a rate-limit cooldown. Used when a legit user can recover in under 30 seconds.
4. **Hard block.** Return an error. User cannot proceed. Reserved for signals that are almost certainly malicious.

**Default bias:** Prefer tier 2 (allow + flag) over tier 4 (hard block) whenever the signal is under ~95% confidence. Log everything, tune thresholds from real data over the first 30 days post-launch.

---

## Per-signal tuning

For each defense in the hardening plan, what's the threshold and what's the response?

### 1. Prompt-injection pattern match in user-supplied text

**Signal:** Tweet, bio, or display name contains strings like "ignore previous instructions", "system prompt", "you are now", "new instructions:", etc.

**Why lean lenient:**
- Creators write meta-content about AI constantly. "I told ChatGPT to ignore previous instructions and tell me…" is a perfectly legitimate tweet.
- Bios often contain "prompt engineer" and reference AI concepts.
- Hard-blocking on these patterns would reject AI-space creators — who are a core target audience.

**Recommended response:**
- **Allow + flag** if a pattern matches. Still send to the LLM, but with the XML delimiters + guard preamble doing the defensive work.
- **Hard block** only if the same pattern repeats in ≥3 of the user's last 50 tweets AND the text contains explicit scoring language ("give me 100", "rate this 95/100"). That combination is not organic.
- Never hard-block based on pattern match alone.

**Threshold to revisit at 30 days:** If abuse detection shows pattern-match-flagged sessions correlate with anomalous scores at > 10× the baseline rate, tighten to soft-challenge.

### 2. Score deviation from heuristic

**Signal:** LLM returns score that differs from the deterministic heuristic by > 25 points.

**Why lean strict:**
- This is a server-side signal, invisible to the user. No UX cost to rejecting.
- A 25-point deviation is a genuine red flag — either the LLM is broken or it was manipulated.

**Recommended response:**
- **Auto-replace** with the heuristic score when deviation > 25. Log the discrepancy. User never sees either the raw LLM score or the fact that a swap happened.
- **Retry once** with temperature 0 before falling back to heuristic.

**Threshold:** Start at 25 points. If heuristic regularly undershoots real analysis, relax to 35. If it overshoots, tighten to 15.

### 3. Content length limits

**Signal:** Bio > 500 chars, tweet > 400 chars, display name > 100, handle > 30.

**Why lean lenient:**
- X's own limits are wider than what we'd naively expect (display names, bios).
- Hitting the cap is usually a sign of a verbose creator, not an attacker.

**Recommended response:**
- **Silently truncate** at ingestion. Do not error. Store the truncated version. Display original on the user's own dashboard with a "truncated for analysis" tooltip.
- No flag, no block.

### 4. Rate limit breached

**Signal:** Single user / IP exceeds 10 scans/hour, 30 scans/day for free tier.

**Why lean lenient on first breach:**
- A creator iterating on their bio and rescanning is a perfect legitimate pattern.
- First-breach hard blocks kill engagement.

**Recommended response:**
- **Soft-challenge.** First breach: friendly modal saying "let's give the analysis time to refresh — try again in 10 minutes." No CAPTCHA yet.
- Repeated breaches within 24h: CAPTCHA.
- 10× breaches in 7 days: hard block, manual review.

**Threshold:** Generous on free tier initially. Tighten only if abuse logs show bad actors slipping through.

### 5. Cross-handle scan attempt (authenticated user)

**Signal:** Logged-in user tries to scan a handle that isn't their own.

**Why lean strict:**
- Phase 2 closes this by design. The request should never have reached a handler if middleware is correct.
- If it does reach the handler, something is off.

**Recommended response:**
- **Hard block.** 403 with message "You can only scan your own X profile."
- Log with high priority — repeated attempts suggest either a client bug or a probe.
- 3+ such attempts: session review, possible account suspension.

### 6. OAuth callback anomalies

**Signal:** State mismatch, replayed code, unknown redirect URI, rapid OAuth retries.

**Why lean strict:**
- OAuth flow is where account-takeover attempts live. There is no legitimate reason for most of these.

**Recommended response:**
- **Hard block.** Invalidate the session attempt, surface a generic "login failed, please try again" message. Detail in logs.

### 7. Payment anomalies

**Signal:** Email mismatch between Stripe customer and signed-in user, rapid purchase retries with different cards, webhook signature failure.

**Why lean strict:**
- Stripe Radar handles most of this. We layer on top.
- Chargeback fraud is asymmetric — one successful attack > dozens of legitimate purchases.

**Recommended response:**
- **Hard block** on signature failure. Log, alert.
- **Soft-challenge** (email verification step) on email mismatch between Stripe and account.
- **Flag** on rapid retries with different cards; let Stripe Radar decide the outcome.

### 8. Shareable card content anomalies

**Signal:** Card-visible fields contain suspicious content (URLs, profanity, content that doesn't match the handle's observable tweets).

**Why symmetric:**
- False positive: legit creator's card shows a placeholder, looks broken publicly, and creator shares to zero followers.
- False negative: attacker-generated content displayed publicly under the victim's handle, looks like defamation.

**Recommended response:**
- **Allow + flag + soft guardrail.** Card renders, but: URLs are stripped to text, profanity passes through (this is a creator product — don't nanny), but long unbroken base64 or unusual unicode blocks are sanitized.
- Owner sees a "review your shareable card" banner on their dashboard if flags were raised. They can edit before reshare.

---

## How we tune over time

Do not try to get thresholds perfect in v1. Instead:

1. **Log everything from day one.** Every defense writes to `security_audit_log` whether it blocked, flagged, or allowed. Include the signal score/reason.
2. **Review weekly for the first 8 weeks.** Jeffrey spends 30 min every Monday looking at `/admin/security`:
   - What did we flag? Were those real attacks?
   - What slipped through? (Check support tickets, weird scan outputs.)
   - What did we block? Did any users complain?
3. **Adjust one threshold at a time.** Never tune multiple in the same week — you lose the signal for which change did what.
4. **Document every tuning change** in `docs/DECISIONS.md` with date and reason.

---

## What we explicitly accept as "acceptable false-negative rate"

- A determined attacker can always corrupt their own score. We accept this. It doesn't propagate to other users (Phase 1 isolates data) and doesn't transact (Phase 3 makes LLM output non-actionable).
- The heuristic clamp (Phase 4) caps how wrong any single score can be. Self-gaming maxes out at +10 to +15 points above reality — annoying, not exploitable.
- Partner API scraping is constrained by rate limits and audit logs. A partner who exceeds 10k scans/day on GROWTH tier or mass-queries handles not in their declared scope triggers a review. We accept that a well-funded patient scraper can still build a dataset at rate-limit pace over months. Mitigation: contractual with partners, not technical.
- The card is public. A creator who doesn't want their score public must delete the scan. We do not try to prevent scraping of the public view; that's a feature.

---

## Anti-patterns to avoid

- **CAPTCHAs on every action.** Creators will leave. Only use CAPTCHAs as a soft-challenge after a specific signal, never as a default.
- **Aggressive text filters on creator content.** This is a creator product. Profanity, edgy humor, political content, "dark" branding — all legitimate. Filter only for prompt-injection markers + injection via long encoded blobs.
- **Silent shadow-bans.** If we block a user, they deserve a clear reason and a path to appeal. Shadow-banning is a short-term convenience that destroys trust when discovered.
- **Over-logging PII.** The audit log should record *what* happened, not *what the user wrote*. Log "bio contained injection pattern #4" not the bio contents. Keep logs non-PII where possible.
- **Security theater copy.** Don't write error messages like "Suspicious activity detected. Contact support." Write "We couldn't complete that action. Try again, or reach out if it keeps happening." The user doesn't need to know they were flagged.

---

## Open questions for Jeffrey

1. Is there a known edge-case creator archetype in your user base who would trip these filters? (e.g., creators whose whole brand is "prompt injection humor.")
2. Are you willing to accept manual review backlog? Some "allow + flag" signals will need a human eventually. Who reviews, and how often?
3. For the partner API: do you want to enforce per-partner scan-subject allowlists in the contract, or keep it fully open on GROWTH+ tiers?
4. Shareable cards that contain political or controversial content that a creator *did* tweet but doesn't want publicly summarized — do we offer a "hide this strength/weakness" opt-out?

These are product-judgment questions, not security-engineering ones. Worth a call with whoever is closest to the creator voice before launch.
