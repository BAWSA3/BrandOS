# Bonsai Garden — World Spec

> Pilot world for the V2 worlds workflow. Fill out each section. When complete, ping Claude with: "Bonsai Garden spec is ready."
>
> See `docs/worlds/world-spec-template.md` for the field reference and `docs/worlds/prompt-library.md` for image-gen prompts.

---

## 1. Identity

| Field            | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Working name     | Bonsai Garden                                               |
| `id` (slug)      | `bonsai-garden`                                             |
| Tier             | `free` — calm-default world, soft entry for new creators    |
| One-line tagline | `growth is quiet.`                                          |
| Description      | A quiet morning in the garden. Cool greens, dewy texture, just enough motion to remember the wind. |

---

## 2. Vibe brief

- **Vibe words (3–5)**: calm, sparse, dewy, still, contemplative
- **Materials / textures**: cool stone, moss, morning mist, weathered wood, wet leaves, rice paper, brushed pewter
- **Inspirational creators / objects / places**:
  - Ryōan-ji rock garden at dawn (sparse, monastic, perfectly placed)
  - Andy Goldsworthy's natural sculptures (organic, quiet, intentional)
  - Studio Ghibli's quiet forest moments (the calm beats, not the action)
  - Wabi-sabi pottery (imperfect, weathered, beautiful for it)
  - Kinfolk magazine layouts (lots of negative space, soft photography)
  - The pause before the kettle whistles
- **What this world is NOT**:
  - Not warm sunset or golden hour (that's a different season/world)
  - Not theme-park "Japanese" — no torii gates, no cherry blossoms (that's the next world: Japan Cherry Blossom)
  - Not busy or detailed — sparse > ornate; one element placed well > five elements competing
  - Not loud or saturated accents — the palette is restrained
  - Not playful / kitsch / cute — this is meditative, not whimsical

### Visual style constraints (locked)

Jeffrey's direction for how this world should *look* compositionally — applies to all reference images and to the actual scene component:

- **Soft-gradient texture overlays** — base texture (paper / stone / moss) with a translucent gradient color wash on top. The overlay does the *color mood* work; the texture does the *tactility* work.
- **Heavy texture emphasis** — every surface should feel like it has touch. No flat solid colors anywhere.
- **Angled framing, never flat-overhead** — 30°–60° angles. Captures both surface and depth.
- **Close-ups, never wide vistas** — tight crops on detail. Macro-photography mindset, not landscape mindset. The texture itself is the visual interest, not the scene.

In code, the scene component layers:
1. A textured base (CSS `background-image` with paper/noise PNG, or SVG noise filter)
2. A gradient overlay using palette colors at low opacity, anchored to one corner
3. (Optional) A third drift layer for the "subtle breathing motion"

---

## 3. Reference images

Drop generated images into `docs/worlds/bonsai-garden/refs/` and link them here. Strongest mood image first — Claude treats it as the palette truth source.

1.
2.
3.

---

## 4. Palette (17 hex values)

```ts
{
  background:       "#______",
  foreground:       "#______",
  surface:          "#______",
  surfaceHover:     "#______",
  surfaceTertiary:  "#______",
  border:           "#______",
  borderHover:      "#______",
  separator:        "#______",
  textPrimary:      "#______",
  textSecondary:    "#______",
  textTertiary:     "#______",
  textQuaternary:   "#______",
  accent:           "#______",
  accentHover:      "#______",
  success:          "#______",
  warning:          "#______",
  danger:           "#______",
}
```

---

## 5. Typography

| Field           | Value |
| --------------- | ----- |
| `fontSans`      |       |
| `fontMono`      |       |
| `fontDisplay`   |       |
| `baseSize`      |       |
| `letterSpacing` |       |

---

## 6. Microcopy

```ts
{
  dashboardTitle:        "______",
  tagline:               "______",
  scanCta:               "______",
  scanningLabel:         "______",
  scanCompleteToast:     "______",
  emptyConnections:      "______",
  connectCta:            "______",
  upgradeCta:            "______",
  shareableCardTitle:    "______",
  shareableCardSubtitle: "______",
  phaseLabels: {
    define:   "______",
    check:    "______",
    generate: "______",
    scale:    "______",
  },
}
```

---

## 7. Scene concept

- **Composition**:
- **Static elements**:
- **Animated elements**:
- **Color usage**:
- **Density**:
- **`staticFallback`** (CSS string for reduced-motion users):

---

## 8. Motion preset

| Field                        | Value |
| ---------------------------- | ----- |
| `fadeIn.duration` (sec)      |       |
| `fadeIn.ease`                |       |
| `slideIn.duration` (sec)     |       |
| `slideIn.ease`               |       |
| `slideIn.distance` (px)      |       |
| `hover.scale`                |       |
| `hover.duration` (sec)       |       |
| `reducedMotion`              |       |

---

## 9. Audio

- **Ambient track**: _(file path or `none`)_
  - `loop`:
  - `gain`:
  - `fadeInMs`:
- **SFX** (optional, leave blank if none):
  - `click`:
  - `hover`:
  - `scanStart`:
  - `scanDone`:

---

## 10. Module layout

```ts
{
  modules: [
    "connections",
    "scan",
    "shareable",
    "upgrade",
  ],
  layout: "stacked",
}
```

_(Adjust order, remove modules, or change layout — whatever suits the world.)_

---

## 11. OG config

| Field         | Value |
| ------------- | ----- |
| `background`  |       |
| `accent`      |       |
| `textColor`   |       |
| `mutedColor`  |       |
| `fontFamily`  |       |
| `frameGlyphs` |       |

---

## 12. Status

- [x] Stage 1: vibe brief filled
- [ ] Stage 2: reference images generated and dropped in `refs/`
- [ ] Stage 3: palette + typography extracted
- [ ] Stage 4: microcopy drafted
- [ ] Stage 5: scene + motion + audio + OG filled
- [ ] **Sent to Claude**
