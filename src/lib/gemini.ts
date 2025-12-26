import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Models
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Types for generation results
export interface GeneratedImage {
  base64: string;
  mimeType: string;
  prompt: string;
}

export interface GeneratedContent {
  text: string;
  prompt: string;
}

export interface ColorPalette {
  colors: {
    name: string;
    hex: string;
    role: string;
  }[];
  description: string;
}

// Helper to convert base64 to data URL
export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

// Brand-focused prompt templates
export const brandPrompts = {
  logo: (brandName: string, style: string, description: string) => `
Create a professional logo design for "${brandName}".
Style: ${style}
Description: ${description}

Requirements:
- Clean, scalable design suitable for a brand logo
- Modern and professional aesthetic
- Works well at various sizes
- Simple enough to be memorable
- No text in the image unless specifically requested
`,

  brandImagery: (brandName: string, style: string, description: string) => `
Create brand imagery for "${brandName}".
Style: ${style}
Description: ${description}

Requirements:
- Professional quality suitable for marketing materials
- Consistent with modern brand aesthetics
- Evocative and memorable
- Can be used across various platforms
`,

  icon: (purpose: string, style: string) => `
Create a minimalist icon for: ${purpose}
Style: ${style}

Requirements:
- Simple, clean design
- Works at 24x24px and larger
- Single color friendly
- Clear meaning at small sizes
`,

  socialGraphic: (brandName: string, platform: string, message: string) => `
Create a social media graphic for "${brandName}" for ${platform}.
Message/Theme: ${message}

Requirements:
- Platform-appropriate dimensions
- Eye-catching but professional
- On-brand aesthetic
- Clear visual hierarchy
`,

  colorPalette: (brandDescription: string, mood: string, industry: string) => `
Generate a comprehensive brand color palette for a ${industry} brand.
Brand Description: ${brandDescription}
Desired Mood: ${mood}

Provide exactly 6 colors with:
1. Primary color - main brand color
2. Secondary color - complementary to primary
3. Accent color - for CTAs and highlights
4. Background color - main background
5. Surface color - cards and elevated surfaces
6. Text color - primary text

For each color, provide:
- A descriptive name
- Hex code
- Its role in the brand system

Format as JSON:
{
  "colors": [
    {"name": "Color Name", "hex": "#XXXXXX", "role": "primary/secondary/accent/background/surface/text"}
  ],
  "description": "Brief description of the palette"
}
`,

  tagline: (brandName: string, industry: string, values: string[]) => `
Generate 5 tagline options for "${brandName}", a ${industry} brand.
Brand values: ${values.join(', ')}

Requirements:
- Memorable and concise (3-7 words each)
- Captures the brand essence
- Unique and not generic
- Easy to say and remember

Format as numbered list.
`,

  brandVoice: (brandName: string, tone: string, audience: string) => `
Generate 3 example brand voice samples for "${brandName}".
Tone: ${tone}
Target Audience: ${audience}

Create samples for:
1. A product announcement
2. A customer support response
3. A social media post

Each should be 2-3 sentences and exemplify the brand voice.
`,
};

// Utility to check if API key is configured
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// Visual Engine Prompts
export const visualEnginePrompts = {
  animation: (
    brandName: string,
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    context: string,
    description?: string
  ) => `
You are a motion design expert creating animation specifications for "${brandName}".

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

ANIMATION CONTEXT: ${context}
${description ? `ADDITIONAL NOTES: ${description}` : ''}

Based on the brand tone, generate an animation concept. Consider:
- High minimal = shorter durations, subtle movements, ease-out curves
- High playful = bouncy easings, overshoots, longer durations
- High bold = snappy, impactful, strong contrast in states
- High experimental = unconventional timing, creative keyframes

Return ONLY valid JSON:
{
  "name": "Animation name (2-4 words)",
  "description": "Brief description of the animation feel",
  "timing": {
    "duration": "e.g., 200ms, 0.3s",
    "delay": "optional delay",
    "easing": "easing name (ease-out, cubic-bezier, spring, etc.)",
    "easingCurve": "cubic-bezier values if applicable"
  },
  "keyframes": [
    { "step": "0%", "properties": { "opacity": "0", "transform": "translateY(10px)" } },
    { "step": "100%", "properties": { "opacity": "1", "transform": "translateY(0)" } }
  ],
  "cssCode": "@keyframes animationName { ... } or transition property",
  "framerMotionCode": "{ initial: {...}, animate: {...}, transition: {...} }",
  "brandAlignment": "How this animation reflects the brand tone"
}`,

  uiStyle: (
    brandName: string,
    colors: { primary: string; secondary: string; accent: string },
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    componentType: string
  ) => `
You are a UI/UX designer creating component styles for "${brandName}".

BRAND COLORS:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

COMPONENT TYPE: ${componentType}

Generate a complete style specification for this component. Consider:
- High minimal = less border-radius, subtle shadows, clean lines
- High playful = larger radius, colorful accents, friendly feel
- High bold = strong contrast, prominent shadows, impactful presence
- High experimental = unique shapes, gradients, unconventional styling

Return ONLY valid JSON:
{
  "name": "${componentType} style name",
  "description": "Brief description of the style",
  "baseStyles": {
    "borderRadius": "e.g., 4px, 12px, 9999px",
    "padding": "e.g., 12px 24px",
    "fontSize": "e.g., 14px",
    "fontWeight": "e.g., 500",
    "letterSpacing": "e.g., 0.02em (optional)"
  },
  "colors": {
    "background": "#hex",
    "text": "#hex",
    "border": "#hex (optional)",
    "shadow": "rgba(...) (optional)"
  },
  "states": {
    "hover": { "background": "#hex", "transform": "..." },
    "active": { "transform": "scale(0.98)" },
    "focus": { "boxShadow": "0 0 0 3px rgba(...)" },
    "disabled": { "opacity": "0.5", "cursor": "not-allowed" }
  },
  "cssVariables": {
    "--btn-bg": "#hex",
    "--btn-text": "#hex",
    "--btn-radius": "8px"
  },
  "tailwindClasses": "bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 ...",
  "brandAlignment": "How this style reflects the brand"
}`,

  pattern: (
    brandName: string,
    colors: { primary: string; secondary: string; accent: string },
    patternType: string,
    density?: string
  ) => `
You are a graphic designer creating background patterns for "${brandName}".

BRAND COLORS:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

PATTERN TYPE: ${patternType}
${density ? `DENSITY: ${density}` : ''}

Generate a background pattern specification. The pattern should be:
- Subtle enough to not distract from content
- On-brand with the color palette
- Scalable and tileable

Return ONLY valid JSON:
{
  "name": "Pattern name",
  "description": "Brief description of the pattern",
  "cssCode": "Full CSS for the pattern (background, background-image, etc.)",
  "svgCode": "SVG pattern code if applicable (for geometric patterns)",
  "colors": ["#hex1", "#hex2"],
  "opacity": 0.1 to 1.0,
  "scale": "e.g., 20px, 50px (pattern repeat size)",
  "brandAlignment": "How this pattern reflects the brand"
}`,

  icons: (
    brandName: string,
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    style: string,
    category: string,
    iconList: string[]
  ) => `
You are an icon designer creating a cohesive icon set for "${brandName}".

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

ICON STYLE: ${style}
CATEGORY: ${category}
ICONS NEEDED: ${iconList.join(', ')}

Generate icon specifications. Consider:
- High minimal = thin strokes, simple shapes, geometric
- High playful = rounded corners, friendly shapes, slight irregularity
- High bold = thick strokes, strong presence, filled elements
- High experimental = unique interpretations, creative metaphors

Return ONLY valid JSON:
{
  "name": "${category} icon set",
  "style": "${style}",
  "category": "${category}",
  "icons": [
    {
      "name": "icon-name",
      "purpose": "What this icon represents",
      "svgCode": "<svg viewBox='0 0 24 24' ...>...</svg>"
    }
  ],
  "strokeWidth": "e.g., 1.5px, 2px",
  "cornerRadius": "e.g., 2px for rounded corners",
  "brandAlignment": "How these icons reflect the brand"
}`,

  motionBrief: (
    brandName: string,
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    keywords: string[]
  ) => `
You are a motion design director creating a comprehensive motion design brief for "${brandName}".

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

BRAND KEYWORDS: ${keywords.join(', ')}

Create a motion design system document that translates the brand personality into animation language.

Return ONLY valid JSON:
{
  "philosophy": "One paragraph describing the brand's motion philosophy",
  "principles": [
    {
      "name": "Principle name (e.g., 'Purposeful Movement')",
      "description": "What this principle means",
      "example": "Concrete example of applying this principle"
    }
  ],
  "timingGuidelines": {
    "microInteractions": "e.g., 100-200ms for hovers, button presses",
    "transitions": "e.g., 200-400ms for page elements",
    "pageAnimations": "e.g., 400-600ms for larger movements",
    "loading": "e.g., looping animations at 1-2s cycles"
  },
  "easingPreferences": {
    "primary": "Main easing function with cubic-bezier",
    "secondary": "Alternative easing for variety",
    "avoid": ["List of easings that don't fit the brand"]
  },
  "doRules": ["Motion do's for this brand"],
  "dontRules": ["Motion don'ts for this brand"],
  "codeSnippets": [
    {
      "name": "Snippet name",
      "description": "When to use this",
      "code": "CSS or Framer Motion code"
    }
  ]
}`,
};



