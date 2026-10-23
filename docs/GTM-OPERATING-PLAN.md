# BrandOS go-to-market operating plan: problem first, then the Creator Index

Written Oct 22, 2026 with Bawsa. Runs **Fri Oct 23 → Thu Dec 3** (the Founding 100 deadline).
Works alongside `docs/LAUNCH-PLAN.md` (offer, Stripe, email rules), which stays the source of
truth for the offer. This file is the day-by-day plan: check items off here.

## Decisions (Oct 22, don't re-open without Bawsa)

| Question                  | Decision                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The problem we own        | **Creators are invisible to brands.** They post every day; brands don't find them, or find them and can't trust what they see.       |
| The product that fixes it | **The BrandOS Creator Index**: a public book of creators brands can browse, with real brand reads behind every entry                 |
| Who's in the Index        | **Opt-in account holders only.** Sign in with X, choose to join, leave any time                                                      |
| Free vs paid              | **Free to be listed. Pro to stand out**: Featured placement, full profile, "brands that viewed you", the Verified badge (from Nov 9) |
| Price                     | Unchanged (LAUNCH-PLAN): free full access until Dec 3; Founding 100 add a card to keep $29/mo for life; $39 after 100                |
| Bawsa's time              | Full-time on distribution                                                                                                            |
| Parked                    | "How many bots follow you?" (/bots, flag-gated off). Comes back as the audience check behind Verified                                |
| Parked                    | Platforms beyond X (lowers the X/SocialData dependency). Not before Dec 3                                                            |

## Changes from market research (Oct 23, approved by Bawsa)

The first competitor and demand sweep (`docs/research/2026-10-23-competitors.md`,
`docs/research/2026-10-23-demand.md`) found: X announced Creator Connect (brand-side AI
matching creators can't apply to); Kaito closed its leaderboards and runs a curated
marketplace; **trust** ("is this account real, will they deliver?") is the strongest pain;
**brands, not creators, are the scarce side**. The decisions above stand. These seven
changes are written into the calendar, rules and build table below:

1. Two new Problem posts: Creator Connect (Sun 25) and "the leaderboards are gone" (Mon 26)
2. Brand DMs start **Mon Oct 26** (not Nov 9), aimed at companies hiring KOL managers
3. New rule on Sun Nov 1: if brands prefer shortlists, the brand view gets "request a shortlist"
4. Brand view moves from Nov 8 to **Nov 5**
5. The track record starts at join: optional "past brand deals" (migration 046, `IndexDeal`);
   the receipts post moves from Nov 20 to Nov 12
6. 👤 Check X's paid-partnership rule for crypto by Oct 28
7. Weekly competitor check every Sunday (`/market-research competitors`)

## The framework: Problem → Proof → Product → People → Price

Every post, email and DM belongs to one of five jobs, and they run **in this order**. Nobody
buys a fix for a problem they haven't been made to feel, so the first 10 days sell nothing.

| #   | Job         | What it does                                             | Example                                                     |
| --- | ----------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | **Problem** | Names the pain so creators say "that's me"               | "you post every day. brands still don't DM you. here's why" |
| 2   | **Proof**   | Shows you understand the problem better than anyone      | Teardowns: "this is what a brand sees when they look at @x" |
| 3   | **Product** | Introduces the fix: the Index, the brand read behind it  | "the creator index is open. join free"                      |
| 4   | **People**  | Shows others joining, so joining feels normal and urgent | Daily member spotlights; "212 creators joined in 3 days"    |
| 5   | **Price**   | Turns members into payers with a real deadline           | "Founding 100: 23 spots left, $29 for life, ends Dec 3"     |

**Mix by phase** (share of posts):

| Phase                      | Problem | Proof | Product    | People | Price |
| -------------------------- | ------- | ----- | ---------- | ------ | ----- |
| 1. Name it (Oct 23–Nov 1)  | 50%     | 50%   | tease only | –      | –     |
| 2. Open it (Nov 2–8)       | 20%     | 20%   | 30%        | 30%    | –     |
| 3. Stand out (Nov 9–22)    | 10%     | 20%   | 20%        | 30%    | 20%   |
| 4. Deadline (Nov 23–Dec 3) | 10%     | 10%   | 10%        | 30%    | 40%   |

**Rules for every piece:**

- One idea per post. Lowercase, your voice. Real numbers only; never invent stats.
- Links go in the first reply, not the post.
- Every post ends with an action: a question (phase 1), "drop your handle" (proof), or "join" (from Nov 2).
- Save every reply and DM worth keeping to `CUSTOMER-VOICE.md`. That's next week's copy.

## The Creator Index (what gets built)

**What a visitor sees** at `mybrandos.app/index`:

- A grid of members: avatar, handle, **Index number** ("No. 0042"), archetype, brand score,
  up to 3 niche tags, a one-line "what brands should know". Featured (Pro) first, then newest.
- Filters: niche, archetype, score range. Each card opens the member's `/@handle` page.
- Header: "The BrandOS Creator Index: creators with a real brand read behind them." Live member count.

**How a creator joins** (the reason to sign up):

1. "Join the Index" (homepage, scan result, `/index`, every post's first reply).
2. Sign in with X → their scan runs (or reuses one less than 7 days old).
3. Pick up to 3 niches + write one line for brands → tick "list me" → they get their number.
4. Share card: "I'm No. 0042 in the BrandOS Creator Index" with their archetype. Early numbers
   are status, so people share them.

**Pro ($29 founding) adds:** Featured placement; full profile (score history, best posts,
archetype breakdown); **"brands that viewed you"** (the strongest upgrade trigger once brands
browse); the Verified badge from Nov 9.

**Build (Oct 23–28):** `IndexEntry` table (migration 044: userId, handle, number, niches,
blurb, joinedAt, listed), join flow, `/index` page, OG share card, "Join the Index" CTAs,
profile-view counts. Uses existing scan data, so the only SocialData cost is a join scan
(~$0.015, skipped if a fresh one exists).

## Daily operating rhythm (full-time)

| Time        | Block                        | What exactly                                                                                                    |
| ----------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 8:00        | **Numbers** (15 min)         | Yesterday's scans, signups, Index joins, cards added. Write them in the scorecard below                         |
| 8:30        | **Write**                    | Finish today's two posts from the calendar                                                                      |
| 9:30        | **Post 1 (anchor)**          | The calendar post. Link in the first reply                                                                      |
| 9:30–11:30  | **Reply wave**               | Answer every reply. Every handle dropped → scan → reply with their `/@handle`                                   |
| 12:00–13:30 | **Outreach**                 | 30 personal DMs to target creators (list below). Use their real score                                           |
| 14:00       | **Post 2 (light)**           | Teardown, member spotlight, build-in-public, or a poll                                                          |
| 14:00–16:00 | **Reply wave 2**             | Same as the morning                                                                                             |
| 16:00–17:30 | **Brand side** (from Oct 26) | 5 brand/agency DMs a day. Until Nov 5: "browse or shortlist?" From Nov 5: "browse the Index free, early access" |
| 18:00       | **Calls**                    | Founding member onboarding calls / recorded teardowns (the Founding promise)                                    |
| 21:00       | **Log** (20 min)             | `CUSTOMER-VOICE.md`, tomorrow's posts drafted, DM list for tomorrow                                             |

**Who to DM** (in order): people who replied "ACCESS" (213+) → anyone who dropped a handle on
past posts → the 1,010 email list who scanned but have no account → crypto creators with
5k–100k followers in your niche (they're big enough for deals, small enough to feel unseen).

**The DM** (personalize the first line every time):

> saw your post on {topic}. ran your brand read: you're {archetype}, {score}/100. the gap
> brands will notice is {weakest phase}. i'm opening an index brands can browse on nov 2.
> want an early number?

## Calendar

### Phase 1: Name the problem (Fri Oct 23 → Sun Nov 1). Sell nothing.

| Date      | Post 1 (anchor, Problem)                                                                             | Post 2 (Proof / tease)                                                                                                                                           | Also                                                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fri 23    | Thread: "brands aren't ignoring you. they can't see you." 5 reasons a good creator stays invisible   | Teardown: @0xHvdes, reframed as "what a brand sees"                                                                                                              | DM 15 brand marketers: "how do you pick creators?" (research + brand warm-up)                                                                                                                        |
| Sat 24    | "follower count is the worst way to pick a creator. here's what brands should look at"               | Teardown: @galileowilson                                                                                                                                         | Start the DM list (ACCESS repliers)                                                                                                                                                                  |
| Sun 25    | Poll: "have you ever lost a brand deal and never found out why?"                                     | "x now picks creators for brands. you can't apply, and you can't see if you were picked." (Creator Connect, announced May 2026: state it as fact, not an attack) | Reply-wave the poll                                                                                                                                                                                  |
| Mon 26    | "i asked {n} brand marketers how they pick creators. here's what they said" (real answers only)      | "the leaderboards are gone. how do crypto projects find you now?"                                                                                                | **Brand DMs start** (5/day): KOL leads at Tether, Consensys, Bitmex, Bitpanda, Woo, CoinMarketCap, Trust Wallet. Ask: "browse a list, or get a shortlist sent to you?" Log answers in CUSTOMER-VOICE |
| Tue 27    | "the creator brands pick vs the creator brands skip" (side by side, two real reads, with permission) | Teardown: @Carlitoswa_y                                                                                                                                          | Build-in-public (moved from Mon): the Index design, no link, as a quote-post                                                                                                                         |
| Wed 28    | "your bio is a pitch. most bios pitch nothing" + 3 rewrites                                          | Tease: "i'm building the fix. reply 'index' for an early number"                                                                                                 | 👤 Live payment check (LAUNCH-PLAN). 👤 Read X's paid-partnership policy logged out (help.x.com): can crypto brands pay creators? If not, rethink the crypto brand side before Nov 9                 |
| Thu 29    | "brands check 3 things before they DM you" (score, consistency, audience)                            | Teardown #4                                                                                                                                                      | Promote staging → prod (Index behind a flag)                                                                                                                                                         |
| Fri 30    | "the most underpaid creators are the ones brands can't verify"                                       | Index preview screenshot                                                                                                                                         | DM every "index" reply: early number on Nov 2                                                                                                                                                        |
| Sat 31    | "Index No. 0001" (you join first, show your card)                                                    | Teardown #5                                                                                                                                                      |                                                                                                                                                                                                      |
| Sun Nov 1 | "tomorrow." Short post + the Index card                                                              | –                                                                                                                                                                | Preflight; pre-warm scans for everyone on the DM list                                                                                                                                                |

### Phase 2: Open the Index (Mon Nov 2 → Sun Nov 8)

- **Mon Nov 2, launch.** Pinned thread: the problem → why follower counts fail → the Index →
  "join free, get your number" → Founding 100 in the last post. Launch email to the list
  (LAUNCH-PLAN email #1). DM everyone who said "index" or "ACCESS". Reply wave all day.
- **Every day:** Post 1 = member spotlight ("today's new members": 3 creators, their
  archetypes and one line each; they repost it). Post 2 = teardown or a problem post.
- **Wed Nov 4:** "{n} creators joined in 48 hours. here's what the Index shows so far"
  (real aggregate numbers: niches, average score, most common archetype).
- **Thu Nov 5:** brand view live (moved from Nov 8). Every brand that answered a DM gets
  read-only access; with "request a shortlist" if the Nov 1 rule says so.
- **Fri Nov 6:** nudge email to everyone who hasn't joined (LAUNCH-PLAN email #2).
- **Sun Nov 8:** week-1 recap post + update the funnel rates in LAUNCH-PLAN with real ones.

### Phase 3: Stand out (Mon Nov 9 → Sun Nov 22)

- **Mon Nov 9:** Verified campaign (`x-post-ideas/2026-11-verified-campaign.md`): Pro +
  owner + score 50+ (+ audience check if budget allows; that's the parked /bots work).
- **Brand side keeps going** (started Oct 26, browsing since Nov 5): 5 brand/agency DMs a day
  with free Index access. Each brand that browses creates "a brand viewed your profile"
  moments: that's the upgrade trigger.
- **Price posts start (20%):** honest counter: "Founding 100: {n} left. $29 for life, ends Dec 3."
- **Thu Nov 12:** data post: "what {n} creators in the Index have in common" (real numbers).
  Post 2, receipts (moved from Nov 20): "{n} members have logged {m} past brand deals. next:
  brands confirm them." Real counts from `IndexDeal` only.

### Phase 4: Deadline (Mon Nov 23 → Thu Dec 3)

- Price posts at 40%: spots left, "ends Dec 3", one member story a day (why they locked in).
- First brand intro made through the Index → a case study post, with both sides' permission.
- **Mon Nov 30, Wed Dec 2:** founding deadline emails (LAUNCH-PLAN).
- **Thu Dec 3:** first charges. Thank-you post naming the Founding members who agree to it.

## Targets and decision rules

The targets are estimates to replace with real rates after week 1.

| By         | Index members                                    | Cards added (Founding) | If it's below the line                                                                                                     |
| ---------- | ------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Sun Nov 1  | 50 early numbers promised (DM/replies)           | –                      | Phase 1 posts aren't landing: switch to more teardowns (proof gets replies)                                                |
| Sun Nov 1  | Brand DMs: count "browse" vs "shortlist" answers | –                      | Most say shortlist → the Nov 5 brand view adds "request a shortlist" (you hand-pick from the Index; each pick logs a view) |
| Sun Nov 8  | 200                                              | 10                     | Joins low → fix the join flow first (watch 3 people join live). Cards low → DM every member personally                     |
| Sun Nov 22 | 400                                              | 25                     | Start the brand side harder: "brands viewed you" is the upgrade reason                                                     |
| Thu Dec 3  | 500                                              | **40** (goal 30–50)    | Extend nothing. Talk to every member who didn't add a card; log why                                                        |

**The one number:** cards added. Joins, scans and impressions only matter if they move it.

## Daily scorecard (copy this block each day)

```
Date:
Scans:            Signups:          Index joins:        Cards added (total):
Posts:  1)                          2)
DMs sent:         DM replies:       Calls:
Best reply/DM (→ CUSTOMER-VOICE):
Tomorrow's two posts:
```

## Money and limits

- **SocialData balance is ~$8 (Oct 23).** Index joins reuse scans (≤ ~$0.015 each); /bots stays
  off. Top up from the first payments. Keep the nightly audience sync paused until then.
- Don't spend on ads before Dec 3. The plan runs on your 31k followers, the 1,010 list and DMs.

## What gets built, and when

| By      | What                                                                             | Who         |
| ------- | -------------------------------------------------------------------------------- | ----------- |
| Oct 25  | Index MVP: table (044), join flow, `/index`, share card, "Join the Index" CTAs   | Claude      |
| Oct 27  | Pro perks: Featured, full profile, profile-view counts                           | Claude      |
| Oct 27  | Past brand deals: `IndexDeal` (046), API, optional step after joining            | Claude      |
| Oct 28  | Live payment check; X crypto paid-partnership rule check                         | 👤          |
| Oct 29  | Promote to prod with the Index behind a flag; "run 044" (+ 045, 046) on both DBs | 👤 + Claude |
| Nov 1   | Preflight; Index switched on for the early-number list                           | Claude      |
| Nov 2   | Index public                                                                     | –           |
| Nov 5   | Brand view: read-only Index access for invited brands (moved from Nov 8)         | Claude      |
| Nov 12  | Brand confirms a past deal (one-time link from the creator)                      | Claude      |
| Sundays | `/market-research competitors`: what changed (Creator Connect, Kaito, Favikon)   | Claude      |
| Nov 9   | Verified badge                                                                   | Claude      |
