# First-run walkthrough — spec (2026-10-29)

**Why:** a friend Bawsa respects, about to be onboarded, said: "walk me through the things I need
to do or read, it's hard to keep track of everything … use it as a template to onboard others
too … no one reads stuff on X." Today a new member gets "Welcome in" and the persona question on
Today, then nothing. The tour email is text people don't read.

**Goal:** by the end of the first visit, every member has read their own playbook and has Write
open on their next post. This walkthrough IS the onboarding template: every member goes through it.

## Decisions (Bawsa, 2026-10-29)

| | |
|---|---|
| Where | Inside the dashboard (v2) |
| Shape | Guided reveal: full screen, unveils the playbook one step at a time |
| First win | Read their playbook |
| Steps | Score (Record) → Known for → What's working → One thing to sharpen |
| Ending | Hands off to Write ("try it on your next post") |
| Who | New members, testers already in, pre-gate accounts landing on v2 |
| Language | Plain words; brand terms (Record, classification) kept but each gets a plain sentence |
| Help after | Small "i" icons on key terms only: hover on desktop, tap on phone |
| When | On staging this week, for testers |
| SafZ | Waits for the real walkthrough, no stopgap guide |

## Flow

0. **Which one are you?** The existing persona question stays first (skipped if they already
   answered on Today). The answer is saved to the account so other devices don't ask again.
1. **Your score.** The Record number rolls up in Klein (the one Motion+ headline).
   "This is your score: how clearly your posts say who you are, and how well they land. Out of 100."
2. **Known for.** Their line, revealed. "This is what your posts say you're known for. Not your bio. Your posts."
3. **What's working.** Their top kind of post with their own number. "Of everything you post,
   these land best: 3.4% of the people who see them like, reply, repost or quote. From your own posts."
   (Engagement rate = engagements / views, so never "your followers".)
4. **One thing to sharpen.** Their gap. "If you fix one thing, fix this."
5. **Hand-off.** "Try it on your next post." → **Write my next post** (opens Write) · *Later* (lands on Today).

Skip is always visible. Step dots show where they are (1 / 4).

## States

- **Thin read** (no "what's working" data): skip step 3, never show an empty step.
- **No gap:** step 4 becomes "keep doing what's working" and still hands off to Write.
- **No read yet:** run the read first (existing loading), then start at step 1.
- **Reduced motion:** steps cross-fade, the number appears without rolling.
- **Phone:** one step per screen, thumb-reach buttons, no horizontal scroll.
- **Seen once:** never shows again automatically after finish or skip.

## "i" icons (key terms, ~10)

Score/Record · classification · Known for · What's working · One thing to sharpen · Today's move ·
Write: voice / lane / landing marks · the live score in Write · Invites · Brand tab growth.
One plain sentence each, two at most. Hover on desktop, tap on phone, tap outside or Esc to close,
keyboard focusable.

## Data

"Seen" should live on the account (testers switch devices). Proposed **migration 052**:
`UserPreference.walkthroughDoneAt timestamptz null` (+ `persona text null`, moving the
device-only persona answer to the account). Not applied anywhere until Bawsa asks.
Fallback if not applied: this-device storage, same as the persona answer today.

## Delivery

Behind the existing v2 gate; first-run trigger = `walkthroughDoneAt is null`, on the member's own
brand. Testers already in see it on their next visit. Preview harness:
`/world-preview/today?walk=0..5` (`&thin=1`, `&persona=creator`, `&c=night`, `&view=playbook`).

**Status 2026-10-29:** built (PR feat/first-run-walkthrough); migration 052 applied to staging at
Bawsa's request; not on prod.
