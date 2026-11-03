# Spec: Station Board (polaroid wall) + Brand Reviews

_Status: approved direction (Jeffrey, 2026-10-06). Not started._
_Context: the plan is no longer date-driven. Build the full product, then give
every signup 30 days free, then offer subscriptions. These features are part of
"the full product"._

## Why

- **Polaroid board:** makes the station personal and social, like the friends'
  polaroid walls in cafes and boba shops. Friends leave silly notes. It gives
  people a reason to visit someone else's station, and that drives scans and
  signups.
- **Brand reviews:** companies that worked with a creator rate them, and good
  ratings upgrade the station's look. This makes a station a credible
  professional signal, not only a vibe.
- **Mission link:** reviews are the first data layer for **BrandOS for Brands**,
  a paid tool where companies analyze creators for campaigns and KOL programs.
  That gets its own spec later (Phase 4).

## Decisions (locked)

| # | Decision |
|---|---|
| A1 | Anyone **signed in with X** can pin a note. It appears instantly; the owner can hide any note. |
| A2 | A note is the friend's **X avatar as the polaroid**, a short note (≤140 chars), and an optional **pixel sticker**. No photo uploads in v1. |
| A3 | The board lives on the public **`/station/[handle]`** page and in the owner's studio. |
| A4 | **One note per friend per station**, which they can edit or delete. The wall shows the newest 12, with "see all". |
| A5 | Purely social in v1. It doesn't affect the station or milestones. |
| B1 | **The creator invites the brand.** Only brands holding an invite link can review. |
| B2 | Four categories, each 1–10: **communication, on-time delivery, content quality, results**. The overall score is their average, plus optional text. |
| B3 | The tier is the **average overall score across reviews**, shown only after a **minimum of 3 reviews**. |
| B4 | **Reviews only add.** A Poor average unlocks nothing; the station is never damaged. Creators can **publicly reply**. |
| B5 | Unlocks: **Good** gets a "Verified Collab" plaque, **Great** gets a rooftop billboard of brand names, **Perfect** gets gold trim, a trophy shelf and a night-mode neon "10/10". |
| B6 | Public: the **tier badge and review count**. Full reviews (brand, scores, text) are public **only if the creator chooses** to show them, per review. |
| B7 | Reviewing is **free and needs no account**. The reviews feed a later paid BrandOS for Brands. |

### Tier bands (from B3, with decimals)

| Tier | Average overall score |
|---|---|
| Perfect | 10.0 (every counted review is a 10) |
| Great | 7.0 – 9.99 |
| Good | 5.0 – 6.99 |
| Poor | below 5.0 (no unlocks) |
| _(none)_ | fewer than 3 counted reviews |

## Prerequisite: Phase 0, claim your station

Today a station is reserved by typing an email and a handle, and nobody verifies
that the handle belongs to the person. Before a station can have an owner who
moderates notes or invites brands, the person has to **prove they own the X
account**:

- **Claim:** a "Claim your station" button on `/station/[handle]` and in the
  studio. It uses **Sign in with X** (Supabase `twitter` provider, already on
  `/signup`). If the X username matches the station handle, the station is bound
  to that user.
- **Unclaimed stations:** they keep their public sign, but the board shows
  "Board opens when @handle claims this station", and reviews are disabled. This
  also closes the impersonation gap noted when `/station` pages launched.
- **Existing reservations:** they carry over. Claiming keeps the original
  station number and archetype.

## Data model (new tables, migration 026)

All tables: **RLS on, no policies.** Access goes only through server routes using
Prisma (owner role), the same as `EmailSend` and the 022–025 hardening. No new
anon grants.

```text
Station
  id, handle (unique, lowercase), ownerUserId -> User (null until claimed),
  reservationNumber, archetype, claimedAt,
  reviewCountCounted, reviewAvg (numeric), reviewTier (enum|null)  -- cached, recomputed on review write

StationNote
  id, stationId -> Station, authorUserId -> User,
  authorXHandle, authorAvatarUrl          -- snapshot at post time
  body (<=140), sticker (enum|null),
  hiddenAt, hiddenByUserId, createdAt, updatedAt
  UNIQUE(stationId, authorUserId)          -- A4: one note per friend

NoteReport
  id, noteId -> StationNote, reporterUserId, reason, createdAt
  UNIQUE(noteId, reporterUserId)

ReviewInvite
  id, stationId, tokenHash (sha256, unique), brandName, contactEmail,
  collabTitle, createdAt, expiresAt (+30d), usedAt, revokedAt

BrandReview
  id, stationId, inviteId (unique), brandName, reviewerName,
  reviewerEmail (private), reviewerDomain,
  communication, delivery, quality, results (int 1-10),
  overall (numeric, avg of the 4), body (<=1000),
  counted (bool),                          -- see "Review integrity"
  showDetailsPublicly (bool, default false),  -- B6, creator toggles per review
  creatorReply (<=500), creatorReplyAt, createdAt
```

The `Station` row is created when the reservation is claimed. Existing
`EmailSignup` reservations stay the source of truth for number and archetype.

## Phase 1: Polaroid board

### UI
- **The Wall:** on `/station/[handle]`, a corkboard section under the station
  sign.
  - Each note is a polaroid: the friend's X avatar, `@handle`, the note in the
    pixel font, and an optional sticker, tilted slightly at random (stable per
    note).
  - It shows the newest 12, with "See all N notes". The design stays in BrandOS
    tokens.
- **Pin a note:** opens "Sign in with X" if needed, then a composer: 140-char
  text, a picker of about 12 pixel stickers, and a live polaroid preview. If the
  person already has a note, the same button edits it.
- **Owner view:** each note has a "hide" control, and hidden notes stay hidden
  for everyone. The owner also sees a count of new notes since their last visit.
- **Everyone:** a "report" option on each note.

### API
| Route | Auth | Notes |
|---|---|---|
| `GET /api/stations/[handle]/notes?cursor=` | public | visible notes only; no emails or ids beyond what's displayed |
| `PUT /api/stations/[handle]/notes` | X-signed-in | upsert own note; station must be claimed; not on own station |
| `DELETE /api/stations/[handle]/notes` | X-signed-in | delete own note |
| `POST /api/stations/[handle]/notes/[id]/hide` | owner | toggle hidden |
| `POST /api/stations/[handle]/notes/[id]/report` | X-signed-in | one per user per note |

### Abuse controls
- BotID on every write. Rate limit: 10 note writes per hour per user.
- Body: trim, ≤140 chars, **links stripped** (no spam), basic profanity and
  slur filter on write.
- **Reports:** 3 or more reports auto-hide a note until the owner reviews it.
- Rendered as text only (never HTML). The avatar URL must be an `pbs.twimg.com`
  host.
- Accounts under 7 days old on X can't post (from the X profile at sign-in).

## Phase 2: Brand reviews

### Creator flow (studio, claimed owners only)
1. **Invite:** "Invite a brand to review you" asks for the brand name, the
   contact's email and a short collab title (e.g. "Q3 launch campaign").
2. **Send:** BrandOS emails the contact a unique link (`/review/<token>`) using
   `sendOnce`. The link is good for 30 days and can be revoked. The creator also
   gets a copyable link.
3. **Manage:** the creator sees each review with its scores. They choose per
   review whether the details are public (B6) and can post one public reply (B4).

### Brand flow (no account)
- **Form:** `/review/<token>` shows the creator's station (art and handle) and
  the collab title. Four 1–10 sliders, optional text, and the reviewer's name.
- **Submit:** one review per invite. After submitting, the link shows "Thanks,
  review recorded".

### Review integrity
Invites are creator-controlled (B1), so the main fraud risk is a creator
reviewing themselves. Mitigations:
- **Email proof:** the link is **emailed to the contact**, so opening it proves
  the reviewer controls that inbox.
- **Counting toward the tier:** a review has `counted = true` only when the
  contact email is on a **company domain**. Free-mail domains (gmail, outlook,
  icloud, proton, ...) and the creator's own account email or domain don't
  count.
- **Uncounted reviews:** they're still visible if the creator wants, labeled
  "unverified domain".
- **Same company:** at most one counted review per brand domain per 90 days, so
  one friend at one company can't stack reviews.
- **Rate limits:** 10 invites per day per creator. Review submit is protected by
  BotID plus the token.

### Tier
- **Recompute:** on each review write, recalculate `reviewCountCounted`,
  `reviewAvg` and `reviewTier` on `Station`, using the bands above and the
  3-review minimum.
- **Public:** the tier badge plus "N brand reviews" on `/station/[handle]` and
  its X preview image.

### API
| Route | Auth | Notes |
|---|---|---|
| `POST /api/stations/me/review-invites` | owner | creates the invite and emails the contact |
| `DELETE /api/stations/me/review-invites/[id]` | owner | revoke |
| `GET /review/[token]` | token | page |
| `POST /api/reviews` | token | validates the 4 scores are 1–10 and the text is ≤1000 chars |
| `PATCH /api/reviews/[id]` | owner | `showDetailsPublicly`, `creatorReply` |
| `GET /api/stations/[handle]/reviews` | public | tier, count, and only the reviews marked public |

## Phase 3: Tier unlock art

Overlay sprites are layered on top of the existing station art, so there's no
regeneration per tier:

| Tier | Asset | Notes |
|---|---|---|
| Good | "VERIFIED COLLAB" plaque | one sprite; an anchor point per archetype |
| Great | rooftop billboard | brand **names** drawn in code on a blank billboard sprite (no logo rights issues in v1) |
| Perfect | gold trim + trophy shelf + neon "10/10" | the neon glows through the status-LED system at night |

- **Art pipeline:** made with the approved station pipeline (Higgsfield
  `gpt_image_2_5`, cleaned to the pixel grid, day and night, shipped 2×).
  Anchor points live in a per-archetype map. 8 archetypes × 3 tiers × 2 modes
  is mostly shared sprites, with per-archetype anchors.
- **Share images:** the sign card and the `/station` X preview show the tier
  badge.

## Phase 4: BrandOS for Brands (separate spec later)
Paid company accounts to search creators, compare stations, and see review
history and scan data for campaigns and KOL programs. Reviews from Phase 2 are
its first proprietary data. Out of scope here.

## Out of scope (v1)
- Photo uploads on notes.
- Disputes beyond a public reply.
- Paid tiers for reviews.
- Notes affecting the game.
- Brand logos.

## Success metrics
- **Board:** % of claimed stations with at least 1 note in 14 days, notes per
  station, and visits to `/station` pages from shared links.
- **Reviews:** invites sent per claimed creator, invite-to-review conversion,
  % of reviews counted, and creators reaching a tier.
- **Safety:** reports per 100 notes, and auto-hidden notes.

## Build order
1. **Phase 0:** Station table, claim with X, unclaimed state on `/station`.
2. **Phase 1:** board read and write, composer, moderation, stickers (pixel
   sticker art).
3. **Phase 2:** invites, review form, integrity rules, tier calculation, badge.
4. **Phase 3:** unlock sprites and anchors.

Each phase is its own PR(s), with migrations written to `supabase-migrations/`
for Jeffrey to apply. The security guardrail and `test:rls` run on every
backend PR.

## Open questions (non-blocking defaults chosen)
1. **Perfect = every review a 10.** The alternative is an average of 9.5 or
   higher. Default: every review a 10, so it stays rare.
2. **Minimum reviews: 3.** You said "2–3". Default: 3.
3. **Free-mail reviews don't count toward the tier.** Default: they don't
   count, but they're still shown if the creator wants.
4. **Board on unclaimed stations is closed.** Default: closed until the owner
   claims it, so someone can moderate.
