import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the webpage
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'BrandOS/1.0 (Brand Analysis Bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch website' },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract brand name from various sources
    const title = $('title').text().trim();
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const brandName = extractBrandName(ogTitle || title, validUrl.hostname);

    // Extract meta description
    const metaDescription = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // Extract colors from inline styles and CSS
    const colors = extractColorsFromHTML($, html);

    // Extract font families
    const fonts = extractFonts($, html);

    // Extract text samples for voice analysis
    const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().slice(0, 5);
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get()
      .filter(p => p.length > 20 && p.length < 200)
      .slice(0, 3);

    // Extract keywords from meta tags
    const metaKeywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];
    const keywords = [...new Set([
      ...metaKeywords,
      ...extractKeywordsFromText([metaDescription, ...headings].join(' ')),
    ])].slice(0, 8);

    // Analyze tone from text samples
    const allText = [metaDescription, ...headings, ...paragraphs].join(' ');
    const tone = analyzeTone(allText);

    const result = {
      overallConfidence: 75,
      name: brandName,
      colors: {
        primary: colors[0] || '#1a1a2e',
        secondary: colors[1] || '#16213e',
        accent: colors[2] || '#e94560',
        additional: colors.slice(3),
      },
      tone,
      keywords,
      fonts,
      voiceSamples: [...headings, ...paragraphs].slice(0, 4),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('URL analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    );
  }
}

function extractBrandName(title: string, hostname: string): string {
  // Try to get brand from title (usually before " - " or " | ")
  const separators = [' - ', ' | ', ' · ', ' — '];
  for (const sep of separators) {
    if (title.includes(sep)) {
      return title.split(sep)[0].trim();
    }
  }
  
  // Fall back to hostname
  const domain = hostname.replace('www.', '').split('.')[0];
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function extractColorsFromHTML($: cheerio.CheerioAPI, html: string): string[] {
  const colors: string[] = [];
  const hexPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const rgbPattern = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;

  // Extract from style tags
  $('style').each((_, el) => {
    const styleText = $(el).text();
    const hexMatches = styleText.match(hexPattern) || [];
    colors.push(...hexMatches);
  });

  // Extract from inline styles
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const hexMatches = style.match(hexPattern) || [];
    colors.push(...hexMatches);
  });

  // Extract from CSS custom properties in HTML
  const cssVarMatches = html.match(/--[\w-]+:\s*(#[0-9A-Fa-f]{3,6})/g) || [];
  cssVarMatches.forEach(match => {
    const colorMatch = match.match(hexPattern);
    if (colorMatch) colors.push(colorMatch[0]);
  });

  // Dedupe and filter common colors like white/black
  const filtered = [...new Set(colors)].filter(c => {
    const lower = c.toLowerCase();
    return !['#fff', '#ffffff', '#000', '#000000', '#f5f5f5', '#fafafa'].includes(lower);
  });

  return filtered.slice(0, 6);
}

function extractFonts($: cheerio.CheerioAPI, html: string): string[] {
  const fonts: string[] = [];
  
  // Common font-family patterns
  const fontFamilyPattern = /font-family:\s*['"]?([^'";\n]+)/gi;
  
  // Extract from style tags
  $('style').each((_, el) => {
    const styleText = $(el).text();
    let match;
    while ((match = fontFamilyPattern.exec(styleText)) !== null) {
      fonts.push(match[1].split(',')[0].trim().replace(/['"]/g, ''));
    }
  });

  // Extract from Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const familyMatch = href.match(/family=([^&:]+)/);
    if (familyMatch) {
      fonts.push(familyMatch[1].replace(/\+/g, ' '));
    }
  });

  // Dedupe and filter generic fonts
  const filtered = [...new Set(fonts)].filter(f => {
    const lower = f.toLowerCase();
    return !['sans-serif', 'serif', 'monospace', 'inherit', 'system-ui', '-apple-system'].includes(lower);
  });

  return filtered.slice(0, 4);
}

function extractKeywordsFromText(text: string): string[] {
  // Simple keyword extraction - in production, use NLP
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  const stopWords = ['about', 'their', 'would', 'could', 'should', 'which', 'where', 'there', 'these', 'those', 'being'];
  const filtered = words.filter(w => !stopWords.includes(w));
  
  // Count occurrences
  const counts: Record<string, number> = {};
  filtered.forEach(w => counts[w] = (counts[w] || 0) + 1);
  
  // Sort by frequency and return top keywords
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 6);
}

function analyzeTone(text: string): { formality: number; energy: number; confidence: number; style: number } {
  const lower = text.toLowerCase();
  
  // Simple heuristic-based tone analysis
  // In production, use AI for better accuracy
  
  // Formality (casual vs formal)
  const informalIndicators = ['hey', 'cool', 'awesome', 'check out', 'btw', '!', 'gonna', 'wanna'];
  const formalIndicators = ['therefore', 'furthermore', 'regarding', 'hereby', 'pursuant'];
  const informalCount = informalIndicators.filter(i => lower.includes(i)).length;
  const formalCount = formalIndicators.filter(i => lower.includes(i)).length;
  const formality = Math.min(100, Math.max(0, 50 + (formalCount - informalCount) * 15));
  
  // Energy (reserved vs energetic)
  const exclamations = (text.match(/!/g) || []).length;
  const energy = Math.min(100, Math.max(0, 30 + exclamations * 10));
  
  // Confidence (humble vs bold)
  const boldIndicators = ['best', 'leading', '#1', 'revolutionary', 'ultimate', 'proven'];
  const humbleIndicators = ['try', 'maybe', 'might', 'could', 'possibly'];
  const boldCount = boldIndicators.filter(i => lower.includes(i)).length;
  const humbleCount = humbleIndicators.filter(i => lower.includes(i)).length;
  const confidence = Math.min(100, Math.max(0, 50 + (boldCount - humbleCount) * 15));
  
  // Style (classic vs experimental)
  const style = 50; // Default to middle, hard to detect without more context
  
  return { formality, energy, confidence, style };
}








