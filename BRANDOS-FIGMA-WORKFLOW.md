# BrandOS Design Workflow: Inspiration → Code

> Updated 2026-02-18. Replaces the old Figma-first workflow with a v0 + Claude Code pipeline.

---

## The Workflow (5 steps, ~10 min per component)

```
Inspiration  →  v0.dev  →  BrandOS Codebase  →  Claude Code Adapts  →  Live in BrandOS
                                                                            ↓
                                                              [Optional] Figma MCP snapshot
```

### Step 1: Find Inspiration
Grab a screenshot, mood board, Pinterest pin, Dribbble shot, rough sketch, or any visual reference.

### Step 2: v0.dev — Image + Prompt → React Code
Paste the image into [v0.dev](https://v0.dev) with a text description of what you want. v0 outputs production React + Tailwind code. Iterate with follow-up prompts until it looks right.

### Step 3: Copy into BrandOS
Paste the v0-generated component into the BrandOS codebase (`src/components/`).

### Step 4: Claude Code Adapts to Design System
Claude Code refactors the component to match BrandOS conventions:
- Swiss design tokens (spacing, typography, colors from `globals.css`)
- Motion/Framer Motion animations
- Three.js integration where needed
- Zustand state connections
- Next.js patterns (server components, dynamic imports, etc.)

### Step 5: Live in BrandOS
Component is production-ready and running.

### Optional: Push to Figma
Use `generate_figma_design` to snapshot the live component back into Figma for team review or documentation.

---

## Example: Building a Testimonial Card

Here's exactly what it looks like to go from "I like that" to "it's live in BrandOS."

### Step 1: You spot something you like

You're scrolling Dribbble and see a testimonial card with a nice glassmorphism effect, a user avatar, and a star rating. You screenshot it.

### Step 2: Paste into v0.dev

You go to [v0.dev](https://v0.dev), drop in the screenshot, and type:

> "Make a testimonial card like this. Dark background, glassmorphism card, user avatar on the left, star rating, quote text, and the person's name + handle below."

v0 generates a full React + Tailwind component in seconds. You look at the preview — the star rating is too big, so you type:

> "Make the stars smaller and add a subtle border glow on hover."

v0 regenerates. Looks good.

### Step 3: Copy into BrandOS

You copy the component code from v0 and paste it into a new file:

```
src/components/TestimonialCard.tsx
```

At this point, the component works but uses generic Tailwind classes — it doesn't match BrandOS yet.

### Step 4: Claude Code adapts it

You tell Claude Code:

> "Adapt this TestimonialCard to the BrandOS Swiss design system."

Claude Code automatically:
- Replaces hardcoded Tailwind colors with your CSS variables from `globals.css` (e.g. `bg-gray-900` → `var(--color-surface)`)
- Swaps the hover effect for a Motion `whileHover` animation to match other BrandOS components
- Connects the testimonial data to your Zustand store if needed
- Makes sure it's a proper Next.js component (correct imports, client directive if interactive)

### Step 5: It's live

You run `npm run dev`, navigate to the page, and the testimonial card is there — matching the BrandOS design system, animated, and production-ready.

### Optional: Snapshot to Figma

If you want a record of the component in your Figma file, you run `generate_figma_design` to push the live component back to Figma. Now your design file stays in sync without you ever having to manually design in Figma.

### Total time: ~10 minutes

Compare that to the old way: screenshot → Gemini mockup → Nano Banana layout → Gemini code extract → manual paste + tweak. That was 30-45 minutes with lossy handoffs at every step.

---

## Why This Workflow

| Old (5-step, lossy) | New (v0 + Claude Code) |
|---------------------|----------------------|
| Pinterest → Gemini AI → Nano Banana Pro → Gemini Code Extract → Copy/Paste | Inspiration → v0 → Claude Code → Live |
| Lossy handoff at every step | Image goes directly to code |
| Code extraction is approximate | v0 outputs real React components |
| Manual copy-paste, manual tweaks | Claude Code auto-adapts to design system |
| No single source of truth | Code is the source of truth |

---

## Tool Reference

| Tool | What it does | Accepts images? | Output |
|------|-------------|-----------------|--------|
| **v0.dev** | Generates React code from images, screenshots, or text | Yes | Production React + Tailwind code |
| **Figma MCP `generate_figma_design`** | Captures live running UI into Figma | No (needs running app) | Figma frames from live code |
| **Figma MCP `get_design_context`** | Reads design tokens from Figma frames | N/A (reads Figma) | Design context for Claude Code |
| **Figma First Draft** | Generates wireframes from text prompts | No (text only) | Editable Figma wireframes |
| **Figma Make** | Generates prototypes from text prompts | No (text only) | Clickable Figma prototypes |
| **Figma plugins (Codia, FigVision)** | Converts screenshots → Figma designs | Yes | Figma layers/components |

---

## Figma's Role (Reduced but Useful)

Figma is **not** the primary design creation tool in this workflow. Its role:

- **Design tokens** — `get_design_context` reads tokens when needed
- **Collaborative review** — share Figma frames with others
- **Capture live state** — `generate_figma_design` snapshots the live app back to Figma
- **Component inventory** — `get_metadata` for file structure audits

---

## Alternative: Figma-First Path

If you want Figma as the source of truth (slower, but useful for team collaboration):

```
Text prompt  →  Figma Make / First Draft  →  Quick Figma adjustments  →  get_design_context  →  Claude Code  →  Live
```

---

## BrandOS Figma File

- **File ID:** `Q57Xjt6icQZbHK80yskDbk`
- **Figma URL:** https://www.figma.com/design/Q57Xjt6icQZbHK80yskDbk/

---

*v0 handles inspiration → code. Claude Code handles adaptation. Figma handles documentation and review.*
