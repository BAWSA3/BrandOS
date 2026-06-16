# World Spec Template

Fill this out per world. Send back to Claude when complete; Claude turns this into a `manifest.ts` + `scene.tsx` and registers the world.

Every field maps 1:1 to the `WorldManifest` type at `src/worlds/types.ts`. If a field doesn't apply (e.g. no audio), write `none`.

---

## 1. Identity

| Field           | Value | Notes                                                    |
| --------------- | ----- | -------------------------------------------------------- |
| Working name    |       | Human-readable, e.g. "Bonsai Garden"                     |
| `id` (slug)     |       | kebab-case, e.g. `bonsai-garden`                         |
| Tier            |       | `free` or `premium`                                      |
| One-line tagline|       | Shows under the world name. e.g. "tend the garden."      |
| Description     |       | 1–2 sentences. What this world feels like.               |

---

## 2. Vibe brief (freeform)

Use any phrasing that captures the feeling. Claude reads this to set scene-component direction and microcopy voice.

- **Vibe words (3–5)**:
- **Materials / textures**:
- **Inspirational creators / objects / places**:
- **What this world is NOT (anti-references)**:

---

## 3. Reference images

Drop generated images into `docs/worlds/<id>/refs/` and link them here. List the strongest 1 first — Claude will treat that one as the "palette truth" reference.

1. `refs/01-mood-primary.png` — *describe what this image captures*
2. `refs/02-mood-secondary.png`
3. `refs/03-scene-reference.png`
4. (add as many as useful)

---

## 4. Palette (17 hex values)

These map directly to CSS variables. The runtime injects these onto `<html>` so every dashboard component re-themes automatically.

Use a tool like coolors.co or paste the strongest mood image into ChatGPT and ask:
> "Extract a 17-color palette from this image as a manifest-ready object: background, foreground, surface, surfaceHover, surfaceTertiary, border, borderHover, separator, textPrimary, textSecondary, textTertiary, textQuaternary, accent, accentHover, success, warning, danger. Return as TypeScript object literal with hex values."

```ts
{
  background:        "#______",  // page bg
  foreground:        "#______",  // primary text on bg
  surface:           "#______",  // cards / sections (slightly lighter than bg)
  surfaceHover:      "#______",  // surface on hover
  surfaceTertiary:   "#______",  // sub-surfaces (modals, nested cards)
  border:            "#______",  // default border
  borderHover:       "#______",  // border on hover
  separator:         "#______",  // hairline dividers (lighter than border)
  textPrimary:       "#______",  // main text
  textSecondary:     "#______",  // secondary labels
  textTertiary:      "#______",  // captions, hints
  textQuaternary:    "#______",  // disabled / placeholder
  accent:            "#______",  // brand action color (primary buttons, links)
  accentHover:       "#______",  // accent on hover
  success:           "#______",  // status: success / "active"
  warning:           "#______",  // status: warning
  danger:            "#______",  // status: error / destructive
}
```

---

## 5. Typography

Use Google Fonts where possible (free, easy to load). If you want a custom font, drop the `.ttf` / `.otf` into `public/worlds/<id>/fonts/` and reference its name.

| Field        | Value | Examples                                                  |
| ------------ | ----- | --------------------------------------------------------- |
| `fontSans`   |       | `"Inter", system-ui, sans-serif`                          |
| `fontMono`   |       | `"JetBrains Mono", "VCR OSD Mono", monospace`             |
| `fontDisplay`|       | (optional) for big headings, e.g. `"Cormorant Garamond"`  |
| `baseSize`   |       | (optional) `15px` is default; bump for chunky worlds      |
| `letterSpacing` |    | (optional) `0.01em` for terminal feel, `-0.01em` modern   |

---

## 6. Microcopy (12+ strings)

Write each in this world's voice. The cheapest way to make a world feel inhabited.

```ts
{
  dashboardTitle:        "______",  // top of dashboard, replaces "BrandOS Dashboard"
  tagline:               "______",  // small line under title
  scanCta:               "______",  // primary action button. e.g. "Run Scan" → "Tend the garden"
  scanningLabel:         "______",  // shown while scanning
  scanCompleteToast:     "______",  // post-scan confirmation
  emptyConnections:      "______",  // shown when no X account connected
  connectCta:            "______",  // button to connect X. e.g. "Connect X Account"
  upgradeCta:            "______",  // upgrade plan link copy
  shareableCardTitle:    "______",  // shareable card link title
  shareableCardSubtitle: "______",  // shareable card link description
  phaseLabels: {
    define:   "______",            // e.g. "DEFINE" → "PLANT" / "INTENT"
    check:    "______",            // e.g. "CHECK" → "INSPECT" / "WATER"
    generate: "______",            // e.g. "GENERATE" → "GROW" / "BLOOM"
    scale:    "______",            // e.g. "SCALE" → "PRUNE" / "SPREAD"
  },
}
```

---

## 7. Scene concept (plain English)

Describe what the background scene looks like. Claude translates this into CSS / SVG / canvas / Three.js depending on complexity.

- **Composition**: where do elements sit on the screen? (e.g. "subtle bonsai silhouette top-right corner, very low opacity")
- **Static elements**: textures, gradients, fixed shapes
- **Animated elements**: what moves? how often? how subtly? (e.g. "tiny petals drift down very slowly every 8–12 seconds")
- **Color usage**: which palette colors should be visible in the scene?
- **Density**: minimal / moderate / dense?
- **`staticFallback` (CSS string)**: what the scene reduces to under `prefers-reduced-motion: reduce`. Just a CSS background string, e.g. `"#F4EFE6 radial-gradient(circle at 80% 20%, rgba(82,55,30,0.08) 0%, transparent 60%)"`.

---

## 8. Motion preset

The runtime applies these to all framer-motion transitions in the dashboard.

| Field                        | Value | Notes                              |
| ---------------------------- | ----- | ---------------------------------- |
| `fadeIn.duration` (sec)      |       | `0.32` snappy, `0.6` slow          |
| `fadeIn.ease`                |       | `easeOut`, `easeInOut`, `linear`   |
| `slideIn.duration` (sec)     |       | typically same as fadeIn           |
| `slideIn.ease`               |       | "                                  |
| `slideIn.distance` (px)      |       | `12` subtle, `24` more dramatic    |
| `hover.scale`                |       | `1.01` minimal, `1.05` springy     |
| `hover.duration` (sec)       |       | `0.18` typical                     |
| `reducedMotion`              |       | `disable` (kills all motion) or `simplify` |

---

## 9. Audio

Ambient + sfx are both optional. Keep `none` if the world is silent.

- **Ambient track**: file path (drop `.webm` into `public/worlds/<id>/audio/ambient.webm`) or `none`
  - `loop`: `true` / `false`
  - `gain`: `0.0`–`1.0` (recommend `0.15`–`0.3` for ambient)
  - `fadeInMs`: typical `1500`
- **SFX** (all optional — leave any blank):
  - `click`: file path + gain
  - `hover`: file path + gain
  - `scanStart`: file path + gain
  - `scanDone`: file path + gain

Audio is muted by default. Users opt in via the floating mute toggle. A11y: auto-disabled under `prefers-reduced-motion`.

---

## 10. Module layout

The dashboard is composed of modules. Pick which ones show in this world and the order.

```ts
{
  modules: [
    "connections",  // X account connections
    "scan",         // scan trigger + results
    "shareable",    // public card link
    "upgrade",      // plan upgrade CTA
    // optional later: "history", "watchlist"
  ],
  layout: "stacked",   // "stacked" | "grid-2" | "grid-3"
}
```

---

## 11. OG config (for shareable artifacts)

The `/api/og/opp` and `/card/[username]` routes use these to render PNG previews on Twitter/etc. Edge runtime — must be flat values, no dynamic imports. Hex colors and system fonts only.

| Field         | Value | Notes                                                 |
| ------------- | ----- | ----------------------------------------------------- |
| `background`  |       | hex or simple linear-gradient string                  |
| `accent`      |       | hex                                                   |
| `textColor`   |       | hex                                                   |
| `mutedColor`  |       | hex                                                   |
| `fontFamily`  |       | `"monospace"`, `"sans-serif"`, or `"serif"` only      |
| `frameGlyphs` |       | (optional) e.g. `{ corner: "+", divider: "─" }`       |

---

## 12. Sign-off

When this template is complete, ping Claude with:

> "Bonsai Garden spec is ready — `docs/worlds/bonsai-garden/spec.md`."

Claude builds the manifest + scene, registers the world, and links you to `/world-preview?world=<id>` for visual review. Iterate in chat until it lands.
