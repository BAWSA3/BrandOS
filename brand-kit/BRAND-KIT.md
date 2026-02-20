# BrandOS Brand Kit

> Last updated: 2026-02-19

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Logo](#logo)
5. [Backgrounds & Textures](#backgrounds--textures)
6. [Spacing & Layout](#spacing--layout)
7. [Shadows & Effects](#shadows--effects)
8. [Animation System](#animation-system)
9. [Components](#components)
10. [Reference Images](#reference-images)
11. [Screen Captures](#screen-captures)
12. [File Index](#file-index)

---

## Brand Identity

**Product:** BrandOS — AI-powered personal brand operating system

**Design Philosophy:** Silver Matte Light — a cool gray base (`#E8E8ED`) with clean white surfaces, Apple-inspired accent blue, and Swiss design accents. The aesthetic blends Swiss grid precision with retro pixel charm.

**Navigation Structure:** 5-phase horizontal flow:
Home → Define → Check → Generate → Scale

---

## Color System

### Core Surfaces

| Token | Hex | Swatch | Usage |
|-------|-----|--------|-------|
| `--background` | `#E8E8ED` | ![#E8E8ED](https://via.placeholder.com/16/E8E8ED/E8E8ED) | Page background (Silver Matte Light) |
| `--foreground` | `#1D1D1F` | ![#1D1D1F](https://via.placeholder.com/16/1D1D1F/1D1D1F) | Primary text, dark elements |
| `--surface` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/16/FFFFFF/FFFFFF) | Card/panel backgrounds |
| `--surface-hover` | `#F5F5F7` | ![#F5F5F7](https://via.placeholder.com/16/F5F5F7/F5F5F7) | Hover states |
| `--surface-tertiary` | `#E8E8ED` | ![#E8E8ED](https://via.placeholder.com/16/E8E8ED/E8E8ED) | Input backgrounds, tertiary surfaces |

### Text Hierarchy

| Token | Hex | Swatch | Usage |
|-------|-----|--------|-------|
| `--text-primary` | `#1D1D1F` | ![#1D1D1F](https://via.placeholder.com/16/1D1D1F/1D1D1F) | Headlines, primary content |
| `--text-secondary` | `#6E6E73` | ![#6E6E73](https://via.placeholder.com/16/6E6E73/6E6E73) | Secondary labels, descriptions |
| `--text-tertiary` | `#86868B` | ![#86868B](https://via.placeholder.com/16/86868B/86868B) | Helper text, placeholders |
| `--text-quaternary` | `#AEAEB2` | ![#AEAEB2](https://via.placeholder.com/16/AEAEB2/AEAEB2) | Disabled/ghost text |

### Accent & Status Colors

| Token | Hex | Swatch | Usage |
|-------|-----|--------|-------|
| `--accent` | `#0A84FF` | ![#0A84FF](https://via.placeholder.com/16/0A84FF/0A84FF) | Primary action, links, active states |
| `--accent-hover` | `#0070E0` | ![#0070E0](https://via.placeholder.com/16/0070E0/0070E0) | Accent hover state |
| `--success` | `#34C759` | ![#34C759](https://via.placeholder.com/16/34C759/34C759) | Success states, positive indicators |
| `--warning` | `#FF9F0A` | ![#FF9F0A](https://via.placeholder.com/16/FF9F0A/FF9F0A) | Warning states, caution |
| `--danger` | `#FF3B30` | ![#FF3B30](https://via.placeholder.com/16/FF3B30/FF3B30) | Error, destructive actions |

### Swiss Design Accents

| Token | Hex | Swatch | Usage |
|-------|-----|--------|-------|
| `--color-brand-cream` | `#F5F5F0` | ![#F5F5F0](https://via.placeholder.com/16/F5F5F0/F5F5F0) | Warm background variant |
| `--color-brand-black-swiss` | `#0F0F0F` | ![#0F0F0F](https://via.placeholder.com/16/0F0F0F/0F0F0F) | Swiss black |
| `--color-brand-gray-swiss` | `#E5E5E5` | ![#E5E5E5](https://via.placeholder.com/16/E5E5E5/E5E5E5) | Swiss gray |
| `--color-brand-blue-swiss` | `#2F54EB` | ![#2F54EB](https://via.placeholder.com/16/2F54EB/2F54EB) | Swiss blue accent |
| `--color-brand-orange` | `#FA8C16` | ![#FA8C16](https://via.placeholder.com/16/FA8C16/FA8C16) | Orange accent |

### Legacy / Landing Page Colors

| Token | Hex | Swatch | Usage |
|-------|-----|--------|-------|
| `--blue-klein` | `#002FA7` | ![#002FA7](https://via.placeholder.com/16/002FA7/002FA7) | Landing page hero blue |
| `--blue-deep` | `#001847` | ![#001847](https://via.placeholder.com/16/001847/001847) | Deep blue backgrounds |
| `--brand-black` | `#050505` | ![#050505](https://via.placeholder.com/16/050505/050505) | Legacy dashboard black |
| `--brand-green` | `#30D158` | ![#30D158](https://via.placeholder.com/16/30D158/30D158) | Legacy dashboard green |
| `--brand-yellow` | `#FFD60A` | ![#FFD60A](https://via.placeholder.com/16/FFD60A/FFD60A) | Legacy dashboard yellow |

### Borders & Separators

| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `rgba(0, 0, 0, 0.08)` | Default border |
| `--border-hover` | `rgba(0, 0, 0, 0.14)` | Hover border |
| `--separator` | `rgba(0, 0, 0, 0.06)` | Subtle separators |

---

## Typography

### Font Families

| Family | File(s) | Role |
|--------|---------|------|
| **Blauer Nue** | `Blauer-Nue-Extrabold.otf`, `Blauer-Nue-Extrabold-Italic.otf`, `Blauer-Nue-Bold-Italic.otf`, `Blauer-Nue-Semibold-Italic.otf` | Logo "Brand" wordmark, hero display text |
| **PP Mondwest** | `PPMondwest-Regular.otf` | Pixel/retro accent labels, section titles, logo "OS" text |
| **PP NeueBit** | `PPNeueBit-Bold.otf` | Pixel-style bold accents |
| **VCR OSD Mono** | `VCR_OSD_MONO_1.001.ttf` | Monospace labels, phase badges, CTAs |
| **Russo One** | `RussoOne-Regular.ttf` | Gaming/bold display text |
| **Mac Minecraft** | `MacMinecraft-BoldItalic.ttf` | Logo "OS" text, playful accents |

### System Font Stack (Body Text)

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
  "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Font Usage Rules

- **Headlines / Hero:** Blauer Nue Extrabold or system stack at large sizes
- **Logo wordmark:** "Brand" in Blauer Nue + "OS" in PP Mondwest (colored `--accent`)
- **Section labels / Badges:** VCR OSD Mono or PP Mondwest
- **Body text:** System font stack (SF Pro / Inter / Segoe UI)
- **Code / Data:** VCR OSD Mono
- **Playful accents:** Mac Minecraft Bold Italic

### All Font Files

Located in `brand-kit/fonts/`:

```
Blauer-Nue-Bold-Italic.otf
Blauer-Nue-Extrabold.otf
Blauer-Nue-Extrabold-Italic.otf
Blauer-Nue-Semibold-Italic.otf
Helvetica-BoldOblique.ttf
Helvetica.ttf
MacMinecraft-BoldItalic.ttf
PPMondwest-Regular.otf
PPNeueBit-Bold.otf
RussoOne-Regular.ttf
VCR_OSD_MONO_1.001.ttf
```

---

## Logo

### Files

| File | Variant | Location |
|------|---------|----------|
| `brandos-logo.png` | Light background | `brand-kit/logos/` |
| `brandos-logo-dark.png` | Dark background | `brand-kit/logos/` |

### Logo Construction

The BrandOS logo is typographic, composed of two parts:

- **"Brand"** — Helvetica Custom (weight 400) or Blauer Nue Extrabold for display
- **"OS"** — PP Mondwest, colored `#0A84FF` (accent blue)
- Optional shimmer effect on "OS" via animated gradient

### Logo Rules

- Always keep "Brand" and "OS" as a single unit
- "OS" must always use the accent blue (`#0A84FF`)
- Minimum clear space: equal to the height of the "O" character on all sides
- The code-rendered version lives in `src/components/BrandOSLogo.tsx`

---

## Backgrounds & Textures

### Texture Library

Located in `brand-kit/backgrounds/`:

| File | Style | Best Used For |
|------|-------|---------------|
| `dark-glow.jpg` | Dark with soft glow | Dark mode hero sections |
| `electric-blue.jpg` | Vibrant electric blue | Feature highlights, CTAs |
| `metallic-silk.jpg` | Metallic silk texture | Premium/elevated surfaces |
| `soft-lavender.jpg` | Soft lavender | Calm, secondary sections |
| `warm-peach.jpg` | Warm peach tones | Friendly, approachable sections |

### Background Pattern

The app uses a faint 40px CSS grid overlay on the body background for subtle Swiss design texture.

---

## Spacing & Layout

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `8px` | Small elements, tags |
| `--radius-md` | `12px` | Buttons, inputs |
| `--radius-lg` | `16px` | Cards, panels |
| `--radius-xl` | `20px` | Large containers |
| `--radius-pill` | `9999px` | Pill buttons, badges |

### Spacing Scale

| Size | Value | Usage |
|------|-------|-------|
| Tight | `4px` | Gap between inline elements |
| Compact | `8px` | Compact card padding |
| Default | `12px` | Standard card inner padding |
| Standard | `16px` | Bento grid gap, section inner |
| Medium | `24px` | Section padding |
| Large | `32px` | Section spacing |
| XL | `64px` | Large section breaks |

### Layout Constraints

| Element | Max Width |
|---------|-----------|
| Page container | `1200px` (centered) |
| Horizontal padding | `24px` (`px-6`) |
| Form content | `672px` |
| Display content | `768px` |

### Bento Grid

12-column grid with `16px` gaps:

| Class | Span | Width |
|-------|------|-------|
| `.bento-sm` | 3 columns | 25% |
| `.bento-md` | 4 columns | 33% |
| `.bento-lg` | 6 columns | 50% |
| `.bento-xl` | 8 columns | 66% |
| `.bento-full` | 12 columns | 100% |

---

## Shadows & Effects

### Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle elevation |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | Card default |
| `--shadow-elevated` | `0 4px 12px rgba(0,0,0,0.1)` | Elevated panels, dropdowns |
| `--shadow-modal` | `0 16px 48px rgba(0,0,0,0.16)` | Modals, overlays |

### Glow Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-glow-blue` | `0 0 20px rgba(47,84,235,0.5)` | Swiss blue glow |
| `--shadow-glow-orange` | `0 0 20px rgba(250,140,22,0.5)` | Orange glow |
| `--glow-sm` | `0 0 20px rgba(10,132,255,0.15)` | Subtle accent glow |
| `--glow-md` | `0 0 40px rgba(10,132,255,0.2)` | Medium accent glow |
| `--glow-lg` | `0 0 80px rgba(10,132,255,0.25)` | Large accent glow |

---

## Animation System

### Spring Presets

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `--spring-snappy` | `300ms` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Button presses, micro-interactions |
| `--spring-default` | `550ms` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Standard transitions |
| `--spring-gentle` | `650ms` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Content fade-ins, smooth reveals |
| `--spring-bouncy` | `1100ms` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Playful, attention-grabbing |

### Page Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `.animate-fade-in-up` | Fade in + slide up 20px | 400ms |
| `.animate-fade-in` | Fade in | 300ms |
| `.animate-slide-in` | Slide in from right 30px | 300ms |
| `.animate-scale-in` | Scale from 95% + fade | 250ms |

### Motion Rules

- Use `--spring-snappy` for direct feedback (clicks, toggles)
- Use `--spring-default` for navigation transitions
- Use `--spring-gentle` for content appearing on scroll
- Use `--spring-bouncy` sparingly for celebration moments
- All animations respect `prefers-reduced-motion`

---

## Components

### Button Variants

| Class | Style | Usage |
|-------|-------|-------|
| `.btn-primary` | Solid accent blue, white text | Primary actions |
| `.btn-glass` | White/transparent with border | Secondary actions |
| `.btn-pill` | Pill-shaped (9999px radius) | Tags, filters |
| `.btn-brand` | Accent blue, smaller radius | Brand-specific CTAs |

### Card Variants

| Class | Style | Usage |
|-------|-------|-------|
| `.surface-card` | White bg, subtle shadow, 16px radius | Standard content cards |
| `.glass-card` | White bg with border, hover lift | Interactive cards |
| `.glass-card-glow` | Glass card + glow on hover | Featured/highlighted |
| `.glass-panel` | Semi-transparent with backdrop blur | Overlays, floating panels |

---

## Reference Images

Located in `brand-kit/reference-images/`:

| File | Description |
|------|-------------|
| `ascii-sky-loading.png` | ASCII art loading screen (Windows XP "Bliss" inspired) |
| `ascii-sky-loading-captured.png` | Loading screen captured variant |
| `ascii-sky-loading-screen.png` | Full loading screen |
| `ascii-sky-onboarding.png` | ASCII onboarding visual |
| `ascii-sky-onboarding-banner.png` | Onboarding banner variant |
| `ascii-sky-onboarding-fullbg.png` | Full background onboarding |
| `creation-of-adam.jpg` | Michelangelo reference artwork |
| `creation-of-adam-ascii.png` | ASCII interpretation of Creation of Adam |
| `creation-ascii-letters.jpg` | ASCII typography art |
| `ascii-dark-full.jpg` | Full dark ASCII art |

---

## Screen Captures

Located in `brand-kit/screenshots/`:

### Landing Page
| File | Description |
|------|-------------|
| `landing-page-final.png` | Final landing page design |
| `brandos-landing-light.png` | Landing page — light mode |
| `brandos-landing-dark.png` | Landing page — dark mode |
| `landing-mobile.png` | Landing page — mobile responsive |

### App Flow
| File | Description |
|------|-------------|
| `phases-final.png` | 5-phase navigation breakdown |
| `brandos-step1-name.png` | Onboarding — brand name entry |
| `brandos-step3-colors.png` | Onboarding — color selection |
| `brandos-step7-complete.png` | Onboarding — completion |
| `brandos-main-dashboard.png` | Main dashboard view |
| `main-app-full.png` | Full app with navigation |
| `brand-import-hub.png` | Brand import hub |

### Typography & Visual
| File | Description |
|------|-------------|
| `brandos-custom-fonts.png` | Custom font showcase |
| `brandos-pp-mondwest.png` | PP Mondwest font in use |
| `brandos-blue-palette.png` | Blue color palette applied |
| `desktop-blue-pulse.png` | Blue pulse animation capture |

---

## File Index

### Complete Folder Structure

```
brand-kit/
├── BRAND-KIT.md                          # This file
├── logos/
│   ├── brandos-logo.png                  # Light variant
│   └── brandos-logo-dark.png             # Dark variant
├── fonts/
│   ├── Blauer-Nue-Bold-Italic.otf
│   ├── Blauer-Nue-Extrabold.otf
│   ├── Blauer-Nue-Extrabold-Italic.otf
│   ├── Blauer-Nue-Semibold-Italic.otf
│   ├── Helvetica.ttf
│   ├── Helvetica-BoldOblique.ttf
│   ├── MacMinecraft-BoldItalic.ttf
│   ├── PPMondwest-Regular.otf
│   ├── PPNeueBit-Bold.otf
│   ├── RussoOne-Regular.ttf
│   └── VCR_OSD_MONO_1.001.ttf
├── backgrounds/
│   ├── dark-glow.jpg
│   ├── electric-blue.jpg
│   ├── metallic-silk.jpg
│   ├── soft-lavender.jpg
│   └── warm-peach.jpg
├── reference-images/
│   ├── ascii-sky-loading.png
│   ├── ascii-sky-loading-captured.png
│   ├── ascii-sky-loading-screen.png
│   ├── ascii-sky-onboarding.png
│   ├── ascii-sky-onboarding-banner.png
│   ├── ascii-sky-onboarding-fullbg.png
│   ├── creation-of-adam.jpg
│   ├── creation-of-adam-ascii.png
│   ├── creation-ascii-letters.jpg
│   └── ascii-dark-full.jpg
└── screenshots/
    ├── landing-page-final.png
    ├── brandos-landing-light.png
    ├── brandos-landing-dark.png
    ├── landing-mobile.png
    ├── phases-final.png
    ├── brandos-step1-name.png
    ├── brandos-step3-colors.png
    ├── brandos-step7-complete.png
    ├── brandos-main-dashboard.png
    ├── main-app-full.png
    ├── brand-import-hub.png
    ├── brandos-custom-fonts.png
    ├── brandos-pp-mondwest.png
    ├── brandos-blue-palette.png
    └── desktop-blue-pulse.png
```

### Source of Truth

The canonical design tokens live in `src/app/globals.css` (922 lines). This brand kit is a portable reference — when tokens change in code, update this document to match.

### Related Documentation

| Doc | Location | Content |
|-----|----------|---------|
| `BRANDOS-DESIGN-SYSTEM.md` | Project root | Full design system specification |
| `BRANDOS-FIGMA-WORKFLOW.md` | Project root | v0 + Claude Code design workflow |
| `BRANDOS-FIGMA-MAP.md` | Project root | Component ↔ Figma node mapping |
