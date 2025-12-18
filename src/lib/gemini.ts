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

