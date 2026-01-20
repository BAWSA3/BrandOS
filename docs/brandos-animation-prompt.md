# Brandos Animation Prompt for Nano Banana Pro

> **Purpose**: This document provides comprehensive context for Gemini to generate landing page animations that match the Brandos product vision and aesthetic.

---

## Product Overview

**Brandos (BrandOS)** is an AI-powered brand operating system that extracts, analyzes, and maintains a creator's unique brand DNA across all content.

| Aspect | Details |
|--------|---------|
| **Concept** | "An OS for your brand's DNA" |
| **Tagline** | "Your brand, everywhere it needs to be." |
| **Core Loop** | Define → Check → Generate → Scale |
| **Target Users** | Creators, Marketers, Agencies, Founders |

---

## The Four Phases (Primary Animation Concept)

The product experience is built around **four sequential phases**. Each phase has a distinct color and purpose - these should be visually distinct in any animation.

### Phase Breakdown

| # | Phase | Color (Hex) | Icon Concept | Action |
|---|-------|-------------|--------------|--------|
| 1 | **DEFINE** | `#E8A838` (Golden Amber) | DNA helix extracting | Captures brand voice, keywords, tone |
| 2 | **CHECK** | `#00ff88` (Neon Green) | Checkmark / Scanner | Scores content 0-100 against brand rules |
| 3 | **GENERATE** | `#9d4edd` (Purple) | Sparkle / AI wand | Creates on-brand content with AI |
| 4 | **SCALE** | `#ff6b35` (Orange) | Rocket / Growth chart | Expands reach while staying consistent |

### Phase Animation Ideas

```
DEFINE: DNA strand unwinding, particles extracting upward
CHECK: Scanning beam sweeping across content, checkmarks appearing
GENERATE: Typing/writing animation, content materializing
SCALE: Upward graph motion, network nodes expanding
```

---

## Visual Identity

### Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Background (Dark) | Near Black | `#050505` |
| Background (Light) | Warm Cream | `#faf8f5` |
| Primary Accent | Electric Blue | `#0047FF` |
| Warm Accent | Amber/Sand | `#D4A574` |
| Success | Emerald | `#10B981` |
| Warning | Yellow | `#F59E0B` |
| Error | Red | `#EF4444` |

### Typography Treatment

| Element | Font | Style |
|---------|------|-------|
| "Brand" (Logo) | Helvetica Neue / Inter | Bold Italic, tight tracking (-0.06em) |
| "OS" (Logo) | Press Start 2P / PP Mondwest | Pixelated bitmap font |
| UI Labels | VCR OSD Mono | Monospace, uppercase, letter-spacing 0.1em |
| Body Text | Helvetica Neue | Light weight, clean |

### Signature Effects

1. **Film Grain Overlay**: Subtle noise texture (3-5% opacity)
2. **CRT Scanlines**: Horizontal lines reminiscent of old monitors
3. **Glassmorphism**: Frosted glass cards with backdrop blur
4. **Radial Glow Orbs**: Soft colored gradients floating in background
5. **Vignette**: Subtle darkening at edges

---

## Key Animation Moments

### 1. Hero Logo Reveal

**Current State**: Letter-by-letter animation with blur fade-in

**Enhance With**:
- "Brand" slides in from left with italic momentum
- "OS" pixelates in from scattered blocks assembling
- Subtle glow pulse after assembly
- Background DNA strand fades in behind

**Timing**: ~1.5-2s total duration

---

### 2. DNA Double Helix (Signature Visual)

**Concept**: A rotating 3D DNA strand that represents the brand's genetic code

**Animation Properties**:
- Continuous slow rotation (8-10 seconds per revolution)
- Colored rungs that light up sequentially during analysis
- Particle effects floating around the strand
- Depth-of-field blur for premium feel

**Phase Colors on Rungs**:
```
Top rungs: #E8A838 (Define)
Upper-mid rungs: #00ff88 (Check)
Lower-mid rungs: #9d4edd (Generate)
Bottom rungs: #ff6b35 (Scale)
```

---

### 3. Input Experience

**Elements to Animate**:
- Input field: Subtle border glow on focus (blue → amber)
- Placeholder text: Gentle cursor blink
- Submit button: Magnetic hover effect (follows cursor slightly)
- After submit: Input shrinks/fades as DNA journey begins

---

### 4. Phase Progression Journey

**Flow**: User enters username → 4 phases animate sequentially

**Per Phase Animation**:
1. Phase badge pulses and scales up
2. Progress ring fills clockwise (0 to 100%)
3. Analysis items check off one by one
4. Typewriter text reveals descriptions
5. Profile data values fade in with highlight

**Transition Between Phases**:
- Current phase slides out to left
- New phase slides in from right
- DNA strand rotates to next section

---

### 5. Score Reveal

**The Moment**: After all phases complete, the final brand score appears

**Animation Sequence**:
1. Screen darkens slightly (focus effect)
2. Circular gauge appears at center
3. Score number counts up rapidly (0 → final score)
4. Gauge fills with color matching score tier
5. Glow effect intensifies
6. If score ≥ 70: Confetti burst

**Score Tiers**:
| Range | Color | Label | Effect |
|-------|-------|-------|--------|
| 80-100 | `#10B981` (Green) | EXCELLENT | Confetti + strong glow |
| 60-79 | `#D4A574` (Amber) | GOOD | Moderate glow |
| 40-59 | `#F59E0B` (Yellow) | NEEDS WORK | Subtle glow |
| 0-39 | `#EF4444` (Red) | CRITICAL | Warning pulse |

---

### 6. Background Ambient Motion

**Floating Orbs**:
- 3-4 soft gradient orbs at different depths
- Slow drift motion (parallax on scroll)
- Colors: Blue, Amber, Purple (matching phase colors)
- Blur: 40-60px for dreamy effect

**Particle System** (optional):
- Tiny dots floating upward
- Very low opacity (10-20%)
- Random horizontal drift

---

## Motion Principles

### Spring Physics (Primary)
```
damping: 15
stiffness: 150
mass: 1
```

### Timing Guidelines

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Micro-interactions | 150-300ms | ease-out |
| Element reveals | 400-600ms | spring |
| Page transitions | 500-800ms | ease-in-out |
| Background ambient | 3-10s | linear (looping) |
| Score counting | 1.5-2s | ease-out |

### Stagger Delays

For sequential reveals:
```
First item: 0ms
Second item: 50-100ms
Third item: 100-200ms
(continue pattern)
```

---

## Animation Mood Board

### The Feel

| Mood | How to Achieve |
|------|----------------|
| **Premium** | Slow, deliberate motion; generous white space; subtle effects |
| **Technical** | Monospace fonts; grid alignments; data visualization |
| **Modern** | Glass effects; spring physics; smooth gradients |
| **Confident** | Bold color accents; strong typography; decisive animations |
| **Playful** | Bouncy springs; confetti; magnetic interactions |

### Reference Keywords
- Apple keynote transitions
- Terminal/CLI aesthetics  
- Biotech/DNA visualization
- Luxury brand minimalism
- Retro-futurism (CRT + modern)

---

## Specific Animation Requests

### Priority 1: Hero Section
Create an animated hero that reveals:
1. "Brand" text with italic momentum
2. "OS" assembling from pixels
3. Tagline fading in below
4. DNA strand rotating subtly in background
5. CTA button with subtle pulse

### Priority 2: DNA Analysis Loop
Create a looping animation showing:
1. DNA strand rotating
2. Rungs lighting up in phase colors
3. Particles extracting from the strand
4. Data points appearing around it

### Priority 3: Score Reveal
Create a dramatic reveal:
1. Circular gauge appearing
2. Score counting up with spring bounce
3. Color fill matching score tier
4. Glow/particle celebration for high scores

---

## Technical Integration Notes

- **Format**: Prefer Lottie JSON or optimized MP4/WebM
- **Frame Rate**: 60fps for smooth motion
- **Resolution**: Design at 1920x1080, export at 2x for retina
- **Loop Points**: Ensure seamless loops for ambient animations
- **File Size**: Keep under 500KB for Lottie, under 2MB for video

---

## Example Animation Script (Hero)

```
[0.0s] Scene starts: Dark background (#050505)
[0.1s] Faint glow begins center screen
[0.3s] "Brand" text slides in from left, italic lean
[0.5s] "Brand" settles into position
[0.6s] "OS" pixels scatter from random positions
[0.9s] "OS" pixels assemble into text
[1.1s] Blue glow pulse behind complete logo
[1.3s] Tagline fades in below
[1.5s] CTA button appears with subtle bounce
[1.7s] DNA strand fades in behind (z-index: -1)
[2.0s] Scene holds, DNA continues slow rotation (loop)
```

---

## Current Landing Page Reference

Based on the existing `landing.png`, the current design features:

### Visual Layout
```
┌──────────────────────────────────────────────────────────┐
│ [corner bracket]                         [theme toggle]  │
│                                                          │
│                     ┌─ Blue glow ─┐                      │
│                     │             │                      │
│                     └─────────────┘                      │
│                                                          │
│          BRAND DRIFT KILLS COMPANIES SLOWLY.             │
│                                                          │
│                   Brand[OS]                              │
│                     (blue)                               │
│                                                          │
│    Your brand is a promise — customers notice            │
│              when you break it.                          │
│                                                          │
│              One system. Zero Drift.                     │
│                                                          │
│                SEE HOW IT WORKS                          │
│                      ↓                                   │
│                                                          │
│ BRAND                                         AI TUNED   │
│ CONSISTENCY                                   (vertical) │
│ (vertical)                                               │
│                                                          │
│ [Compiling...]                                           │
└──────────────────────────────────────────────────────────┘
```

### Key Elements to Preserve
1. **Grid Pattern**: Subtle grid overlay creating depth
2. **Blue Glow Gradient**: Soft radial glow at top center
3. **Logo Split**: "Brand" (white) + "OS" (blue #0047FF)
4. **Vertical Labels**: "BRAND CONSISTENCY" (left) / "AI TUNED" (right)
5. **Compiling Indicator**: Bottom-left status with amber dot
6. **Corner Brackets**: Minimal decorative elements

### Animation Enhancement Opportunities

1. **Grid Pulse**: Subtle wave ripple through grid lines
2. **Blue Glow Breathing**: Slow expansion/contraction of top glow
3. **Logo Assembly**: "Brand" types in, "OS" pixelates together
4. **Vertical Text**: Fade in from edges with parallax on scroll
5. **Compiling Animation**: Dots cycling or progress indicator
6. **Down Arrow**: Gentle bounce to encourage scroll

---

## Copy Reference

| Location | Text |
|----------|------|
| Pre-headline | "BRAND DRIFT KILLS COMPANIES SLOWLY." |
| Main tagline | "Your brand is a promise — customers notice when you break it." |
| Value prop | "One system. Zero Drift." |
| CTA | "SEE HOW IT WORKS" |

---

*This document should give Gemini full context to generate animations that feel native to the Brandos product experience.*
