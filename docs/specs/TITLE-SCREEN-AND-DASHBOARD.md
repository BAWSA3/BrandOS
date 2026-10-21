# Title screen + dashboard

Status: draft for approval (2026-10-09). Supersedes "/studio as the station home" in
ONBOARDING-BUILDING-GAME.md; that spec's stages, brand cards and Studio model still apply.

## The idea

BrandOS feels like a game. The pixel station is the **title screen**: the cover art and
main menu you see when you open the app, like a game's start screen. Choosing Continue
takes you into the **dashboard**, a separate, calmer workspace.

## Title screen

- **Who sees it:** signed-in users who have scanned, on every visit to mybrandos.app
  (it replaces the scan homepage for them). It is always *their* archetype's station.
- **Their progress:** the station is drawn as built so far (plot, then foundation,
  workstation, billboard), like a save file's cover. Floors come from finishing the
  onboarding steps in the dashboard.
- **Menu:** Continue (enter the dashboard), Rescan, My station (public station page and
  the friends' board), Settings (account, connected X, sound, day/night).
- **Feel:** keyboard and tap navigation, clicky menu sounds (off until the first
  interaction; can be muted), day or night from the user's local time (06:00-18:00 day),
  idle animation (bob, LEDs, scanlines at night). No music.
- **Day and night change the whole screen:** a light canvas by day, dark by night, so the
  station art sits on its own background.

## Dashboard

Dark bento grid, cohesive with BrandOS: near-black canvas, charcoal tiles, warm-grey
text, **Klein blue (#0047FF) as the only accent**. Mono (VCR OSD Mono / JetBrains Mono)
for labels and data; Inter Tight for the occasional big number.

Tiles:

| Tile | Shows |
|---|---|
| Ticker strip (top) | Followers, 7-day change, brand score, streak, average fit |
| Brand Pass | Identity card: avatar, archetype, taste tagline, pillars, station number, barcode and QR to their station, annotated callouts. Also a shareable image. |
| Brand score + trend | "72 / 100" and a small history chart; latest bar in Klein blue |
| Recent posts analyzed | Their latest X posts with a fit score each (same engine as the MCP's analyze_post) |
| Posting streak | Ring gauge: on-brand posts this week vs target |

**New users:** the dashboard starts mostly empty. The three onboarding steps fill the grid
as large "start here" tiles (Find your taste, Shape your brand, Stay on brand). Each one,
once finished, turns into its real tile (Taste Profile, then Brand Pass, then streak) and
builds a floor on the title screen.

## Flow

- First visit: scan, then reveal (blueprint card), then sign in with X, then title screen,
  then Continue into the dashboard.
- Returning: mybrandos.app opens on the title screen; Continue enters the dashboard.
- Signed-out visitors and people arriving from the MCP (`/?scan=<handle>`) still get the
  scan homepage.

## Station still appears on

Scan reveal blueprint card, public `/station/@handle` pages and their X previews, and
marketing (teaser, posts). Nowhere else inside the app.

## Build order

1. **Previews (this step):** `/world-preview/title` and `/world-preview/dashboard` with
   sample data, for design review.
2. Title screen wired to real data (Studio model, migration 028), homepage switch for
   signed-in users, sign-in redirect.
3. Dashboard wired: ticker, score history, Brand Pass, recent posts (analyze engine,
   cached), streak.
4. Onboarding steps inside the dashboard (brand cards first).
