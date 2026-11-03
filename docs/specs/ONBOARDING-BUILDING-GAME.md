# Onboarding: the building game

Status: draft for approval (2026-10-08). Source: launch plan doc, section "The building game".

## The idea

After a scan, a new user's home is their **brand station**. It starts as an empty plot
with the finished station for their archetype hovering above it as a blueprint (the same
blueprint the scan revealed). Each onboarding step builds a floor. Finishing all three
completes the blueprint. This is the journey the teaser shows: Plot, Foundation,
Workstation, Billboard.

Feel to protect: cozy, earned ownership (Animal Crossing house upgrades), one clear next
step at every stage, AI suggests and the user decides.

| Stage | Unlocked by | What appears |
|---|---|---|
| 0 · Plot | Signing up after a scan | Empty plot, blueprint above it |
| 1 · Foundation | Finishing the Taste Profile (*find your taste*) | Bottom floor and storefront |
| 2 · Workstation | Saving the first Brand Kit (*shape your brand*) | Workstation floor |
| 3 · Billboard | Setting a first goal and connecting X (*stay on brand*) | Roof billboard: blueprint complete |

Everyone gets the full game free for 30 days (2026-10-06 plan change); no paywall in
onboarding.

## Decisions (2026-10-08)

- **Taste Profile = react + add your own.** React to ~15 **brand cards** (keep or skip),
  then optionally add their own links, screenshots or tweets (port of the brandos-v2
  capture screen).
- **Brand cards, not stock photos** (changed same day from Unsplash). Each card is a
  mini brand sample rendered in code: palette, typeface pairing, a sample headline, a
  layout and a tone line. Reactions map straight onto Brand Kit fields, and there are no
  licences, API keys or image hosting. The deck is weighted toward the user's archetype
  with a few wildcards. Jeffrey reviews the card designs in a preview page.
- **First goal = posting streak** ("post on brand 3x this week"). Measurable from X right
  away; later lights the windows (milestone).
- **Lives at a new `/studio` home.** The station is the home screen after signup; each
  floor opens its step. Existing dashboard tools stay reachable behind it.

## Flow

1. **Arrive.** Sign-in callback sends users without a completed station to `/studio`
   (others keep `/dashboard`). Archetype comes from their latest scan (`BrandScans`) or
   reservation (`EmailSignup.reservedArchetype`); no scan yet means "scan first" on the plot.
2. **Plot (stage 0).** Station view: plot + blueprint ghost, a short line ("Your station
   starts here."), and one button for the next step. A 3-step rail shows what's left.
3. **Foundation (stage 1).** Taste Profile:
   - React: one brand card at a time, Keep / Skip (keyboard and swipe), progress "6 of 15".
   - Add your own (optional): paste a link, upload an image, drop a tweet (v2 screen).
   - Result: a Taste Profile card: 3-word tagline, palette, type pairing, mood keywords,
     and the archetype it leans toward. Scored from the kept cards' attributes, then
     worded by Claude with the user's own inputs; user can edit any field.
   - On save: the bottom floor builds (animation), stage = 1.
4. **Workstation (stage 2).** First Brand Kit, prefilled from the Taste Profile: name,
   palette, type pairing, tone, keywords, do/don't, two voice samples. Reuses the
   existing `Brand` record and the dashboard setup wizard's steps, restyled. On save:
   the workstation floor builds, stage = 2.
5. **Billboard (stage 3).** Connect X (existing flow) + set the first goal (posting
   streak: 3 or 5 on-brand posts this week). On both: the billboard lights up, blueprint
   complete, confetti-level moment, share card "@handle built their station".
6. **After.** `/studio` stays the home: station on top, goal progress, and links into
   the dashboard tools. Milestones and dust come later (not in this spec).

## Station art per stage

- **Now (no new art):** render each stage by revealing the finished station from the
  bottom up over the blueprint ghost (thirds per stage), the same technique as the
  scan-reveal preview. Works for all 8 archetypes immediately.
- **Later:** real stage art per archetype (Foundation and Workstation, day and night:
  8 × 2 × 2 = 32 Higgsfield edits of each finished station so stages line up exactly).
  Swaps in behind the same component.

## Data

New tables, RLS on with no policies and `REVOKE ALL FROM anon, authenticated` (the app
reads and writes through Prisma, as with Station):

- `Studio`: userId (unique), archetype, stage (0-3), foundationAt, workstationAt,
  billboardAt, createdAt, updatedAt. Replaces the browser-only "has onboarded" flag.
- `TasteReaction`: userId, cardId, kept (bool), createdAt. Unique (userId, cardId).
- `TasteInput`: userId, kind (link | image | text | tweet), url, text, storagePath,
  createdAt. Uploads go to a private Supabase Storage bucket `taste-inputs`.
- `TasteProfile`: userId (unique), tagline, palette (json), keywords (json),
  leansToward, edited (bool), createdAt, updatedAt.
- `Goal`: userId, kind ('posting_streak'), target, windowStart, windowEnd, status,
  createdAt.

The brand-card deck is code, not a table (`src/lib/brand-cards.ts`: id, archetype
weights, palette, fonts, headline, layout, tone, attribute tags).

Migrations land per phase: 028 = `Studio` (step 2); taste tables with Foundation; `Goal`
with Billboard.

## Build phases (each a PR into staging)

0. **Brand cards.** The card deck and a `/world-preview/cards` review page.
1. **Studio shell.** Migration 028, `/studio` route, Studio model, stage rendering
   (bottom-up reveal), callback redirect for new users, rail + next-step button.
2. **Foundation.** React screen + add-your-own (v2 port) + Taste Profile generation and
   edit, stage 1 build animation.
3. **Workstation.** Brand Kit step prefilled from the Taste Profile, stage 2.
4. **Billboard.** Connect X + posting-streak goal, stage 3 finale + share card.
5. **Art.** Real per-archetype stage images.

## Setup Jeffrey needs to do

- Create the private `taste-inputs` bucket in staging Supabase (Claude can give exact
  steps), later prod.
- Apply each phase's migration to staging, later prod.

## Security

- All new routes use `getCurrentUser()`; a user can only read and write their own rows.
- Upload: image types only, size cap (5 MB), stored privately, served through signed URLs.
- Link inputs: fetched server-side only for metadata, with a timeout, size cap and no
  private-network hosts (SSRF guard).
- Taste Profile generation: inputs sanitised with the existing prompt-safety helpers,
  rate limited per user.

## Not in this spec

Milestones beyond stage 3, dust, the 30-Day Build cohort, deeds and ownership, the
polaroid board (parked separately), paid tiers.
