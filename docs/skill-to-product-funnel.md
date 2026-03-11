# BrandOS: Skill → Product Conversion Funnel

## Current State

### Skill (free, runs in Claude Code)
- Stateless scan → score + archetype + gaps
- Ends with CTA: `mybrandos.app/@username`

### Product (web app at mybrandos.app)
- Full dashboard, growth plans, content engine, voice fingerprinting, leaderboard, team collab, cross-platform publishing
- Auth via X OAuth → Supabase → Prisma DB

---

## The Conversion Gap

Right now the funnel has a **hard break** between skill and product:

1. User runs `/brandos @handle` in Claude Code
2. Gets a fire terminal report
3. Sees `mybrandos.app/@bawsaxbt` at the bottom
4. ...and then what? That link has to actually land somewhere meaningful

### The problems:

- **No profile page exists at `/@username`** — the CTA points to a route that doesn't have a public-facing profile/score page for that handle
- **No data carries over** — the skill scores are computed in Claude's context and thrown away. Nothing persists to the product DB
- **No account creation hook** — user has to independently find the sign-in button and connect X
- **The value gap is too wide** — skill gives them the dopamine hit (score), product asks them to rebuild from scratch (onboarding wizard, brand DNA setup)

---

## The Fix: 3-Layer Funnel

### Layer 1: Skill → Shareable Score Page

When someone runs `/brandos`, the skill should **also** write the score data somewhere the product can read. Two options:

- **Option A**: Skill generates a unique URL with encoded score data (e.g., `mybrandos.app/scan?u=bawsaxbt&s=65&a=professor&d=65&c=62&g=55&sc=55`) — product decodes and renders a public score card
- **Option B**: Skill hits an API endpoint (`/api/scan/submit`) that persists the scan to `user-profiles.json` or the DB, returns a shareable link

Option A is simpler and works without auth. The score page becomes the bridge.

### Layer 2: Score Page → Account Creation

The public score page at `mybrandos.app/scan/@bawsaxbt` should:

1. Render the same terminal report (but prettier, in the web UI)
2. Show what's **locked** — "your growth plan is ready" (blurred), "your content engine config" (blurred), archetype evolution chart (blurred)
3. One-click "sign in with X" that **pre-loads their scan data** into their account on first login

The key: **zero friction between seeing the score and creating an account**. They already authenticated with X in their head when they gave you the handle.

### Layer 3: First Session → Activation

Once they sign in, don't dump them in the full dashboard. Instead:

1. Show their score card (already computed)
2. Auto-populate brand DNA from their X profile (bio → keywords, recent posts → voice samples)
3. Surface their #1 gap as the first action: "your biggest gap is GENERATE (55). want a growth plan to fix it?" → one click → growth plan generates
4. That growth plan outputs their first content engine config → "want to generate tomorrow's post?" → one click → content engine fires

**The activation sequence: scan → sign in → gap → plan → first post. Five clicks from skill to retained user.**

---

## What to Build

| Priority | What | Why |
|----------|------|-----|
| **P0** | Public score page route (`/scan/[username]`) | Gives the skill CTA somewhere real to land |
| **P0** | Score data passthrough (URL params or API) | Connects skill output to product input |
| **P1** | Auto-populate brand DNA from X profile on first login | Kills the cold-start onboarding problem |
| **P1** | Gated preview (blurred growth plan / content engine) | Creates desire before requiring auth |
| **P2** | Skill → API persistence (`/api/scan/submit`) | Enables score history even before account creation |
| **P2** | Shareable score cards (OG image generation) | Users share their score on X → organic acquisition loop |

---

## The Viral Loop

```
user runs /brandos → gets score → shares score card on X
                                         ↓
                              friend sees score card
                                         ↓
                              clicks mybrandos.app link
                                         ↓
                              sees public score page
                                         ↓
                              "scan my brand" → signs up
                                         ↓
                              runs /brandos themselves → shares...
```

The skill isn't just a free tier — it's the **acquisition engine**. The product is the retention engine. The shareable score page is the bridge between them.

---

## Feature Breakdown: Skill vs Product

### What the Skill Does (Free Tier)
- Quick brand score scan (0-100)
- Archetype assignment (1 of 8)
- 4-dimensional breakdown (DEFINE, CHECK, GENERATE, SCALE)
- Top 3 strengths + gaps
- Quick fixes
- CTA to dashboard

### What ONLY the Product Has (Paid Features)
- Brand DNA persistence — save brand profiles to database
- Score history tracking — monitor score evolution over time
- Full dashboard — comprehensive brand management UI
- Growth plans — data-driven growth strategies
- Content engine — daily content generation system
- Multi-brand management
- Team collaboration — share brands with team members
- Cross-platform publishing — sync to Typefully/LinkedIn/etc
- Visual DNA editor — design system builder
- Voice fingerprinting — advanced voice analysis
- Content calendar — schedule posts
- Brand health snapshots — recurring health checks
- Viral benchmarks — competitive analysis
- Performance snapshots — detailed engagement metrics
- Drift alerts — brand consistency monitoring
- Approval workflows — content review system
- Onchain attestations — blockchain brand verification
- Leaderboard — creator rankings
- Advanced analytics — detailed reports
