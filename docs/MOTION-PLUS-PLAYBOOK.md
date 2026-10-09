# Motion+ playbook

How BrandOS uses Motion+ to make UI feel alive. Practice (2026-10-09): every UI
or UX change asks "which Motion+ piece would make this feel better?" and either
uses one or says why not.

Installed: `motion` 12.x and `motion-plus` (alias of `@motionplus/core` 2.12).
Imports:

```ts
import { AnimateNumber, AnimateText, Carousel, Cursor, ScrambleText, Ticker, Typewriter,
  useMagneticPull, usePointerPosition } from 'motion-plus/react';
import { curtains, pixels } from 'motion-plus/curtains';
// also: 'motion-plus/animate-view' (AnimateView), 'motion-plus/animate-activity'
```

Working reference: `src/app/world-preview/scan-reveal/ScanReveal.tsx` (AnimateNumber,
AnimateText, ScrambleText, curtains + pixels).

## The catalogue, mapped to BrandOS

| Motion+ piece | What it does | Use it for |
|---|---|---|
| `AnimateNumber` | Rolls digits like an odometer when a value changes | Brand score, fit scores, ticker stats, streak counts. Start at 0 and set the real value after mount, or it never animates. |
| `ScrambleText` | Characters scramble, then resolve | VCR mono micro-labels, card codes, the scan's "decoding" moments. Our terminal voice. |
| `Typewriter` | Types text out | Taste tagline on the Brand Pass, empty-state prompts, "analyzing…" states |
| `AnimateText` | Splits text by char/word/line for staggered entrances | Big headlines and tile titles arriving |
| `Ticker` | Infinite marquee; pauses or slows on hover | The dashboard's top stat strip, logo or creator rows |
| `Carousel` | Swipe/drag carousel with snapping | The brand-card deck (Taste Profile), recent posts on mobile |
| `Cursor` + `useMagneticPull` | Custom cursor that follows, morphs and snaps to targets | Desktop only: tiles and buttons pull the cursor; the cursor shows "OPEN ↗" over a tile |
| `curtains` + `pixels()` | Pixelated wipe between states | Big moments: title screen to dashboard, scan to reveal, a floor being built |
| `AnimateView` | View transitions between routes/states | Expanding a tile into its detail view |

## BrandOS rules

1. **Restraint.** One headline motion per screen. Numbers roll, labels scramble, and
   everything else stays still. If two things compete, cut one.
2. **Klein blue is the signal.** Motion draws the eye; point it at the number or tile
   that matters (the same places Klein blue is used).
3. **Game feel, not app feel.** Prefer stepped/eased motion that suits pixel art
   (`steps()`, short springs with `bounce: 0`) over floaty easing.
4. **Reduced motion.** Respect `prefers-reduced-motion`: show final values, no
   scrambles, no wipes. Never hide information behind an animation.
5. **Performance.** Animate transforms and opacity. Keep `Cursor` and `Ticker` off on
   touch devices or low-power contexts when they add nothing. Lazy-load heavy pieces.
6. **Accessibility.** Animated text keeps its real text for screen readers; marquees
   need a pause (hover or focus) and must not carry the only copy of the information.
7. **Server/client.** Motion+ components are client components (`'use client'`); never
   call their helpers from server code.

## Review checklist (for any UI PR)

- Which Motion+ piece did this screen use, and why (or why none)?
- Does the motion point at the signal (Klein blue) and nothing else?
- Checked with reduced motion on?
- Checked on a phone (touch: no cursor effects, smaller distances)?
