import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { getWorkspaceContext } from '@/lib/workspace-auth';
import { botGuard } from '@/lib/botid-guard';
import { readJsonBody } from '@/lib/api-body';
import { analyzeToneHeuristic, extractKeywordsFromText } from '@/lib/import-extraction';

// Import Hub — website analysis (consolidation step 7). The legacy route was
// unauthenticated, followed redirects blindly, and read unbounded response
// bodies. Now: workspace auth + BotID (this endpoint makes server-side
// fetches on the caller's behalf), per-hop SSRF validation on redirects, a
// response size cap, and a fetch timeout. Extraction itself stays heuristic
// (cheerio) — no LLM cost, so no generation metering.

const MAX_BODY_BYTES = 10_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

// Security: Validate URL to prevent SSRF attacks
function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^localhost$/i,
      /^.*\.local$/i,
      /^.*\.internal$/i,
      /^\[::1\]$/,
      /^\[::\]$/,
      /^\[fc00:/i,
      /^\[fd/i,
      /^\[fe80:/i,
    ];
    return !blockedPatterns.some((p) => p.test(hostname));
  } catch {
    return false;
  }
}

/**
 * Fetch with manual redirect handling so every hop is SSRF-validated — a
 * public URL 302ing to an internal address must not be followed.
 */
async function fetchPage(startUrl: string): Promise<Response | null> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isUrlSafe(current)) return null;

    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'BrandOS/1.0 (Brand Analysis Bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const [ctx, botBlock] = await Promise.all([
      getWorkspaceContext({ ensure: false }),
      botGuard(request),
    ]);
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (botBlock) return botBlock;

    const read = await readJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.response;
    const url = typeof read.body.url === 'string' ? read.body.url : '';

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!isUrlSafe(validUrl.toString())) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
    }

    let response: Response | null;
    try {
      response = await fetchPage(validUrl.toString());
    } catch {
      return NextResponse.json({ error: 'Failed to fetch website' }, { status: 400 });
    }
    if (!response || !response.ok) {
      return NextResponse.json({ error: 'Failed to fetch website' }, { status: 400 });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return NextResponse.json({ error: 'URL is not an HTML page' }, { status: 400 });
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const $ = cheerio.load(html);

    // Extract brand name from various sources
    const title = $('title').text().trim();
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const brandName = extractBrandName(ogTitle || title, validUrl.hostname);

    const metaDescription =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    const colors = extractColorsFromHTML($, html);
    const fonts = extractFonts($);

    const headings = $('h1, h2, h3')
      .map((_, el) => $(el).text().trim())
      .get()
      .slice(0, 5);
    const paragraphs = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((p) => p.length > 20 && p.length < 200)
      .slice(0, 3);

    const metaKeywords =
      $('meta[name="keywords"]')
        .attr('content')
        ?.split(',')
        .map((k) => k.trim()) || [];
    const keywords = [
      ...new Set([
        ...metaKeywords,
        ...extractKeywordsFromText([metaDescription, ...headings].join(' ')),
      ]),
    ].slice(0, 8);

    const allText = [metaDescription, ...headings, ...paragraphs].join(' ');
    const tone = analyzeToneHeuristic(allText);

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('[import/analyze-url] error:', error);
    return NextResponse.json({ error: 'Failed to analyze website' }, { status: 500 });
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
  cssVarMatches.forEach((match) => {
    const colorMatch = match.match(hexPattern);
    if (colorMatch) colors.push(colorMatch[0]);
  });

  // Dedupe and filter common colors like white/black
  const filtered = [...new Set(colors)].filter((c) => {
    const lower = c.toLowerCase();
    return !['#fff', '#ffffff', '#000', '#000000', '#f5f5f5', '#fafafa'].includes(lower);
  });

  return filtered.slice(0, 6);
}

function extractFonts($: cheerio.CheerioAPI): string[] {
  const fonts: string[] = [];

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
  const filtered = [...new Set(fonts)].filter((f) => {
    const lower = f.toLowerCase();
    return !['sans-serif', 'serif', 'monospace', 'inherit', 'system-ui', '-apple-system'].includes(
      lower
    );
  });

  return filtered.slice(0, 4);
}
