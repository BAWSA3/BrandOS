# What it takes for BrandOS to reach $1M a year

_Built 2026-10-26 from prod data (read-only), Resend, the code, and the competitor research. The model is `million-dollar-model.xlsx` next to this file; interview and survey drafts are in `interviews-and-survey.md`._

## The short version (explain it like I'm 5)

- **$1M a year means about $83,000 every month.** That's roughly **2,100 creators paying $39**, or **335 agencies/brands paying $249**, or a mix such as 1,500 creators + 100 teams + 60 agencies.
- **Today we have 0 paying members.** Nothing has been sold yet: there are 7 accounts, no Stripe customers, and 0 pricing-poll votes. So nobody, including us, knows yet whether people will pay. Nov 2 to Dec 3 is the first real test.
- **People love the scan once, then leave.** In March, 4,105 people scanned in one week and 883 left an email (21.5%). Four weeks later only 0.3% of them had come back. To be fair, there was nothing to come back _to_ (no dashboard). Now there is, so that number has to change.
- **Traffic is the biggest gap.** This October we're getting about 250 new people scanning a month. Even with good conversion, that pace tops out around **$1,200 a month**. The expected path to $1M needs about **10× that traffic in November, then +12% every month**, and lands around **mid-to-late 2028**.
- **Brands are probably who pays.** Creators already pay $19–49/mo for tools like ours, but brands and agencies pay **$159–833/mo** for discovery tools and **$5K+/mo** for KOL agencies. **25 agencies a month at $249** gets to $1M in about 13 months, the same as **7,500 new scanned creators a month**. So creators are the supply (free or cheap); brands are the money.
- **The one test this week:** talk to 10 people who pay crypto creators (project marketing leads, KOL agencies, SMMs) and ask for a letter of intent at $249/mo for Index access. **3 yeses by Dec 3** tells us the business; 0 tells us to stay a creator tool and fix retention first.

## 1. The target, worked backwards

| Path to $83,333 MRR                                          | Paying accounts needed       |
| ------------------------------------------------------------ | ---------------------------- |
| All creators at $39 (post-Founding price)                    | **2,137**                    |
| All creators at $29 (Founding price)                         | 2,874                        |
| Agencies/brands only at $249                                 | **335**                      |
| Mix: 1,500 creators @ $39 + 100 Team @ $99 + agencies @ $249 | 1,500 + 100 + 60 = **1,660** |

Funnel per paying creator (expected rates): scanned handle → signup **15%** (measured) → card on file **15%** (guess) → still paying after the free period **50%** (guess) = **~1.1% of scanned handles become paying members**. So 2,137 creators means about **190,000 scanned handles**, more once churn is counted. BrandOS has scanned **4,748** handles, ever.

## 2. The real numbers at each step (prod, as of Oct 26)

| Step                                 | Number                                                                                                                       | Source             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Scans, all-time                      | **6,756** (4,748 unique handles; only 9 while signed in)                                                                     | Q1                 |
| Launch week (Mar 16)                 | 5,459 scans, 4,105 handles, **883 email signups (21.5%)**                                                                    | Q2, Q4, C3         |
| After launch week                    | 564 → 120 → 107 → 84 → 39 scans/week, ~10/week by May, near zero all summer                                                  | Q2                 |
| October 1–26                         | 285 scans, 217 handles, **32 signups (14.7%)**                                                                               | C4                 |
| Oct 22 list email (1,004 recipients) | **78 rescanned (7.8%)** by Oct 26; subject "you scored 62 in march" 9.4% vs "did your score go up?" 4.8%                     | C5, LAUNCH-PLAN    |
| Email list                           | 1,022 signups, 5 unsubscribed; Resend: 1,089 sent since Oct 7, ~2% bounced                                                   | tables, Resend API |
| Opens / clicks                       | **Unknown**: open and click tracking is off in Resend                                                                        | Resend API         |
| Replies                              | **Unknown here**: replies go to Bawsa's Gmail, not to any system                                                             | —                  |
| Accounts                             | **7** (all FREE)                                                                                                             | Q6                 |
| Cards on file / subscriptions        | **0**: checkout isn't live on prod; the Stripe key isn't readable from the pulled env, and the DB has no Stripe customer ids | Q6, Q7             |
| Index reservations                   | 1,004 (975 from the email list, 27 station, founder, 1 account); 0 claimed                                                   | Q9                 |
| Pricing poll votes                   | **0**                                                                                                                        | tables             |
| Feedback submissions                 | 1                                                                                                                            | tables             |

**Cost per scan (estimate from code):** one SocialData profile call plus up to 3 timeline pages (≈64 results × $0.0002 ≈ $0.013), plus Claude Haiku scoring (~8K tokens in, ~2K out ≈ $0.02) and the identity read (now on Claude, ≈ $0.01–0.03). Roughly **$0.03–0.06 per full scan**. A $35/mo member who rescans 8 times a month costs about $0.32, so **margin is ~99%**. One paying member funds about 10,000 free scans. Scan cost doesn't stand in the way of $1M; traffic and willingness to pay do. (Verify against SocialData and Anthropic invoices.)

## 3. Do people come back? (cohorts)

"Active" here means _their handle was scanned again_ in that week. It's the only signal that exists for all signups, because there was no dashboard to log into before October.

| Signup week     | Signups | Week 1 | Week 2 | Week 4   | Week 8 | Ever rescanned |
| --------------- | ------- | ------ | ------ | -------- | ------ | -------------- |
| Mar 16 (launch) | 883     | 8.9%   | 0.8%   | **0.3%** | 0.2%   | 16.6%          |
| Mar 23          | 62      | 8.1%   | 0%     | 0%       | 0%     | 16.1%          |
| Oct 5           | 9       | 22.2%  | 11.1%  | —        | —      | 33.3%          |
| Oct 12          | 11      | 18.2%  | 0%     | —        | —      | 18.2%          |
| Oct 19          | 10      | 30.0%  | —      | —        | —      | 30.0%          |

**Does the line level off?** For the March cohort, no. It falls to almost zero by week 4 and stays there. The October cohorts return more in week 1 (18–30%), but they're tiny and too young to say. Read this as "a one-time novelty with nothing to return to", not as a verdict on the dashboard, which most of these people have never seen. The real retention test starts Nov 2 with logged-in members (UserProgress visits, XP events).

## 4. Who pays?

| Who                                                                  | What they pay today for something like this                                                                    | Evidence BrandOS has                                                                   | Fit                                                                         |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Creators**                                                         | Favikon Creator €29/mo; TwitterScore PRO $19/mo; SuperX $49/mo                                                 | 4,748 scanned themselves for free; 21.5% left an email; 0 have paid; 0 poll votes      | Will use it. Willingness to pay unproven, and the category price is ~$20–50 |
| **SMMs / small agencies** (manage several creator or brand accounts) | Favikon brand Core €159 / Pro €239; Modash $199; HypeAuditor ~$299 (third-party)                               | None yet (Team/Agency plans not built)                                                 | Plausible at $99–249 if multi-account works                                 |
| **Brands / crypto projects** (hire creators)                         | Kaito Pro from $833/mo; crypto KOL agencies ~$5K+/mo (third-party); X Creator Connect (undisclosed, via X ads) | None yet. Positioning ("brands find precise creators") is untested with a single buyer | **Biggest budgets.** The Index is what they'd pay for                       |

Sources: `docs/research/COMPETITORS.md` and `2026-10-23-competitors.md` (market-research PR #208, read 2026-10-23, with links per company there).

**Answer:** creators are the supply and the top of the funnel. Keep them free or cheap ($29–39) because that's the category price. The money that gets to $1M fastest is on the **brand/agency side**: 335 accounts instead of 2,137, from buyers who already spend 5–20× more per month. But **no brand has been asked yet**. That's the gap to close this week.

## 5. Three scenarios (from the model)

Month 0 = Nov 2026. Full assumptions, with source and test for each, are on the `Inputs` sheet.

|                               | Worst                  | Expected           | Optimistic                 |
| ----------------------------- | ---------------------- | ------------------ | -------------------------- |
| New scanned handles in Nov    | 1,000 (+5%/mo)         | 2,500 (+12%/mo)    | 5,000 (+18%/mo)            |
| Scan → signup                 | 12%                    | 15% (measured Oct) | 21% (measured launch week) |
| Signup → card                 | 8%                     | 15%                | 25%                        |
| Card → paid                   | 40%                    | 50%                | 60%                        |
| Creator churn / month         | 12%                    | 8%                 | 5%                         |
| New agencies/brands per month | 0.5                    | 2 (+10%/mo)        | 5 (+15%/mo)                |
| **MRR in Nov 2027**           | **~$2,200**            | **~$26,700**       | **~$214,000**              |
| **$1M ARR reached**           | **not within 4 years** | **~Aug 2028**      | **~Jun 2027**              |

What moves the date most (expected conversion, aiming for Dec 2027):

- **Creator side only:** about **7,500 new scanned handles a month** from November (30× October's pace) gets there in ~13 months.
- **Brand side only:** about **25 new agencies/brands a month** at $249 gets there in ~13 months.
- **At October's pace** (250 handles a month, no brands), MRR levels off around **$1,200**.

Every "guess" in the model becomes "measured" by Dec 3 if the tests in section 6 run.

## 6. The proof: what has to be true by Dec 3

| Check                                                                                                 | Pass                            | Fail                          | Measured how                                                           |
| ----------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| Founding members who added a card stay paying when charged on Dec 3                                   | **≥ 40–60%**                    | < 25%                         | Stripe: successful Dec 3 charges ÷ cards on file                       |
| Week-4 activity for Nov 2 signups (logged-in visit or rescan in days 28–35), and the curve levels off | **≥ ~20%** and flat from week 4 | < 10% and still falling       | UserProgress / XPEvent / BrandScans by cohort (same query shape as C1) |
| "Very disappointed" if they could no longer use BrandOS (Sean Ellis survey, active members)           | **≥ 40%**                       | < 25%                         | Survey in `interviews-and-survey.md`, n ≥ 30                           |
| Agencies or brands paying or signing a letter of intent at **$249+/mo**                               | **≥ 3**                         | 0 after 10 real conversations | Signed LOIs or paid invoices                                           |
| New scanned handles in November                                                                       | ≥ 2,500                         | < 1,000                       | BrandScans, Nov 2–30                                                   |

**When to change direction, and to what:**

- **Creators convert, but no brand bites** (card → paid ≥ 40%, 0 LOIs): **stay a creator subscription.** Push traffic (teardowns, reply waves, /@handle sharing). Expect the expected-case timeline (~2028); add Team at $99 for SMMs.
- **Brands bite, but creators don't pay** (≥ 3 LOIs, card → paid < 25%): **flip the model.** Creators free forever, so the Index fills fast; sell Index access and creator search to agencies and projects at $249–833. That's the fastest route to $1M.
- **Neither, and week-4 activity under 10%:** the product isn't a habit yet. Don't buy traffic. Fix the reason to come back first: weekly score changes, the growth dashboard, the idea board. Re-run the cohort test in January.
- **Both pass:** keep both sides, and raise the post-Founding price toward $49 once the Index has brand buyers looking at it.

## Gaps in this analysis

- **Stripe:** the prod secret key is a sensitive var that `vercel env pull` doesn't return. Card and payment numbers will come from Stripe directly once checkout is live.
- **Opens and replies:** Resend open/click tracking is off, and replies land in Gmail. Turn tracking on for the Nov 2 send, and log replies in `CUSTOMER-VOICE.md`.
- **Activity:** "rescanned" stands in for "active" because only 7 accounts exist. From Nov 2, use real logins.
- **Conversion benchmarks:** the 40–60% card-trial figure is a common SaaS rule of thumb, not BrandOS data.
- **Competitor prices** are as listed on 2026-10-23, some via third parties; see the research file.

## Appendix: queries (prod, read-only, run 2026-10-26)

Run with a read-only session (`SET default_transaction_read_only = on`). Ids match the tables above.

```sql
-- Q1 scans overall
select count(*) scans, count(distinct lower(username)) handles, count(*) filter (where "userId" is not null) signed_in_scans, min(created_at)::date first, max(created_at)::date last from "BrandScans";
-- Q2 scans by week
select date_trunc('week',created_at)::date wk, count(*) scans, count(distinct lower(username)) handles from "BrandScans" group by 1 order by 1;
-- Q3 scans per handle distribution  (1: 3,358 · 2: 1,024 · 3–5: 346 · 6+: 20)
select case when n=1 then '1' when n=2 then '2' when n<=5 then '3-5' else '6+' end bucket, count(*) handles from (select lower(username) u, count(*) n from "BrandScans" group by 1) t group by 1 order by 1;
-- Q4 email signups by week
select date_trunc('week',"createdAt")::date wk, count(*) n, count(*) filter (where "xUsername" is not null) with_handle, count(*) filter (where unsubscribed) unsub from "EmailSignup" group by 1 order by 1;
-- Q6 users + subscriptions
select "subscriptionTier"::text tier, "subscriptionStatus"::text status, count(*), count("stripeCustomerId") with_cust from "User" group by 1,2;
-- Q7 workspaces
select plan::text, type::text, count(*), count(stripe_subscription_id) subs, count(trial_ends_at) trials from "Workspace" group by 1,2;
-- Q9 reservations by source
select source, count(*), count("claimedAt") claimed from "IndexReservation" group by 1;
-- C1 cohorts: signups by week; active in week k = a scan of their handle in that window after signup
with s as (select id, lower(replace("xUsername",'@','')) h, "createdAt" t, date_trunc('week',"createdAt")::date wk from "EmailSignup" where "xUsername" is not null and coalesce(source,'') not in ('test','cli-test')),
a as (select s.id, s.wk,
  bool_or(b.created_at >= s.t + interval '1 day'   and b.created_at < s.t + interval '14 days') w1,
  bool_or(b.created_at >= s.t + interval '14 days' and b.created_at < s.t + interval '21 days') w2,
  bool_or(b.created_at >= s.t + interval '28 days' and b.created_at < s.t + interval '35 days') w4,
  bool_or(b.created_at >= s.t + interval '56 days' and b.created_at < s.t + interval '63 days') w8,
  bool_or(b.created_at >= s.t + interval '1 day') ever_after
  from s left join "BrandScans" b on lower(b.username)=s.h group by 1,2)
select wk, count(*) n,
  round(100.0*count(*) filter (where w1)/count(*),1) w1, round(100.0*count(*) filter (where w2)/count(*),1) w2,
  round(100.0*count(*) filter (where w4)/count(*),1) w4, round(100.0*count(*) filter (where w8)/count(*),1) w8,
  round(100.0*count(*) filter (where ever_after)/count(*),1) ever from a group by 1 order by 1;
-- C3 launch-week signup rate
select (select count(distinct lower("xUsername")) from "EmailSignup" where "createdAt" >= '2026-03-16' and "createdAt" < '2026-03-23') signups,
       (select count(distinct lower(username)) from "BrandScans" where created_at >= '2026-03-16' and created_at < '2026-03-23') handles;
-- C4 October
select (select count(*) from "EmailSignup" where "createdAt" >= '2026-10-01') signups, (select count(distinct lower(username)) from "BrandScans" where created_at >= '2026-10-01') handles, (select count(*) from "BrandScans" where created_at >= '2026-10-01') scans;
-- C5 Oct 22 email recipients who rescanned
with r as (select distinct lower(replace(e."xUsername",'@','')) h from "EmailSend" s join "EmailSignup" e on e.id=s."emailSignupId" where s.campaign='studio-tease-oct22')
select count(distinct lower(b.username)) rescanned, (select count(*) from r) recipients from "BrandScans" b join r on r.h=lower(b.username) where b.created_at >= '2026-10-22';
```
