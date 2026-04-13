# Reclaim Email — for the ~900 early signups

**Sends:** After Phase 1 + Phase 2 ship to production, before public launch
**Audience:** ~900 email addresses collected during the early-access flow
**Channel:** Resend (existing newsletter list)
**Goal:** Convert email signups into authenticated BrandOS accounts with connected X handles

---

## Context for the writer

These ~900 people signed up via email during the early-access period. Most ran an anonymous brand scan at some point; the email and scan were never joined in the database. So the email is **not** a "your scan from [date] is back" — it's an **announcement that BrandOS leveled up** and a clear ask to come create a real account.

The tone should match Jeffrey's creator-voice: direct, honest, no corporate hedging. Acknowledge that they're early. Explain what changed and why it matters to *them*, not to BrandOS.

---

## Subject line — A/B test these two

- **A:** "BrandOS leveled up. Come grab your real dashboard."
- **B:** "We rebuilt BrandOS with you in mind — your account is waiting."

Send 50/50, pick the winner for resends.

---

## Email body — plain text version (Resend renders both)

```
Hey,

You signed up for BrandOS early — thank you. Genuinely.

Since then I've been quietly rebuilding it. Here's what changed:

→ Real accounts. You sign up once, get a dashboard, and your data stays
  yours. No more anonymous scans floating around.

→ X account connection. To prevent impersonation and gaming, you connect
  your X handle via OAuth. Only you can scan your own brand.

→ A dashboard that grows with you. Multi-platform scanning (YouTube,
  LinkedIn, more) is shipping in Q2. Competitor watchlists. Scheduled
  rescans. The stuff you actually wanted.

→ Security-first. We rotated everything, locked down the data, and built
  this on the assumption that your brand intelligence is worth protecting.

The old anonymous scans are gone. Cleaner that way.

Ready when you are:

  → [Create your BrandOS account]

Takes 60 seconds. Sign up with email or Google, connect your X, run a
fresh scan, see your real Brand Score on a real dashboard.

— Jeffrey
   Founder, BrandOS

---

You're getting this because you signed up at mybrandos.app.
Don't want emails like this? [Unsubscribe]
```

---

## Email body — HTML version (notes for the implementer)

- Use the existing `src/lib/newsletter-template.ts` as base
- Single CTA button: "Create your BrandOS account" linking to `https://mybrandos.app/signup?ref=reclaim-2026-04`
- Dark-mode-friendly: white background, `#0047FF` (Klein blue) for the CTA, JetBrains Mono for the headline
- Footer: include unsubscribe link (mandatory — Resend will reject without it)
- Don't include images that block (loads delay open tracking)
- Keep total payload under 100KB

---

## CTA URL

`https://mybrandos.app/signup?ref=reclaim-2026-04`

The `ref=reclaim-2026-04` query param lets us measure conversion in PostHog distinct from organic signups. Wire this through to the signup analytics event.

---

## Send mechanics

- **Sender:** `Jeffrey from BrandOS <jeffrey@mail.mybrandos.app>` — personal sender, not `team@`. Personal senders pull 2-3x open rates.
- **Reply-to:** Same address. Real responses go to Jeffrey.
- **Send time:** Tuesday or Wednesday, 9 AM Pacific. Avoid Mondays (inbox overload) and Fridays (low engagement).
- **Throttle:** Resend handles batching. No need to chunk manually unless list >10k.
- **List hygiene:** Before send, run the 900 addresses through Resend's email validation. Drop bounces from previous sends. Last thing you want during a launch is a 5% bounce rate hurting domain reputation.

---

## Follow-up cadence

- **T+0:** Initial send (this email)
- **T+5 days:** Resend to non-openers with a different subject line
- **T+12 days:** Final resend to non-openers with subject: "Last note from me — BrandOS account is still waiting"
- **T+30 days:** Move non-openers to a separate suppression list. Don't keep emailing.

Track in `src/lib/newsletter.ts` so we don't double-send.

---

## Success metrics (review T+30 days)

- Open rate target: 35%+ (this is a warm list)
- CTR target: 8%+ on the CTA
- Signup conversion target: 4%+ of total list (~36 signups out of 900)
- X connection rate target: 90%+ of signups (the flow makes this nearly mandatory)

If we hit these we have a decent reactivation cohort. If we don't, the issue is product-market fit on the new account flow, not the email — and that's a different conversation.

---

## What this email explicitly does NOT do

- It doesn't claim a specific old scan is "waiting" (the data wasn't joined to email)
- It doesn't promise refunds, credits, or compensation (no money was taken)
- It doesn't apologize at length for the rebuild — early users signed up to see the journey
- It doesn't beg. One CTA, one ask, done.
