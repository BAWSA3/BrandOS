# VERITY Launch — Design Spec

> **2026-04 revision — editorial direction.**
> This spec is a refinement of the original v3 Figma source (`yZhIkyn2DXRdHEusoMhtoL`, node `165:2`). The v3 design was too busy — four typefaces, layered glass-morphism, rotated "?" decorations, and a dense 5-row card-detail table. We're simplifying to a **clean, minimal, editorial** direction: white/cream canvas, a single sans family, generous breathing room, content-first. The original v3 reference component (`verity-launch-v3-reference.tsx`) and full asset archive are preserved as historical reference; treat THIS document as the source of truth for implementation.

**Target route:** `src/app/launch/` (`/launch`)
**Previous reference:** [`verity-launch-v3-reference.tsx`](./verity-launch-v3-reference.tsx) — do not ship; for visual history only
**Assets archive:** [`verity-launch-v3-assets/`](./verity-launch-v3-assets/) — copy only the ~6 files flagged below into `public/launch/`

## What's Changing From v3

**Dropped entirely**
- Floating glass nav bar (gradient glass-morphism is the aesthetic being toned down)
- Link preview banner with rotated "?" decorations and sibling off-screen carousel peek (busy, not digestible; social preview handled via OG metadata instead)
- 5-row metadata table inside the card-detail block
- All decorative `imgvector*.svg` / `imgframe*.svg` overlays and sparkle PNGs
- Four-family typography stack (Gerion Demo, Loos Extended, Sora, PP Neue Montreal)
- Nature-gradient feature grid (olive → teal → black) and all other gradient fills
- Text shadows, drop-glows, blur effects, rotated headline overlays ("STAY TUNED")

**Kept from v3 (simplified in place)**
- Landscape hero background + lowercase "verity" wordmark
- Pokémon card showcase (subject to licensing review, see Open Questions)
- Gacha + Minesweeper feature grid (as a two-up editorial layout)

**Reshape candidates** (flagged `[status: reshape candidate]` below — open to per-section feedback during implementation)
- Nav bar
- Card detail block

## Direction

| Principle | Translation |
|---|---|
| Clean | White/cream canvas, no gradient fills, no glass-morphism, minimum chrome |
| Minimal | One typeface, one accent color, generous whitespace, short copy |
| Editorial | Magazine-style hierarchy — large display headlines, left-aligned short paragraphs, content-first image treatment |
| Digestible | One idea per section, one CTA per page, no decorative distractions |

## Layout Overview

Responsive single column on mobile, max-width ~1120px centered on desktop. 8px base spacing scale.

```
┌───────────────────────────────────────────────┐
│ NAV (static, flat)                            │
│   verity                        [ Join waitlist ]
├───────────────────────────────────────────────┤
│                                               │
│   HERO                                        │
│     [landscape image, full-bleed]             │
│     verity                                    │
│     One-line tagline                          │
│     [ Get started ]                           │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│   CARD SHOWCASE                               │
│     [ card ] [ card ] [ card ]                │
│     Short caption / section title above       │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│   CARD DETAIL [reshape candidate]             │
│     [card image]   Title                      │
│                    [HP] [Type] [Rarity]       │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│   FEATURES                                    │
│     ┌────── Gacha ──────┐ ┌── Minesweeper ──┐ │
│     │ Icon              │ │ Icon             │ │
│     │ One sentence      │ │ One sentence     │ │
│     │ [ Start now ]     │ │ Coming soon      │ │
│     └───────────────────┘ └──────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘
```

## Design Tokens

### Colors

| Role | Value | Notes |
|---|---|---|
| Canvas | `#FAFAF7` | Warm off-white, one tone — no gradient variants |
| Ink | `#0A0A0A` | Body + display text |
| Muted | `#6B6B6B` | Captions, labels, stat chip sublabels |
| Hairline | `#E8E6DE` | 1px borders, card edges, section dividers |
| Accent | **TBD in Phase 1 scaffold** — recommended `#2F5D3A` (muted botanical green) | Single accent, used sparingly (CTAs, hover state). Intentionally distinct from BrandOS Klein blue (`#0047FF`). |

**No gradient fills. No glass backgrounds. No drop shadows on text. No blur filters.**

The only acceptable decoration is a 1px `Hairline` border and a single flat accent fill on primary CTAs.

### Typography

**One family: Inter** (loaded via `next/font/google`, scoped to the launch layout as CSS variable `--font-launch`).

| Token | Weight | Size (desktop / mobile) | Used for |
|---|---|---|---|
| Display | 700 | 72px / 44px | Hero wordmark "verity", section display headlines |
| H1 | 600 | 48px / 32px | Section titles |
| H2 | 600 | 28px / 22px | Card detail title, feature card title |
| Body | 400 | 18px / 16px | Taglines, short paragraphs |
| Label | 500 | 14px / 14px | Stat chip values, nav links |
| Caption | 400 | 13px / 13px | Stat chip labels, image captions, fine print |

Line-height: `1.1` for display/H1, `1.3` for H2, `1.5` for body.
Letter-spacing: `-0.02em` on display, `-0.01em` on H1/H2, default elsewhere.

No uppercasing, no extra-wide tracking, no gradient text fills.

### Spacing + Shape

- Base unit: `8px`. Spacing scale: `8, 16, 24, 32, 48, 64, 96, 128`.
- Section vertical rhythm: `96px` desktop, `64px` mobile.
- Max content width: `1120px` (outer padding `32px` desktop, `20px` mobile).
- Radii: `8px` (cards, stat chips), `999px` (CTA pill). Nothing bigger than 8 except the pill.
- Borders: `1px solid var(--hairline)`. Never thicker.

### Effects

- Primary CTA hover: subtle background-color transition (`160ms ease`). No scale, no glow.
- Image loading: blurred placeholder from `next/image`'s built-in `placeholder="blur"`.
- Scroll motion (optional): fade-in at 16px translateY over 400ms once per element. Default off; can be enabled per section if requested.

## Section-by-Section

### 1. NavBar `[status: reshape candidate]`

Static flat bar, not floating, not glass. Full-width, `--canvas` background, `1px` bottom `--hairline`.

- Left: "verity" wordmark, Inter 600 20px, ink
- Right: single CTA — `Join waitlist` — pill button, accent fill, white text, 14px
- Height: `72px` desktop, `56px` mobile
- No logo icon, no multi-item nav menu (Home / Explore / Card / Game all cut — landing is single-page)

### 2. Hero `[status: locked]`

- Full-bleed landscape image (`imgbackgroundgreenland1.png` from v3 archive), `min-height: 72vh`, object-fit cover
- Subtle darkening overlay: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.35))` — enough to keep white text readable; no decorative layering
- Centered content block, max-width `720px`:
  - "verity" wordmark — Inter 700 72px (44px mobile), white, `-0.02em` tracking
  - One-line tagline (copy TBD in `_content.ts`) — Inter 400 18px, white with 95% alpha
  - Single CTA: `Get started` — pill button, accent fill, white text, 48px tall

No secondary logo icon, no rounded-80px frame border, no text shadow.

### 3. Card Showcase `[status: locked]`

Three cards in a 3-up grid. Responsive: stacks to single column under 768px.

- Section title above: "See what's inside" (or similar — TBD in `_content.ts`) — Inter 600 28px, ink, left-aligned
- Card treatment: each card image (`img/launch/card1.webp` etc.) sits inside a container with `1px` `--hairline` border, `8px` radius, `16px` padding
- Caption below each: product name + short attribute (e.g. "Sylveon — Rainbow Holofoil"), Inter 400 14px, muted
- Gap between cards: `32px` desktop, `16px` mobile
- No glow, no rotation, no fanned stack, no decorative sparkles

Pokémon art is subject to licensing — see Open Questions. Default Phase 3 behavior: ship with real art behind soft-launch gating.

### 4. Card Detail `[status: reshape candidate]`

Two-column layout on desktop, stacks on mobile. Max-width `1120px`, centered, `96px` vertical padding.

- **Left column (40%)**: large card image, `1px` `--hairline` border, `8px` radius
- **Right column (60%)**:
  - H2: "Sylveon — Rainbow Holofoil" (Inter 600 28px, ink)
  - Body tagline: one sentence of context, Inter 400 18px, muted
  - Stat chips row: three chips side-by-side, each `1px --hairline` border, `8px` radius, `16px` padding
    | Value | Label |
    |---|---|
    | `330` | HP |
    | `Fairy` | Type |
    | `Gem Mint` | Rarity |
    - Value: Inter 500 24px, ink
    - Label: Inter 400 13px, muted

**Dropped from v3:** the 5-row metadata table (Artist, Release Date, Card Type, Foil Type, Condition), the `$450` price callout in Klein blue, the sparkle decoration, the low-alpha gradient card backgrounds.

### 5. Features `[status: locked]`

Two-up grid, stacks on mobile. Section title above ("What you can do" or similar — TBD).

Each feature card:
- `1px --hairline` border, `8px` radius, `32px` padding, canvas background
- Icon area at top (`56×56`, container with hairline border, rounded-8): product icon
- Title: Inter 600 28px, ink
- One-sentence description: Inter 400 16px, muted
- CTA: primary for Gacha (`Start now`, accent-filled pill), secondary for Minesweeper (`Coming soon`, muted, non-interactive)

**Gacha card** icon: simplified gacha-ball glyph (new SVG or heavily-processed crop of `imggachaball.png`; skip the full 1.3MB render)

**Minesweeper card** icon: simple isometric grid SVG (new; skip `imgsubtract.png` entirely at 1.1MB)

No gradient background, no rotated "STAY TUNED" overlay, no dark glass, no decorative card-scan textures.

## Asset Plan

Of the 37 files in `verity-launch-v3-assets/` (~13MB), copy only these into `public/launch/` after WebP conversion:

| v3 file | `public/launch/` name | Purpose | Target size |
|---|---|---|---|
| `imgbackgroundgreenland1.png` (5.5MB) | `hero-landscape.webp` | Hero background | ≤500KB |
| `imga852a10702cc7e9b82cad670c3cc0c1d2.jpg` (129KB) | `card-hero.webp` | Card showcase center + card detail | ≤120KB |
| `imga852a10702cc7e9b82cad670c3cc0c1d1.png` (139KB) | `card-a.webp` | Card showcase left | ≤120KB |
| (new crop or placeholder) | `card-b.webp` | Card showcase right | ≤120KB |

Feature grid icons are authored as fresh SVGs (no PNG imports). All vector decorations, sparkles, and card-scan textures are dropped.

**Asset budget target:** `du -sh public/launch/` < 1MB total after WebP conversion.

## Open Questions

1. **Pokémon licensing** — The card showcase uses real Pokémon art. Default plan: Phase 3 ships with real art behind soft-launch gating; commission/swap for unlicensed stand-ins before public launch. Confirm during Phase 3 review.
2. **Accent color** — Recommend `#2F5D3A` (muted botanical green) to stay distinct from BrandOS Klein blue and evoke the verity/trust/growth semantic field. Alternatives welcome. Lock during Phase 2 scaffold review.
3. **Waitlist CTA destination** — "Join waitlist" and "Get started" need targets. Options: reuse existing BrandOS signup/newsletter route, create a new email-capture endpoint, or link to an external form. Resolve in Phase 2.
4. **BetaBadge global** — BrandOS root layout injects a BetaBadge on every route. Recommend hiding on `/launch` via scoped CSS override. Confirm during Phase 2.
5. **Motion** — Default is fully static. Can enable a restrained scroll-triggered fade-in per section if requested. Call during Phase 3+.
6. **Tagline + microcopy** — All user-facing copy (hero tagline, section titles, feature descriptions, card captions) is TBD. Will live in `src/app/launch/_content.ts` so per-section revisions are a one-file edit.
7. **Dark-mode root override** — Root layout hardcodes `data-theme="dark"`. The launch layout must force `data-theme="light"` on its root wrapper for cream/ink tokens to render correctly.

## Implementation Handoff

**Route:** `src/app/launch/page.tsx` (App Router segment)

**Structure:**
```
src/app/launch/
  layout.tsx          # Inter via next/font/google + .launch-scope wrapper + data-theme=light
  page.tsx            # composes sections from _components/
  launch.module.css   # tokens + section styles, all scoped under .launch-scope
  _content.ts         # all copy as exported constants
  _components/
    NavBar.tsx
    Hero.tsx
    CardShowcase.tsx
    CardDetail.tsx
    FeatureGrid.tsx
```

**Critical scoping rules:**
1. Do not touch `src/app/globals.css` or `src/app/layout.tsx` — other routes depend on VCR OSD Mono, Klein blue, and the dark theme.
2. All typography and color tokens for `/launch` must be defined inside `launch.module.css` under a `.launch-scope` selector.
3. The `<div className="launch-scope" data-theme="light">` wrapper in `layout.tsx` must explicitly override font-family to `var(--font-launch)` and background to `var(--canvas)`.
4. Use `next/image` with explicit `width` and `height` for every raster asset.

**Verification (after scaffold):**
- Load `/launch` and `/` in two tabs — `/launch` must render cream/white + Inter + light theme; `/` must still render VCR OSD Mono + dark theme + Klein blue with no regressions.
- Grep the rendered DOM on `/launch` for any `VCR` / `JetBrains Mono` / `0047FF` references — there should be none.
- `du -sh public/launch/` < 1MB after WebP conversion.
- Lighthouse on `/launch`: Performance ≥95, Accessibility ≥95.
