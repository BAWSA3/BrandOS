# Post look-back loop — spec (2026-10-28)

The behavior BrandOS should own: a post settles → an honest look-back → a lesson
the member keeps → the lesson marks their next draft in the live composer
(docs/LIVE-COMPOSER-SPEC.md). Every post teaches the next one.

**Timing:** history storage ships now (migration 050). The feature itself ships after Nov 2.

## What the data says (12 early-access testers, last 30 days, original posts)

- Only **4 of 12 post near-daily** (4–7 a week). One posts about once a week; **7 barely
  post** (0–3 in 30 days).
- Views are noisy. For the active posters, a post at the 90th percentile gets **4–12×
  the views** of one at the 10th, from the same person in the same month.
- So a single post's swing is mostly normal variance. The loop must say so.

## Honesty rule

**No single-post "why" without a repeated pattern.**
- Inside their normal swing, the look-back says "that's a normal swing for you".
- It names a reason only when the same shape (hook, format, topic, time, lane) beats or
  trails their own normal across several posts.

## The loop

| Step | What happens |
|---|---|
| Settle | A post's numbers are kept at first sight, ~24h and ~48h (`PostMetricCheckpoint`). It's "settled" at the 48h checkpoint. |
| Look-back | Compared against their own normal, their past patterns and their playbook (lane + voice). Similar-creator comparison comes after launch, once the Creator Index has depth per lane. |
| Lesson | Shown as one line plus its evidence (which posts, how much). The member chooses **keep**. Nothing is kept automatically. |
| Carry | Kept lessons become live-composer marks on the next draft. The member can turn any one off. |

## Rhythm and triggers

- **Per post:** when it settles. Daily posters get it daily.
- **Weekly roll-up for everyone.** Patterns across posts show up here. Quiet posters get the
  roll-up plus a nudge to write (their gap is posting, not reviewing).
- **Triggers:**
  - an email when a post settles;
  - the dashboard next-move card;
  - inside the composer.
- No phone push.

## Story

The composer leads launch marketing. "Every post teaches the next one" is the line underneath.

## Storage (this PR)

- `AccountPost` already keeps every post a sync has seen (no pruning). It overwrites
  numbers in place.
- `PostMetricCheckpoint` keeps fixed copies at `first` / `24h` / `48h`, with the real
  `ageHours`. Syncs are nightly, so a "24h" capture lands between 24h and ~48h.
- **Brands only**, not competitors.
- Written by the nightly `sync-accounts` cron from data it already fetched: no extra
  SocialData requests.
- It's skipped quietly until migration 050 is applied.
