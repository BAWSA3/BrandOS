# BrandOS 30-Day Launch Plan (integrated with the build)

Plan by @Bawsa, Oct 18, 2026. Integrated with the codebase and prod data the same day.
This file is the working source of truth for the launch: check items off here.

**Supersedes** the Oct 6 launch plan (free 30 days for everyone → subscriptions;
Standard $10 / Premium $20 / Founding $249; rent → deed; 30-Day Build cohort Oct 20).
Those are parked, not deleted (see "Not doing for 30 days").

---

## The bet

Launch the X-only Brand Dashboard to crypto creators and founders, sold founder-led by
Bawsa, with one goal: first paying customers.

- **Goal:** 30–50 founding members in 30 days (≈ $870–1,450 MRR). An estimate, not a
  BrandOS benchmark.
- **One number:** paid conversions. Not scans, signups or impressions.
- **Biggest asset:** 31k X followers who already see Bawsa as the branding guy in crypto.
- **Proves:** that people will pay. It does not hit $15–20k/mo yet.

### Where we actually start (prod, Oct 18)

|                   | Today                      | What the goal needs (rough) |
| ----------------- | -------------------------- | --------------------------- |
| Free scans / week | 6 → 38 → 54 (last 3 weeks) | ~300/week during launch     |
| Accounts on prod  | 1 (Bawsa)                  | —                           |
| Email list        | 1,010 (0 unsubscribed)     | one send                    |
| Paying            | 0                          | 30–50                       |

Rough funnel to 40 paid: 40 paid ÷ ~40% trial→paid ≈ 100 trials ÷ ~25% signup→trial
≈ 400 signups ÷ ~30% scan→signup ≈ 1,300 scans in 30 days. These rates are guesses to
replace with real ones after week 1. The point: launch content (teardowns, email, the
video tease) has to multiply scan volume; current traffic alone won't do it.

---

## Offer and funnel

1. **Free X Brand Score scan.** Live on prod (homepage). Every piece of content ends
   with "scan yours."
2. **Card-required free trial** of the Brand Dashboard (X data only). _Not built yet._
3. **Pro at $29/mo**, charged automatically when the trial ends. ($29 already in `plans.ts`.)

**Founding 100:** the first 100 paying members keep $29/mo forever when prices rise,
plus a short recorded brand teardown from Bawsa.

**Positioning:** BrandOS is the true indicator of a creator's reputation.
Line to test: "Know your reputation score before brands check it."
(Already the angle of the Oct 16 skins tease and the public `/@handle` page.)

**First buyer:** crypto creators and founders.

### What's free vs Pro (decided Oct 18)

|                                                                        | Free (no card)                      | Pro / trial |
| ---------------------------------------------------------------------- | ----------------------------------- | ----------- |
| Homepage scan + score card                                             | ✓                                   | ✓           |
| Public `/@handle` page + "Compare your brand"                          | ✓                                   | ✓           |
| Brand Dashboard (score history, posts analyzed, Brand Pass, skins, XP) | locked preview → "Start free trial" | ✓           |
| BrandOS in Claude / ChatGPT (MCP)                                      | 10 reads/week                       | unlimited   |

---

## Build status: what exists vs what's left

Legend: ✅ done · 🟡 on staging, not prod · 🔨 to build · 👤 Bawsa (not code)

| Plan item                                       | Status     | Notes                                                                                        |
| ----------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| Free X scan                                     | ✅ prod    | ~54/week                                                                                     |
| Brand Dashboard ("98%")                         | 🟡 staging | Promote now; prod has 1 account, so risk is low. Preflight + smoke all green Oct 16          |
| Public `/@handle` + compare                     | 🟡 staging | The teardown + "drop your handle" payoff surface                                             |
| MCP (Claude / ChatGPT)                          | 🟡 staging | OAuth configured on prod Supabase                                                            |
| Skins, score card copy, check-in, XP            | 🟡 staging |                                                                                              |
| Workstation / studio brainstorm (#144)          | 🟡 staging | **Hide at launch** (parked)                                                                  |
| Dashboard v2 design (`?design=v2`)              | 🟡 opt-in  | Decide: make default before launch, or leave v1                                              |
| Stripe account, product, price, webhook, portal | 👤         | No Stripe env on prod or staging                                                             |
| Card-required trial                             | 🔨         | Handoff spec below                                                                           |
| Pricing page                                    | 🔨         | Currently the "Studio opening soon" holding page                                             |
| Dashboard paywall for FREE users                | 🔨         | Dashboard is open to any signed-in user today                                                |
| Founding 100 counter + flag                     | 🔨         | Number each paying member 1–100                                                              |
| Trial-ending note (email)                       | 🔨         | Stripe `customer.subscription.trial_will_end` → Resend                                       |
| Weekly review numbers                           | 🔨         | `scripts/weekly-review.mjs` (scans, trials, paid, cancels)                                   |
| Teardown kit                                    | 🔨         | Handle → scan + `/@handle` + score card PNG (reuse the video capture pipeline)               |
| "What I built" email to the list                | 🟡         | Launch-email infra exists (#41); rewrite copy; the held 981-recipient send becomes this      |
| Find Your Opp + tier list in rotation           | ❓         | Verify they're reachable on prod (#40 hid legacy pages; tier list had the Sept egress issue) |
| CUSTOMER-VOICE.md / KILLED-IDEAS.md             | ✅         | Created alongside this file                                                                  |

---

## Timeline (integrated)

Launch day is **Mon, Nov 2**. It holds only if the **Oct 28 live payment check** passes;
otherwise push one week.

**Oct 18–19 (weekend): decide + set up**

- [ ] 👤 Answer the open decisions below
- [ ] 👤 Create/activate the Stripe account; create product "BrandOS Pro" with a $29/mo price
      (test mode first, then live). Turn on the customer portal with cancel allowed
- [ ] Promote staging → prod (quiet; nobody but Bawsa has an account)

**Oct 19–25: finish and set up**

- [ ] 🔨 Card-required trial (spec below) + webhook fixes
- [ ] 🔨 Pricing page ($29, trial length, Founding 100 counter, start-trial CTA)
- [ ] 🔨 Dashboard paywall for free users (locked preview + start trial)
- [ ] 🔨 Hide the workstation; settle v1 vs v2 dashboard
- [ ] 🔨 Founding-member numbering; trial-ending email
- [ ] 🔨 `scripts/weekly-review.mjs` and the teardown kit
- [ ] 🔨 End-to-end test in Stripe **test mode with a test clock** (start trial → fast-forward
      → converts; cancel → never charged; failed card → drops to Free)
- [ ] 👤 Add the Stripe live keys + price id + webhook secret to Vercel (`brandos` production)
- [ ] 👤 Announce the Nov 2 launch date publicly
- [ ] 👤 **Wed Oct 28: buy your own trial in live mode and confirm it converts** (shorten the
      trial for this one test, then refund)

**Oct 26–Nov 1: warm up (no selling yet)**

- [ ] 👤 DM the 213+ "ACCESS" commenters: first claim on Founding 100 spots
- [ ] 👤 Email the 1k list once: "Here's what I built since you signed up" + dashboard screenshot + founding spots open next week
- [ ] 👤 3–4 build-in-public posts from your own dashboard (the Oct 16 skins video counts as one)
- [ ] 🔨 Pre-run the first 7 teardown targets through the teardown kit
- [ ] 👤 Save every reply and DM to `CUSTOMER-VOICE.md`
- [ ] 🔨 Collect the handles dropped on the Oct 16 tease; pre-warm their scans for Nov 2

**Nov 2–15: launch**

- [ ] 👤 Launch thread: the problem, your dashboard, scan CTA. Pin it
- [ ] 👤 Reply to every handle from the Oct 16 tease with `mybrandos.app/@handle` (drafted for you)
- [ ] 👤 One BrandOS-powered teardown per day for 14 days (kit renders the screenshots)
- [ ] Open the Founding 100 cohort (counter live on pricing)
- [ ] Keep Find Your Opp and the tier list in rotation

**Nov 9–30: convert trials**

- [ ] Before each trial ends: "here's what your dashboard says" note (automated email + your DM)
- [ ] 👤 DM every trial user; talk to every canceller; log in `CUSTOMER-VOICE.md`
- [ ] If trials don't convert, fix what cancellers say. No new features

---

## Brand and agency track (≈10% of time, no code)

- [ ] Reach out to 5 crypto projects or agencies you know that pay creators
- [ ] Optional: one message to Kreatorsverse (below). No follow-up; doesn't count toward the 5.
      Note: memory had Kreatorsverse marked "dropped" since Apr 13; this is a single re-touch
- [ ] Ask: "Would you pay to vet creators before a campaign, and what would that be worth?"
- [ ] Pre-sell a paid pilot: BrandOS scores on 20 creators from their shortlist (the teardown
      kit makes this a batch job)

> Hey, we spoke back in March about BrandOS. Since then we've shipped a full brand dashboard
> and rebuilt the scoring. One question: when you pick creators for campaigns, how do you
> decide who's actually worth it? We're testing a creator-vetting pilot and you were the first
> team I thought of.

**Kill rule:** after 4 weeks with no paid pilot, park B2B in `KILLED-IDEAS.md` with what was
learned. If one agrees, that pilot becomes the B2B spec.

**Creator data business:** not now (CreatorIQ, HypeAuditor, Modash; X/SocialData terms;
needs creator opt-in).

---

## Metrics and weekly review

| Stage            | Count                        | Source                                        |
| ---------------- | ---------------------------- | --------------------------------------------- |
| Scans            | Free scans / week            | `BrandScans` + public `/@handle` reads        |
| Trial starts     | Card-required trials started | Stripe / `User.subscriptionStatus = TRIALING` |
| Paid conversions | Trials → $29 Pro             | Stripe (first paid invoice after trial)       |
| Cancels          | With reason                  | Stripe + `CUSTOMER-VOICE.md`                  |
| B2B pilots       | Paid pilots agreed           | Manual                                        |

Every Sunday (`node --env-file=.env.prod.local scripts/weekly-review.mjs` prints the numbers):

1. Paid conversions this week, and from which channel?
2. What did cancelled users say?
3. Anything taking time that isn't on this plan?
4. B2B still under 3 hours/week?

---

## Not doing for 30 days (parked, not killed)

| Idea                                                                                                             | Revisit when                                       |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Instagram / TikTok                                                                                               | X trials convert at a rate Bawsa is happy with     |
| Workstation (studio brainstorm, #144)                                                                            | Paying users ask for it                            |
| Creator data business                                                                                            | A B2B pilot proves demand + creators opt in        |
| Cross-platform dashboard data                                                                                    | IG/TikTok launch triggers                          |
| New features of any kind                                                                                         | Cancelled users name a specific gap                |
| Paid ads                                                                                                         | Never during this launch                           |
| Oct 6 plan pieces: Standard/Premium/Founding $249 tiers, rent→deed ownership, 30-Day Build cohort, station board | After the $29 Pro launch proves willingness to pay |

---

## Decisions (Oct 18)

- [x] Trial length: **7 days** (`TRIAL_DAYS = 7`)
- [x] Free without a card: **homepage scan + public `/@handle` page + compare**. The Brand
      Dashboard is trial/Pro only; free users see a locked preview with "Start free trial"
- [x] MCP: **free 10 reads/week; unlimited on trial/Pro**. The "first 30 days unlimited for
      every signup" rule goes away
- [x] Dashboard at launch: **workstation hidden; v2 design is the default**

Still open:

- [ ] Launch date Mon Nov 2, pending the Oct 28 payment check
- [ ] 4-week B2B kill rule (or another deadline)

---

## Handoff: card-required trial (build spec)

**Goal:** new users start a Pro trial by entering a card; the card is charged $29/mo
automatically at trial end.

**Acceptance criteria**

- The trial won't start without a valid card
- Trial length is one setting (`TRIAL_DAYS` in `src/lib/plans.ts`)
- Converts to Pro automatically at trial end; a failed charge drops the user to Free
- Cancel during the trial → never charged
- Trial users get full Pro access to the dashboard
- Pricing page and dashboard show trial status and end date

**What exists and what changes**

- `src/app/api/stripe/checkout/route.ts`: subscription checkout exists. Add
  `subscription_data.trial_period_days`, `payment_method_collection: 'always'`,
  `trial_settings.end_behavior.missing_payment_method: 'cancel'`; drop `allow_promotion_codes`
  (non-goal); success/cancel URLs → `/dashboard` (currently the retired `/app`)
- `src/app/api/stripe/webhook/route.ts` (idempotent, tested):
  - **Bug:** `mapStripeStatus` maps unknown statuses (`unpaid`, `paused`) to `ACTIVE`, so a failed
    trial charge would keep Pro. Map them to a non-entitled status
  - **Bug:** `invoice.paid` sets `ACTIVE` for every paid invoice, including the $0 trial-start
    invoice. Only treat non-zero invoices as activation; let subscription events own status
  - Store the trial end (`subscription.trial_end`; `currentPeriodEnd` already holds it during trial)
  - Handle `customer.subscription.trial_will_end` → trial-ending email
- New entitlement helper (one place): Pro = tier `PRO` and status `ACTIVE` or `TRIALING`
- `src/app/pricing/page.tsx`: replace the holding page
- Dashboard: paywall for non-entitled users; trial badge + end date
- `src/lib/mcp/usage.ts`: remove the 30-day unlimited rule; free = 10/week, trial/Pro = unlimited
- Founding 100: number paying members 1–100 (small migration: `User.foundingNumber`)

**Non-goals:** annual plans, discounts/coupons, Agency/Enterprise tiers, the workstation.

**Test plan:** Stripe test mode + test clocks (trial → convert; trial → cancel; trial → card
declines), `npm run test:webhooks`, then the Oct 28 live purchase.
