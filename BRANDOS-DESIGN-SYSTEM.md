# BrandOS Design System Rules

> Auto-generated from codebase analysis. Source of truth: `src/app/globals.css`

## 1. Token Definitions

### Colors — Core Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#E8E8ED` | Page background (silver matte) |
| `--foreground` | `#1D1D1F` | Primary text, dark elements |
| `--surface` | `#FFFFFF` | Card/panel backgrounds |
| `--surface-hover` | `#F5F5F7` | Hover state for surfaces |
| `--surface-tertiary` | `#E8E8ED` | Tertiary surfaces, input backgrounds |
| `--muted` | `#86868B` | Muted/placeholder text |

### Colors — Text Hierarchy
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#1D1D1F` | Headlines, primary content |
| `--text-secondary` | `#6E6E73` | Secondary labels |
| `--text-tertiary` | `#86868B` | Tertiary/helper text |
| `--text-quaternary` | `#AEAEB2` | Disabled/ghost text |

### Colors — Accent (Apple System Palette)
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#0A84FF` | Primary action, links, active states |
| `--accent-hover` | `#0070E0` | Accent hover |
| `--success` | `#34C759` | Success states |
| `--warning` | `#FF9F0A` | Warning states |
| `--danger` | `#FF3B30` | Error/destructive states |

### Colors — Swiss Design Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-cream` | `#F5F5F0` | Warm background variant |
| `--color-brand-black-swiss` | `#0F0F0F` | Swiss black |
| `--color-brand-gray-swiss` | `#E5E5E5` | Swiss gray |
| `--color-brand-blue-swiss` | `#2F54EB` | Swiss blue accent |
| `--color-brand-orange` | `#FA8C16` | Orange accent |

### Colors — Borders
| Token | Value |
|-------|-------|
| `--border` | `rgba(0, 0, 0, 0.08)` |
| `--border-hover` | `rgba(0, 0, 0, 0.14)` |
| `--separator` | `rgba(0, 0, 0, 0.06)` |

### Colors — Legacy/Landing
| Token | Value | Notes |
|-------|-------|-------|
| `--blue-klein` | `#002FA7` | Landing page hero |
| `--blue-electric` | `#0A84FF` | Alias of accent |
| `--blue-deep` | `#001847` | Deep blue backgrounds |
| `--brand-black` | `#050505` | Dashboard legacy |
| `--brand-blue` | `#0A84FF` | Dashboard legacy |
| `--brand-green` | `#30D158` | Dashboard legacy |
| `--brand-yellow` | `#FFD60A` | Dashboard legacy |

---

## 2. Typography

### Custom Fonts (6 families)
| Font Family | Weight(s) | Usage |
|-------------|-----------|-------|
| **Blauer Nue** | 600i, 700i, 800, 800i | Landing page logo "Brand" text |
| **PP Mondwest** | 400 | Pixel/retro accent labels, section titles |
| **VCR OSD Mono** | 400 | Mono labels, phase badges, CTAs |
| **PP NeueBit** | 700 | Pixel-style bold accents |
| **Russo One** | 400 | Gaming/bold display text |
| **Mac Minecraft** | 700i | Logo "OS" text, playful accents |

### System Font Stack
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
    "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: -0.01em;
}
```

### Headline Scale
| Class | Size | Weight | Letter-spacing |
|-------|------|--------|---------------|
| `.headline-xl` | `clamp(3rem, 8vw, 6rem)` | 700 | -0.03em |
| `.headline-lg` | `clamp(2rem, 5vw, 3.5rem)` | 600 | -0.02em |
| `.headline-md` | `clamp(1.5rem, 3vw, 2rem)` | 500 | -0.01em |

### Label Styles
| Class | Font | Size | Transform |
|-------|------|------|-----------|
| `.label-mono` | VCR OSD Mono | 10px | uppercase, 0.15em tracking |
| `.vcr-label` | VCR OSD Mono | 10px | uppercase, 0.1em tracking |
| `.phase-badge` | VCR OSD Mono | 10px | uppercase, accent color bg |

---

## 3. Spacing & Radius

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `8px` | Inputs, small cards, buttons |
| `--radius-md` | `12px` | Primary buttons, medium cards |
| `--radius-lg` | `16px` | Cards, panels, modals |
| `--radius-xl` | `20px` | Hero cards, large containers |
| `--radius-pill` | `9999px` | Pills, tags, rounded buttons |

### Standard Spacing Pattern
The app uses Tailwind CSS spacing utilities with a consistent rhythm:
- **4px** (`gap-1`, `p-1`) — tight spacing
- **8px** (`gap-2`, `p-2`) — compact elements
- **12px** (`gap-3`, `p-3`) — card padding (inner)
- **16px** (`gap-4`, `p-4`, bento grid gap) — standard spacing
- **24px** (`gap-6`, `p-6`, `px-6`) — section padding, nav padding
- **32px** (`gap-8`, `py-8`) — section spacing
- **64px** (`py-16`) — large section breaks

---

## 4. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle elevation |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | Cards |
| `--shadow-elevated` | `0 4px 12px rgba(0,0,0,0.1)` | Popovers, elevated panels |
| `--shadow-modal` | `0 16px 48px rgba(0,0,0,0.16)` | Modals, dropdowns |
| `--shadow-glow-blue` | `0 0 20px rgba(47,84,235,0.5)` | Blue glow effect |
| `--shadow-glow-orange` | `0 0 20px rgba(250,140,22,0.5)` | Orange glow effect |
| `--glow-sm` | `0 0 20px rgba(10,132,255,0.15)` | Subtle accent glow |
| `--glow-md` | `0 0 40px rgba(10,132,255,0.2)` | Medium accent glow |
| `--glow-lg` | `0 0 80px rgba(10,132,255,0.25)` | Large accent glow |

---

## 5. Spring Animations

| Name | Duration | Usage |
|------|----------|-------|
| `--spring-snappy` | 300ms | Button presses, micro-interactions |
| `--spring-default` | 550ms | Standard transitions |
| `--spring-gentle` | 650ms | Content fade-ins, smooth reveals |
| `--spring-bouncy` | 1100ms | Playful/attention-grabbing motion |

### CSS Utility Classes
```css
.spring-snappy  { transition: transform var(--spring-snappy), opacity var(--spring-snappy); }
.spring-default { transition: transform var(--spring-default), opacity var(--spring-default); }
.spring-bouncy  { transition: transform var(--spring-bouncy), opacity var(--spring-bouncy); }
.spring-gentle  { transition: transform var(--spring-gentle), opacity var(--spring-gentle); }
```

### Page Transition Animations
| Class | Animation | Duration |
|-------|-----------|----------|
| `.animate-fade-in-up` | fadeInUp (8px translate) | 400ms |
| `.animate-fade-in` | fadeIn (opacity only) | 300ms |
| `.animate-slide-in` | slideInRight (-12px) | 300ms |
| `.animate-scale-in` | scaleIn (0.97 → 1) | 250ms |

---

## 6. Button Variants

| Class | Background | Border | Radius | Font |
|-------|-----------|--------|--------|------|
| `.btn-primary` | `--accent` (#0A84FF) | none | `--radius-md` | 14px/500 |
| `.btn-glass` | `--surface` | 1px `--border` | `--radius-md` | 14px/500 |
| `.btn-pill` | (inherits) | (inherits) | `--radius-pill` | (inherits) |
| `.btn-brand` | `--accent` | none | `--radius-sm` | VCR OSD Mono 12px uppercase |
| `.btn-spring` | (inherits) | (inherits) | (inherits) | scale(0.97) on :active |

---

## 7. Card Variants

| Type | Background | Radius | Hover | Extra |
|------|-----------|--------|-------|-------|
| `.surface-card` | `--surface` | `--radius-lg` | `--surface-hover` | Standard card |
| `.glass-card` | `--surface` | `--radius-lg` | `--surface-hover` | Same as surface (legacy) |
| `.glass-card-glow` | `--surface` | `--radius-lg` | `--surface-hover` | Glow variant |
| `.glass-panel` | `rgba(255,255,255,0.4)` | — | — | Frosted blur(12px) |
| `.card-spring` | — | — | `--surface-hover` | Spring transition |

### Bento Grid System
```css
.bento-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
.bento-sm   { grid-column: span 3; }   /* 25% width */
.bento-md   { grid-column: span 4; }   /* 33% width */
.bento-lg   { grid-column: span 6; }   /* 50% width */
.bento-xl   { grid-column: span 8; }   /* 66% width */
.bento-full { grid-column: span 12; }  /* 100% width */
.bento-tall { grid-row: span 2; }      /* 2x height */
```

---

## 8. Component Architecture

### Framework
- **Next.js 16** + **React 19** (App Router)
- **TypeScript** throughout
- **Tailwind CSS v4** (`@import "tailwindcss"` syntax)
- **Zustand** for client state (3 stores, localStorage persistence)
- **Motion/Framer Motion** for animations
- **Three.js** + React Three Fiber for 3D scenes
- **React Flow** for content workflow canvas

### Styling Approach
- CSS custom properties (`:root` tokens) in `globals.css`
- Tailwind utility classes for layout
- Inline styles for dynamic values (`style={{ color: 'var(--text-primary)' }}`)
- CSS classes for reusable patterns (`.btn-primary`, `.glass-card`, etc.)
- `@theme inline` block for Tailwind v4 token integration

### Component Organization
```
src/
├── app/              # Next.js App Router pages + API routes
│   ├── page.tsx      # Landing page
│   ├── app/page.tsx  # Main dashboard (all 5 phases)
│   ├── agents/       # AI agent pages
│   ├── conductor/    # Orchestrator chat
│   └── api/          # 71+ API routes
├── components/       # React components (~147 files)
│   ├── dashboard/    # Dashboard widgets
│   ├── brandkit/     # Brand Kit canvas + sections
│   ├── workflow/     # Content workflow (React Flow)
│   ├── import/       # Brand import hub
│   ├── agents/       # Agent chat UI
│   ├── conductor/    # Conductor chat
│   ├── DNAWalkthrough/ # Sequential reveal system
│   ├── JourneyEnd/   # Post-score transitions
│   └── WrappedSections/ # Year-in-review
├── hooks/            # Custom React hooks (6 files)
└── lib/              # Utilities, stores, agents (24 files)
    └── agents/       # 5 AI agent implementations
```

### Icon System
- Inline SVGs throughout (no icon library)
- Consistent: `width/height` via Tailwind classes, `stroke="currentColor"`, `strokeWidth={1.5}`
- `viewBox="0 0 24 24"` standard

### Asset Management
- Fonts: `/fonts/` directory (TTF/OTF files)
- Background: Programmatic CSS gradients + grid pattern
- Images: `/assets/` for noise texture, `/public/` for static
- 3D: Three.js procedural geometry (no external models)

---

## 9. Key Design Patterns

### Navigation
- 5-phase horizontal nav: Home → Define → Check → Generate → Scale
- Sub-tabs appear below main nav when phase has multiple views
- Phase unlocking: progressive disclosure based on user actions

### Layout
- Max width: `1200px` centered (`max-w-[1200px] mx-auto`)
- Horizontal padding: `24px` (`px-6`)
- Content max: `672px` for forms (`max-w-2xl`), `768px` for displays (`max-w-3xl`)

### Color Philosophy
- "Silver Matte Light" — cool gray (#E8E8ED) base with white surfaces
- Apple-inspired accent blue (#0A84FF)
- Swiss design accents: Klein blue (#2F54EB) + Orange (#FA8C16)
- Faint 40px grid lines on body background
