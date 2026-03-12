# BrandOS Homepage — Design Assets

## Elements (design-assets/elements/)

### 1. brandos-logo.svg
The main "BrandOS" header logo. Black-to-blue gradient SVG.
Native size: 4281x2335. Scalable to any size.

### 2. subheader-tagline.html
Rotating tagline that cycles through:
- "The AI-powered OS that builds your brand"
- "Your reputation, decoded"
- "What are you known for?"
- "Brand = Reputation"
- "Content in. Identity out."

Font: M42 Flight 721 | Color: rgba(0,0,0,0.7) | Typing animation with blinking cursor

### 3. input-field.html
Terminal-style username input with `>` prompt prefix.
Placeholder: "enter @username" (typewriter animated)
Font: VCR OSD Mono | Border radius: 10px | Focus glow: blue (#0047FF)

### 4. cta-button.html
"RUN ANALYSIS →" button.
Background: #0047FF (Klein blue) | Text: white | VCR OSD Mono
Blue glow shadow | Hover: scale 1.02 | Width: 420px

### 5. footer-text.html
"── WORKS WITH ANY PUBLIC X ACCOUNT ──"
Font: PP NeueBit | Size: 11px | Color: rgba(0,0,0,0.45)

---

## Background (currently active: HybridCodeBg)
White (#ffffff) base with faded terminal/code elements:

- **Top-left**: Terminal system logs (VCR OSD Mono, cycling messages)
- **Middle-left**: TypeScript interface code block (JetBrains Mono, opacity 0.3)
- **Top-right**: Type Score code block (JetBrains Mono, opacity 0.25)
- **Middle-right**: Comment block "DNA SEQUENCER" (VCR OSD Mono, opacity 0.6)
- **Bottom-left + right**: Box-drawing decorative elements (VCR OSD Mono, opacity 0.4)

All background elements animate with typewriter cycling effects.
Source: src/components/backgrounds/HybridCodeBg.tsx

---

## Fonts Used
- **VCR OSD Mono** — Terminal text, inputs, buttons
- **M42 Flight 721** — Subheader tagline
- **JetBrains Mono** — Code blocks in background
- **PP NeueBit** — Footer/label text

## Colors
- Primary accent: #0047FF (Klein blue)
- Text: #000000
- Text muted: rgba(0,0,0,0.7)
- Text faint: rgba(0,0,0,0.45)
- Background: #ffffff
- Input bg: rgba(0,0,0,0.05)
