# Track record: BrandOS Verified + campaign receipts

Spec for after the Nov 2 launch. Decided with Bawsa on Oct 23, 2026; the decisions below are
settled, so don't re-open them without him.

## Why this, and why us

Creator-discovery tools help brands find creators who _might_ fit, using what creators say
about themselves (rates, niches, audience claims). Nobody shows **what a creator actually
delivered last time**. That is the gap BrandOS owns: **reputation you can check**.

We're unusually placed to do it because the growth dashboard already tracks, for every account,
its recent posts with metrics (`AccountPost`, migration 040), a daily snapshot (`AccountSnapshot`),
and who replies to and reposts it (`AudienceInteraction`, migration 041). A creator's normal
performance (their baseline) and their real audience are already in the database.

## Decisions (Oct 23)

| Question                  | Decision                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| The pain to own           | **No track record**: brands can't see how a creator's past promotions performed          |
| Who it's for first        | **Creators prove it** (creator pays); brands use it free to verify                       |
| Market                    | **Crypto first**                                                                         |
| What makes it trustworthy | All four: **outcome data, public history audit, peer vouching, audience authenticity**   |
| Track record means, first | **Campaign delivery**: deals done through BrandOS, on time, on brief, results            |
| Bad marks                 | **Shown publicly, with the creator's context** (honesty is what makes it worth trusting) |
| Where it shows            | `/@handle` page, shareable report, **verified badge**, later brand search                |
| Timing                    | **After Nov 2.** Verified badge as a week-2 campaign; receipts as the Nov/Dec headline   |

## Part 1: BrandOS Verified (week 2 after launch, ~Nov 9–23)

A marketing headline that can stand on its own before receipts exist.

**Who:** Pro / founding members only. During the free window (until Dec 3) everyone has Pro
access, so "get Verified" in practice means **add a card and lock in $29**: the badge is the
Founding 100 conversion push.

**A badge means (v1, all checkable now):**

1. **Verified owner:** signed in with X, so they control the account.
2. **Real audience:** an authenticity check on who engages (below).
3. **Active brand read:** a current score, archetype and phases on `/@handle`.

**Blocked by:** fake audience · brand score under the threshold (start at 50) · unresolved bad
marks (once receipts exist).

**It grows:** "✓ Verified" → "✓ Verified · 3 receipts". A ladder, not a one-time sticker.

### Audience authenticity check (new)

From `AudienceInteraction` (repliers, reposters, quoters on their best recent posts, already
collected). Flag an audience as suspicious when a large share of engagers look like:

- **brand-new or empty accounts** (account age, followers/following ratio, near-zero posts),
- **pods**: the same small group engaging on nearly every post, often within minutes,
- **reply spam**: generic one-liners repeated across many accounts.

Output: `authenticity` 0–100 with the main reason, stored per account per week. Needs one more
field per engager (account creation date, following count), which SocialData returns on the
same user objects; add it to the audience sync. Threshold and weights get tuned on real data from
the launch accounts before the campaign.

### Badge surfaces

- `/@handle`: a Klein "✓ BrandOS Verified" mark next to the handle + what was verified (owner,
  real audience %, score), with the date checked.
- Bio line: "✓ BrandOS Verified", linking to `/@handle`. Every verified creator advertises
  BrandOS.
- Share image (`/api/og`): the badge on their Brand Pass.
- Re-checked weekly; a badge can lapse (stated plainly on the page if it does).

### The campaign

- Hook post: _"brands can't tell real creators from bought ones. so we made it checkable."_
  Show the badge on `/@jbawsa`, then _"drop your handle, i'll check if you qualify."_
- "First 100 verified" (ties to Founding 100; honest scarcity).
- Data post: _"we checked 50 crypto accounts: here's how many audiences were real."_ Only with
  real numbers from the check.
- Reply wave: every handle dropped gets their check result and `/@handle` link.

## Part 2: campaign receipts (Nov–Dec headline)

A receipt is a verified record of one brand deal.

### Flow

1. **Logged.** The brand or the creator logs a campaign: brand, creator, brief (what was agreed),
   deliverables (e.g. "2 posts + 1 thread, include @brand and the link, disclose as #ad"), dates.
   The other side confirms it exists. Brands use BrandOS free.
2. **Verified automatically** from public data the dashboard already collects:
   - **Delivered:** the posts exist, on the agreed dates, with the required handle/link.
   - **Disclosed:** marked as paid (#ad, "partnered with", X's paid-partnership label if exposed).
   - **Performed:** engagement compared with **the creator's own baseline** ("1.8× their usual"),
     from `AccountPost` before the campaign.
   - **Real audience:** the authenticity check, run on the campaign posts' engagers.
3. **Confirmed by the brand.** The brand confirms delivery and can add outcomes (clicks,
   signups, conversions; optional, self-reported and labeled as such). The confirmation counts as
   a vouch, weighted by the brand's own standing.
4. **Added to the track record**, with any bad marks (missed date, no disclosure, deleted post,
   brand dispute) shown **with the creator's context note**.

### What a creator's track record shows

- Receipts: brand, date, deliverables, verified checks (✓/✗), performance vs baseline, brand
  confirmation, outcomes if shared.
- Summary: campaigns completed, on-time %, disclosure %, median performance vs baseline,
  repeat brands, authenticity.
- Bad marks with context. No hidden items; the creator can't delete a confirmed receipt.

### Data (sketch, not final)

- `Campaign` (id, brandAccountId or brand name/handle, creatorAccountId, brief, deliverables
  JSON, startsAt, endsAt, status, loggedBy, confirmedByCreatorAt, confirmedByBrandAt).
- `CampaignPost` (campaignId, tweetId) linking delivered posts.
- `CampaignCheck` (campaignId, check: delivered/disclosed/performed/authentic, result, detail,
  checkedAt).
- `CampaignOutcome` (campaignId, metric, value, source: brand-reported).
- `CampaignNote` (campaignId, author: creator/brand, text): context on bad marks.
- Extend `AudienceInteraction` with the engager's account age + following count for the
  authenticity check.

### Abuse to plan for

- **Fake brands confirming fake campaigns:** brand confirmations are weighted by the brand
  account's own standing (age, real audience, other receipts); unconfirmed or low-standing
  receipts are labeled.
- **Creators logging and self-confirming:** a receipt needs the other party's confirmation from
  their own X-verified account.
- **Deleting bad posts:** we keep what we saw (post text, metrics, time) when the campaign is
  checked, so a deletion is itself recorded.

## Go-to-market

- **The first 10–20 receipts are brokered by Bawsa personally** (his network and agency
  contacts), so track records exist before anyone has to "join a platform".
- Creators pay (Pro): a receipt history is a credit report that wins deals. Brands get it free,
  which is what brings them onto BrandOS and creates more receipts.
- Brand search (filter creators by verified track record) comes after there are enough receipts
  to make it useful.

## Order of work

1. Audience authenticity check (extends the audience sync) → tuned on the launch accounts.
2. Verified badge: criteria, weekly re-check, `/@handle` + share image + bio line.
3. Verified campaign (week 2 after launch).
4. Campaigns: log + confirm flow (brand side free), automatic checks, receipts on `/@handle`.
5. Track record report (shareable) and the badge ladder ("Verified · N receipts").
6. Brand search.
