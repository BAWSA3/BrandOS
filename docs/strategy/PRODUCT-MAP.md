# BrandOS product map and roadmap to Dec 3

Written 27 Oct 2026 from the code on `staging` (= prod since the 26 Oct promotion) and Jeffrey's
answers. Decisions it builds on:

- **Main product = the Record** (the creator dashboard). The Read is the free hook. The Index is a
  bonus layer until the brand side proves it pays (see `MILLION-DOLLAR-PLAN.md`).
- **First user = solo creators.** The outcome they pay $29/mo for = **grow** (followers, reach).
- **Habit = daily, while posting.** Not a weekly report.
- Keep and deepen: score + phases + history, what's working / best and worst posts, idea board +
  copywriter. Build: draft scoring in X's composer, "why my score moved", goals + coaching plan,
  brand-deal readiness. Legacy pages: fold the useful parts in, hide the rest.

## The short version (explain it like I'm 5)

- **BrandOS should be the thing a creator opens every time they post.** Today it's a place you
  visit after posting, if you remember. The money is in being there _before_ the post goes out.
- **Most of the parts already exist.** Every new post already gets its own BrandOS score and
  breakdown overnight (`PostScore`). The MCP can already read any post. The idea board and the
  copywriter already write in your voice. They just aren't wired into one daily loop.
- **The new dashboard dropped three things the old one had:** score history, the per-post
  breakdowns, and visit tracking (XP/streaks). Visit tracking matters most. Without it, the
  "do people come back?" number we promised to check by Dec 3 reads zero for everyone. Fix this first.
- **The 4 new features, in build order:** (1) "why my score moved" (cheap, the data exists),
  (2) a growth goal + plan, (3) draft scoring in X's composer (the daily habit, but the Chrome
  Web Store review is the risk, so start now), (4) brand-deal readiness (the bridge to the Index).
- **Legacy pages:** keep the ideas, hide the pages. The tier list becomes the Index leaderboard, the
  daily brief (/today) becomes the dashboard's "today" strip, and the archetype pages become the
  public classification pages.

---

## 1. The product in one line

**BrandOS keeps the record of creator reputation, and helps creators grow it every time they post.**

| Layer          | Job                                                        | Who pays                  | Status                                       |
| -------------- | ---------------------------------------------------------- | ------------------------- | -------------------------------------------- |
| **The Read**   | "What's my brand, really?" One minute, free, shareable     | Nobody. It's the hook     | Strong. Live                                 |
| **The Record** | "Help me grow, every time I post, and prove it's working"  | **Solo creators, $29/mo** | **The center.** Lots built, not one loop yet |
| **The Index**  | "Help brands find me" (later: "prove I deliver", receipts) | Brands/agencies (later)   | Bonus. Opens Nov 2, brand tools thin         |

The Read feeds the Record (sign up to keep your read), the Record feeds the Index (members are
listed), and the Index feeds the Read (brands and visitors scan people they find).

---

## 2. Feature inventory (verified in code)

Status: **working** = live and used; **partial** = exists, but incomplete, stale or not wired into
the current UI; **dead** = unreachable or not worth reviving. "Hidden" = blocked by the page
allowlist in `src/middleware.ts` (404 on prod).

### The Read

| Feature                                                 | Where                                                                 | Status                        | Verdict              | Why                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| Homepage scan → score, classification, 4 phases         | `/`, `src/components/XBrandScoreHero.tsx`, `/api/x-brand-score`       | working                       | **keep**             | The hook. New scoring (#214) blends model judgment with measured reach and audience   |
| Brand DNA / identity read                               | `/api/x-brand-identity`, `/api/x-brand-dna`                           | working                       | **keep**             | Depth behind the score; feeds post scoring and the copywriter                         |
| Score card + finishes, Copy image                       | scan result, `ScoreCardShare`                                         | working                       | **keep**             | The share loop                                                                        |
| Public brand page `/@handle` + compare                  | `src/app/b/[handle]`, `/api/brand-compare`                            | working                       | **deepen**           | Becomes the brand-deal readiness page (§4.4)                                          |
| Link previews                                           | `/api/og/*`                                                           | working                       | keep                 |                                                                                       |
| Voice fingerprint                                       | `/api/voice-fingerprint/*`, `VoiceFingerprintPanel`                   | partial                       | **fold into Record** | Useful as the "does this sound like you" check inside draft scoring                   |
| Archetype pages                                         | `/archetype`, `/archetypes`, `/archetype/[u]`                         | partial (old 8 archetypes UI) | **fold → Read**      | Become public classification pages (Class 01–08)                                      |
| Card page                                               | `/card/[username]`                                                    | working                       | keep                 |                                                                                       |
| MCP (Claude/ChatGPT): `analyze_profile`, `analyze_post` | `src/app/api/mcp`, `src/lib/mcp/tools.ts`, `src/lib/post-analysis.ts` | working                       | **keep + reuse**     | `analyzePost` is the engine for draft scoring (§4.1); it only takes a post link today |
| Public API v1                                           | `src/app/api/v1/*`, `/api-docs` (hidden)                              | partial                       | park                 | Not for solo creators now                                                             |

### The Record (center)

| Feature                                                                                              | Where                                                                                                   | Status                                    | Verdict                                      | Why                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Growth dashboard (score tile, growth, what's working, next moves, competitors, audience, idea board) | `/dashboard` → `src/components/growth/GrowthDashboard.tsx`                                              | working                                   | **keep, deepen**                             | The default for everyone with Pro (everyone until Dec 3)                                                                                                                                               |
| Visit tracking, XP, streaks                                                                          | `recordVisit` in `src/app/dashboard/page.tsx:92`                                                        | **broken for the growth dashboard**       | **fix now**                                  | Only runs on the legacy bento path; the growth path returns first. Dec 3 retention test depends on it                                                                                                  |
| Score history                                                                                        | `ScoreHistoryCard` (bento only)                                                                         | partial                                   | **deepen**                                   | Not on the growth dashboard. Needed for "why my score moved"                                                                                                                                           |
| Per-post score + breakdown (fit, voice, format, hook, fits/misses/sharpen, reach multiple)           | `PostScore` (mig 033), `src/lib/post-scores.ts`, cron `score-posts` 05:00, `/api/dashboard/post-scores` | working (data) / partial (UI: bento only) | **deepen**                                   | The raw material for "why my score moved" and draft scoring                                                                                                                                            |
| What's working: formats, best/worst posts                                                            | GrowthDashboard tile                                                                                    | working                                   | **keep, deepen**                             | Add "do more of this" actions                                                                                                                                                                          |
| Next moves                                                                                           | GrowthDashboard tile                                                                                    | working                                   | **deepen**                                   | Becomes the coaching plan (§4.3)                                                                                                                                                                       |
| Idea board (X-style composer, #222)                                                                  | `IdeaBoard.tsx`, `XComposer.tsx`, `/api/dashboard/idea-board`                                           | working                                   | **keep, deepen**                             | Add "score this draft" (§4.1)                                                                                                                                                                          |
| Copywriter chat                                                                                      | `/dashboard/write`, `CopywriterChat.tsx`, `/api/dashboard/copywriter`                                   | working                                   | **keep, deepen**                             | Drafts in your voice; send drafts to the board, score them                                                                                                                                             |
| Competitors / tracked brands, daily snapshots                                                        | GrowthDashboard, `tracked-accounts.ts`, cron `sync-accounts`                                            | working                                   | keep                                         | Context for growth; SMM-leaning, fine as is                                                                                                                                                            |
| Audience (who engages, who returns)                                                                  | GrowthDashboard tile                                                                                    | working                                   | keep                                         |                                                                                                                                                                                                        |
| Content calendar                                                                                     | `/dashboard/calendar`, `/api/calendar/*`                                                                | partial                                   | **fold into coaching plan**                  | A plan's week view; not its own product                                                                                                                                                                |
| Import                                                                                               | `/dashboard/import`                                                                                     | partial                                   | keep (quiet)                                 |                                                                                                                                                                                                        |
| Content check / drift alerts / brand health / repurpose                                              | `ContentCheckPanel`, `/api/drift-alerts`, `/api/brand-health`, `/api/repurpose`                         | partial (bento only / no UI)              | **fold into draft scoring + "why it moved"** | Same job, scattered                                                                                                                                                                                    |
| "Your brand was looked up" counts                                                                    | `lookupStats`, bento only; cron `lookup-digest`                                                         | partial                                   | **deepen**                                   | A strong reason to come back; missing from the growth dashboard                                                                                                                                        |
| Legacy bento dashboard                                                                               | `BentoDashboard.tsx`, `?design=v2`                                                                      | partial                                   | **retire after the move**                    | Move its good parts (history, post breakdowns, lookups, XP) into the growth dashboard, then hide                                                                                                       |
| Title screen `/home`                                                                                 | `src/app/home`                                                                                          | partial                                   | hide                                         | From the station era                                                                                                                                                                                   |
| Chrome extension (score badges next to usernames on X)                                               | `chrome-extension/`                                                                                     | **stale**                                 | **rebuild as the composer companion**        | Points at `brandos.app` (not mybrandos.app) and localhost; `/extension-auth` is blocked by the middleware; the score route returns `currentScore × 0.92` labelled "Cached score"; not on the Web Store |

### The Index (bonus)

| Feature                            | Where                                            | Status                      | Verdict     | Why                                     |
| ---------------------------------- | ------------------------------------------------ | --------------------------- | ----------- | --------------------------------------- |
| Index book, filters, featured      | `/creators` (public `/index`), `IndexBook.tsx`   | working (gated until Nov 2) | keep        | Nov 2 launch                            |
| Join / claim / reservations        | `/creators/join`, `/creators/claim`, mig 044/045 | working                     | keep        |                                         |
| Index tile on dashboard            | `IndexTile`                                      | working                     | keep        |                                         |
| Early-access codes                 | in progress (feat/invite-codes)                  | building                    | keep        | Early Index entry + Founding price      |
| Past brand deals                   | PR #211 (mig 046, open)                          | open PR                     | Nov 9+      | Start of receipts                       |
| Brand search / shortlist / contact | none                                             | missing                     | after Dec 3 | Only after the LOI test says brands pay |

### Legacy and side pages

| Page                                                              | Status         | Verdict                                                                        |
| ----------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `/tier-list`, `/tier-list/[u]`                                    | hidden         | **fold → Index leaderboard** (rank by score within a classification/niche)     |
| `/opp` (find your opp)                                            | hidden         | **fold → compare** on `/@handle` ("your closest match")                        |
| `/today` (daily brief: 1 idea, 1 metric, 1 action)                | live           | **fold → dashboard "today" strip** (§3), then redirect `/today` → `/dashboard` |
| `/early-access`                                                   | live           | redirect → `/` (invite links `/i/<code>` replace it)                           |
| `/breakdown` (old design, email capture)                          | live           | redirect → sign-up                                                             |
| `/intelligence` (report, `isPro = true`)                          | live           | **fold → "what brands see"** (§4.4), then hide                                 |
| `/audit/[session]` (paid Score Boost Audit)                       | live           | **fold → coaching plan**; hide the one-off product                             |
| `/bots`                                                           | live, flag off | keep parked (audience check behind Verified)                                   |
| `/score`, `/dna`, `/research`, `/docs`, `/enterprise`, `/article` | hidden / thin  | leave hidden                                                                   |

### Data note: are reposts leaking into "original posts"?

**No.** Checked against real data on 27 Oct: `src/lib/socialdata.ts` `isRecentOriginal` drops
retweets (`retweeted_status` or `RT @`), replies and the pinned post. @aunnieonchain's 18.8K-like
post is her own original (127K views); all 35 originals in her sample are hers. **The real issue is
that one viral post dominates:** `tweet-analysis.ts` computes engagement as total engagements ÷ total
views across the sample, so a single outlier can carry the whole rate. **Fix:** use the per-post
median for engagement rate, and show outliers separately ("your best post did 70× your usual").
Effort S.

---

## 3. The solo-creator growth loop

```
 ┌──────────── DAILY, WHILE POSTING ────────────┐
 │ 1. Today strip: 1 idea, 1 metric, 1 action   │  dashboard top (fold /today)
 │ 2. Draft → score it before posting           │  composer: idea board · copywriter · extension in X
 │    (fit · hook · format · "sounds like you") │
 │ 3. Post on X                                  │
 └──────────────────────┬───────────────────────┘
                        ▼
 4. Overnight: post scored (PostScore 05:00), accounts synced (04:00), reach vs your usual
                        ▼
 5. "Why my score moved": the 2–3 posts that moved each phase, up or down
                        ▼
 6. Goal + plan: progress on this week's target (e.g. Generate 70 → 80, +300 followers)
                        ▼
 7. Next move → back to 1                               Proof: "BrandOS growth" (§4.0)
```

| Loop step         | Exists today                                                          | Gap                                                    |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| 1 Today strip     | `/today` page (separate), next moves tile                             | Not on the dashboard; not daily-fresh                  |
| 2 Score a draft   | `analyzePost` (needs a posted link), voice fingerprint, content check | **No draft-text input anywhere; nothing inside X**     |
| 3 Post            | X                                                                     | —                                                      |
| 4 Overnight read  | `score-posts`, `sync-accounts`, `performance-sync` crons              | Score itself only moves on manual rescan               |
| 5 Why it moved    | PostScore + BrandScans history                                        | **Not connected; history not on the growth dashboard** |
| 6 Goal + plan     | next moves, calendar                                                  | **No goals**                                           |
| 7 Proof of growth | followers chart, engagement                                           | **No "since you joined" number**                       |

---

## 4. Specs (short, buildable)

### 4.0 The proof metric BrandOS shows every member

**"Since you joined BrandOS: +412 followers, reach up 38% (avg views per post), 9 posts scored
80+."** Shown at the top of the dashboard and in the weekly lookup digest.

- Data: `TrackedAccount` daily snapshots (exists), the join date (exists), PostScore views (exists).
  Baseline = the first snapshot or the scan at sign-up.
- Honest rules: show the change, never claim we caused it; show a range when the sample is small.
- Effort **S**. This is also how we measure every feature below.

### 4.1 Draft scoring (in BrandOS first, then inside X's composer)

- **User story:** "Before I post, tell me if this fits my brand and will land, and how to sharpen it."
- **Shows:** fit score (0–100), hook, format, "sounds like you" (voice fingerprint), one sharpen
  suggestion, and the predicted reach band vs your usual ("likely 0.8–1.5× your normal").
- **Data:** exists: `analyzePost` engine, voice fingerprint, PostScore history (for the reach
  band), brand from the latest scan. Missing: a text input path (`analyzeDraft(text, userId)`), a
  per-user daily cap, and the reach-band model (start simple: median views of posts with a similar
  format and fit).
- **Phase A (S–M, week of Nov 2):** "Score this draft" button in the idea board composer and the
  copywriter. Post-to-X opens X with the text prefilled (web intent), so the draft travels with you.
- **Phase B (M–L, start now, ship when approved):** rebuild the Chrome extension as a composer
  companion. A small BrandOS chip in X's compose box scores the draft on demand. Sign in with the
  BrandOS session (fix `/extension-auth` in the middleware allowlist, use mybrandos.app). Drop the
  username badges, or keep them behind a toggle.
- **Moved growth?** Scored-then-posted posts vs unscored posts: median views and fit, per member,
  over 2 weeks. Pass: scored posts get ≥ 20% more views on the median.

### 4.2 "Why my score moved"

- **User story:** "My score went 72 → 75. Which posts did that?"
- **Shows:** on the score tile, the change since the last read plus the 2–3 posts that pushed each
  phase up or down. Example: "Generate +4: your thread on TCG pulls did 3× your usual reach." Links to
  each post's breakdown.
- **Data:** exists: BrandScans history (score + phases per read), PostScore (fit, multiple,
  fits/misses) for posts between two reads. Missing: a diff function (posts between read N-1 and N,
  ranked by contribution: reach multiple × fit for Generate/Scale, fit/voice for Define/Check) and
  bringing score history to the growth dashboard.
- **Also:** an auto re-read every 3–7 days for active members (cost ≈ $0.03–0.06 a read), so the
  score moves without a manual rescan.
- Effort **S–M**. **Moved growth?** Returning visits after a "moved" event (UserProgress, once
  fixed) and whether members post more of the posts flagged as helping.

### 4.3 Goals + coaching plan

- **User story:** "I want +500 followers this month. Tell me what to do each week."
- **Shows:** one goal, picked from the read (weakest phase or a follower/reach target). A 4-week
  plan: this week's 3 moves, drawn from next moves, what's working and the idea board. Progress
  updates daily from snapshots and PostScore.
- **Data:** exists: next moves, what's working, idea board, snapshots. Missing: a `Goal` table
  (target, metric, start, deadline), a plan generator (model call over existing data, weekly), and
  check-off. Folds in the calendar (the plan's week view) and the audit (the coaching content).
- Effort **M**. **Moved growth?** Goal hit rate; members with a goal vs without, follower change.

### 4.4 Brand-deal readiness ("what brands see")

- **User story:** "If a brand looked me up today, would they hire me? What should I fix?"
- **Shows:** a preview of the member's `/@handle` page and Index entry as a brand sees them, a
  readiness checklist (classification, a clear niche, consistent posting, an audience that looks
  real, past deals), and a one-page media kit (PDF/link): score, phases, audience, best posts,
  past deals.
- **Data:** exists: public page, Index entry, audience, past deals (#211). Missing: the checklist
  rules, the media-kit page, and "brands that viewed you" (lookup counts exist).
- Effort **M**. Folds in `/intelligence`. **Moved growth?** It's the bridge to the Index, not
  growth: count media-kit shares, plus deals logged (#211).

### 4.5 Deepen the existing pieces

| Piece                         | Deepen with                                                                                                            | Effort |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| Score + phases + history      | History chart on the growth dashboard; the "moved" deltas (§4.2); auto re-read                                         | S      |
| What's working / best & worst | Median-based engagement (§2 note); "do more of this" (makes an idea from your best format); a separate outlier callout | S      |
| Idea board + copywriter       | Score this draft (§4.1A); post via X intent; ideas tagged to the goal (§4.3)                                           | S–M    |
| Per-post breakdowns           | Bring PostScore cards from the bento into the growth dashboard ("your last 5 posts")                                   | S      |
| Lookups                       | "Your brand was looked up 14× this week" on the growth dashboard                                                       | S      |

---

## 5. Legacy fold-in plan

| Page                                                 | Useful part                                            | Moves to                                                | Then                        |
| ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- | --------------------------- |
| `/today`                                             | 1 idea · 1 metric · 1 action                           | Dashboard "today" strip (loop step 1)                   | Redirect → `/dashboard`     |
| Bento dashboard                                      | History, post breakdowns, lookups, XP/streak, check-in | Growth dashboard                                        | Retire `?design=v2`         |
| `/tier-list`                                         | Ranking                                                | Index leaderboard by classification/niche (after Nov 9) | Stays hidden                |
| `/opp`                                               | Matching                                               | "Your closest match" in compare                         | Stays hidden                |
| `/archetype*`                                        | Class pages                                            | Public "Class 03 BUILD.EXE" pages linked from cards     | Redirect old URLs           |
| `/intelligence`                                      | Cohort/report content                                  | What brands see (§4.4)                                  | Hide                        |
| `/audit`                                             | Score-boost coaching                                   | Coaching plan (§4.3)                                    | Hide the paid one-off       |
| `/early-access`                                      | Email capture                                          | Invite links `/i/<code>`                                | Redirect → `/`              |
| `/breakdown`                                         | Email capture                                          | Sign-up                                                 | Redirect → `/signup`        |
| `/home`                                              | Title-screen menu                                      | —                                                       | Hide                        |
| Content check, drift alerts, brand health, repurpose | Draft checks, drift                                    | Draft scoring + "why it moved"                          | Remove dead UI entry points |

---

## 6. Roadmap to Thu 3 Dec

One builder plus agents. Index work is only what the GTM plan needs.

| Week                          | Record (center)                                                                                                                                                                                                                                                                  | Read / Index (only what's needed)                          | Proof to watch                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| **Oct 27–Nov 1** (pre-launch) | **Fix visit tracking on the growth dashboard** (XP/streak, adopt public scan, avatar refresh). Score history + "your last 5 posts" + lookups on the growth dashboard. Median engagement. Proof metric (§4.0). **Start the extension rebuild and submit to the Chrome Web Store** | Invite codes live; testers onboard                         | Testers' visits recorded                           |
| **Nov 2–8** (Index opens)     | "Why my score moved" (§4.2) + auto re-read every 3–7 days for active members. "Score this draft" in the idea board/copywriter (§4.1A)                                                                                                                                            | Index launch, reply wave; fold `/today` into the dashboard | D1/D7 visits; drafts scored per member             |
| **Nov 9–15**                  | Goals + coaching plan (§4.3), folding in calendar + audit                                                                                                                                                                                                                        | Verified campaign (GTM); past deals (#211)                 | Members with a goal; scored vs unscored post reach |
| **Nov 16–22**                 | Extension live (if approved): score inside X's composer. Brand-deal readiness v1 (§4.4)                                                                                                                                                                                          | Receipts teaser                                            | Daily active scorers                               |
| **Nov 23–Dec 3** (deadline)   | Polish the loop from tester feedback; the "since you joined" growth line in emails                                                                                                                                                                                               | Founding countdown; redirect legacy pages                  | Week-4 activity ≥ ~20%, trial→paid                 |

**Dependencies and risks**

- **Chrome Web Store review:** typically days, sometimes 1–3 weeks for a new extension with host
  permissions on x.com. Submit by Nov 1. Phase A (draft scoring inside BrandOS) doesn't depend on it.
- **X's composer DOM changes** break content scripts. Keep selectors centralized (already done in
  `content.js`) and fall back to a popup that scores clipboard text.
- **SocialData cost of daily reads:** a full re-read is ≈ $0.013 of SocialData + $0.02–0.05 of
  Claude. Re-reading every active member every 3 days at 1,000 members ≈ $10–20/day. Scoring drafts
  uses no SocialData (text only) and is ~$0.005–0.01 Claude per draft; cap ~30/day per member.
  Balance is ~$7; top up before Nov 2.
- **X API / SocialData limits:** snapshots and post scoring already run as crons; batch per hour
  rather than per visit.
- **Vercel Hobby:** ~100 deploys/day and 1 hour of logs. A busy launch week will hit both; Pro
  ($20/mo) removes the risk.
- **Retention measurement depends on the visit-tracking fix.** Without it, the Dec 3 cohort test
  has no data.

---

## 7. Open questions for Jeffrey

1. **Extension scope:** composer chip only, or keep the score badges next to usernames too (a
   toggle)? Badges cost a lookup per username on screen.
2. **Auto re-read cadence:** every 3 days for active members, weekly for everyone else? It sets the
   SocialData/Claude budget.
3. **Draft scoring limit:** what daily cap per member (proposed 30), and does it count against the
   MCP's 10-a-week free tier for non-Pro after Dec 3?
4. **The goal:** do members pick it (followers / reach / a phase), or does BrandOS pick it from the
   read?
5. **Media kit:** public link anyone can see, or only shared on request?
