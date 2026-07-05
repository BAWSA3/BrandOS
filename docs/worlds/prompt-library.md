# BrandOS Worlds — Image-Gen Prompt Library

Reusable prompts for taking a vague vibe → concrete spec. Use across DALL·E 3 (ChatGPT Plus), Midjourney, Adobe Firefly, or any image gen tool. Replace `[bracketed]` placeholders with world-specific content.

**Universal rules** (applies to every prompt below):
- **No text, no labels, no UI copy** — text rendered by image gen is universally bad. Add `--no text` (Midjourney) or "without any visible text or labels" (DALL·E).
- **No people, no faces** — keep the world inhabitable; faces date the design and feel weird in dashboard backgrounds.
- **No watermarks** — append "no watermarks, no signatures."
- **Aspect ratio**: 16:9 for scene refs (matches dashboard); 1:1 for mood swatches; 21:9 for ultrawide hero shots.

---

## Stage 1 — Mood board (4–5 images)

Goal: capture the *feeling* of this world. These are your palette + texture truth source. Don't worry about UI here.

### Template A — Texture-focused

> A close-up texture study of [material — e.g. weathered rice paper, cracked terracotta, brushed bronze]. [Adjective — e.g. soft, weathered, crisp] lighting. Muted [color family] palette. Rich detail. No text, no people. 1:1 aspect ratio.

### Template B — Palette-focused

> A wide landscape capturing the color palette of [vibe descriptor — e.g. "a Japanese garden in late afternoon", "a 90s computer room", "a Mediterranean coast at dusk"]. Soft natural light. Muted, warm [or cool/neutral] tones. Atmospheric. No text, no people. 16:9.

### Template C — Object/still life

> A still-life arrangement evoking [vibe — e.g. "the tools of a bonsai master", "a cyberdeck workstation", "a paper-strewn study"]. Tight composition. Soft directional light. [Texture/material descriptors]. No text, no people. 4:3.

### Template D — Atmospheric / environmental

> An empty environment that feels like [emotional descriptor — e.g. "calm focus", "playful nostalgia", "midnight intensity"]. [Setting]. [Time of day]. [Color story]. Cinematic, contemplative. No text, no people. 21:9.

---

## Stage 2 — Scene reference (2–3 images)

Goal: what does this world look like *behind a dashboard*? Closer to UI composition. Used by Claude as the visual translation reference.

### Template E — Interface composition (recommended)

> A minimalist dashboard interface backdrop in [vibe] aesthetic. Wide composition with [composition direction — e.g. "subtle visual element top-right, mostly empty negative space below" / "soft horizontal divisions" / "centered ornamental element with quiet edges"]. Palette: [primary 3 hex codes from Stage 1]. Texture: [material from mood board]. Soft, ambient, not busy. No UI labels, no text, no buttons, no icons, no people. 16:9.

### Template F — Environmental backdrop

> An ambient environment that could serve as the background for a productivity app, evoking [vibe]. Wide framing. [Specific visual element — e.g. "a bonsai silhouette at the edge", "a CRT monitor glow gradient", "rice paper texture with faint ink wash"]. Empty space dominates the composition. Calm, not distracting. No text, no people. 16:9.

---

## Stage 3 — Token extraction (in ChatGPT or any vision model)

Drop your strongest mood image into ChatGPT (Plus plan, GPT-4o or GPT-5 Vision) and run these prompts.

### Palette extraction

```
Extract a 17-color palette from this image, formatted as a TypeScript object literal matching this exact shape (every field is required):

{
  background, foreground, surface, surfaceHover, surfaceTertiary,
  border, borderHover, separator,
  textPrimary, textSecondary, textTertiary, textQuaternary,
  accent, accentHover,
  success, warning, danger,
}

Rules:
- Use hex codes only (#______).
- background = the dominant page background color from the image.
- accent = the most distinctive non-neutral color in the image. This is the brand action color.
- textPrimary should have at least 7:1 contrast against background.
- textSecondary should have at least 4.5:1.
- success / warning / danger should harmonize with the palette but stay distinct (don't pick three near-identical reds).
- borderHover and accentHover should be subtle shifts (10–15% lighter or darker than their base).
```

### Typography matching

```
Looking at this mood image, suggest font pairings for a dashboard UI in this aesthetic. I need three font stacks (CSS-string format with system fallbacks):

- fontSans: the primary UI font for body text and labels
- fontMono: a monospace for numbers, code, terminal-style elements
- fontDisplay (optional): a heading/display face for hero moments

Prefer Google Fonts (free, easy to load). For each suggestion, give one sentence on why it matches the vibe.
```

### Motion direction

```
For a dashboard themed in this aesthetic, suggest motion preset values:

- fadeIn duration (seconds, 0.2–0.8)
- slideIn distance (pixels, 8–32)
- hover scale (1.005–1.05)
- recommended easing curve

Match the energy of the image. Snappy / springy / floaty / minimal — pick one and tune values to it.
```

---

## Stage 4 — Microcopy ideation

When you've nailed the palette + scene but the microcopy feels generic, ask:

```
Rewrite these 12 microcopy strings in the voice of [world name — e.g. "a quiet bonsai garden tended by a calm, patient master"]. Keep meanings identical; change only the phrasing/voice.

Constraints:
- Each string should fit its UI slot: button labels short, tooltips medium, descriptions ≤ 1 sentence.
- Don't go full theme-park (no "Greetings, traveler!"). Subtle is better — one or two themed words per string max.
- Match the tone of the world: [adjective] but [counterbalancing adjective] — e.g. "calm but precise", "playful but professional".

Strings to rewrite:
1. dashboardTitle: "BrandOS Dashboard"
2. tagline: "system.online"
3. scanCta: "Run Scan"
4. scanningLabel: "scanning..."
5. scanCompleteToast: "scan complete. score updated."
6. emptyConnections: "Connect your X account to scan your brand."
7. connectCta: "Connect X Account"
8. upgradeCta: "Upgrade Plan"
9. shareableCardTitle: "Shareable Card"
10. shareableCardSubtitle: "your public brand profile."
11. phaseLabel.define: "DEFINE"
12. phaseLabel.check: "CHECK"
13. phaseLabel.generate: "GENERATE"
14. phaseLabel.scale: "SCALE"
```

---

## Stage 5 — Scene description handoff

You don't need to design the scene component yourself. Describe it in plain English; Claude translates to CSS / SVG / canvas. Use this prompt for yourself to articulate it cleanly:

```
Describe the dashboard background scene for this world in 6 lines:

1. Composition: [where elements sit — e.g. "subtle silhouette top-right, empty below"]
2. Static elements: [textures, gradients, fixed shapes]
3. Animated elements: [what moves, how often, how subtly]
4. Palette usage: [which 2–3 colors from the palette dominate the scene]
5. Density: minimal / moderate / dense
6. staticFallback: [a single CSS background string for prefers-reduced-motion users]
```

---

## Tool-specific notes

### ChatGPT Plus + DALL·E 3
- Best for literal scene composition. Specify positioning ("top-right", "bottom-third").
- Iterate by asking GPT to describe what it would prompt next, then run that.
- Free chat-based palette/typography/microcopy extraction.

### Midjourney Basic ($10/mo)
- Best for vibe / mood / "feeling" shots. Add `--style raw` to dial back the painterly defaults.
- Note: **Basic plan = no commercial rights.** OK for refs/mood; don't ship MJ outputs as final assets.
- Append `--ar 16:9` or `--ar 1:1` to control aspect.
- For stylistic consistency across a world's set, use `--seed N` (or a Style Reference image) so the runs feel cohesive.

### Adobe Firefly Pro ($10/mo)
- Best when you want commercial-clean outputs. Trained only on licensed content.
- Lower aesthetic ceiling than DALL·E or MJ — use for ship assets where licensing matters more than vibe.

### Bing Image Creator (free DALL·E 3)
- Free, slow, occasional weird quality drops. Worth using for low-stakes mood iterations before paying for ChatGPT Plus.

### coolors.co (free)
- Skip the "describe palette to GPT" step entirely: upload an image, get hexes directly.

---

## Anti-patterns to avoid

- **"Make it pop"** — meaningless. Specify what changes (more saturation? higher contrast? larger element?).
- **Listing 8 adjectives** — image models pick the first 2 and ignore the rest. Pick 2–3.
- **Generating UI mockups in image gen** — text always looks broken. Keep image gen for ambient/atmospheric; let Claude build actual UI components.
- **Skipping the mood board** — going straight to scene refs without a palette truth source means every iteration looks slightly off. The mood board is where you lock taste.
- **Iterating in image gen forever** — after ~10 generations per world, stop. Pick the best, extract tokens, write the spec, move on.
