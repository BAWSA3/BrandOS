// ===== SERPER WEB SEARCH DATA SOURCE =====

import {
  SerperResult,
  TCGVertical,
  VERTICAL_CONFIGS,
  SourceStatus,
} from '../research.types';

interface SerperSearchResponse {
  organic?: {
    title: string;
    link: string;
    snippet: string;
    date?: string;
    source?: string;
  }[];
  news?: {
    title: string;
    link: string;
    snippet: string;
    date?: string;
    source?: string;
  }[];
  error?: string;
}

const SERPER_API_BASE = 'https://google.serper.dev';

/**
 * Get Serper API key from environment
 */
function getApiKey(): string | null {
  return process.env.SERPER_API_KEY || null;
}

/**
 * Check if Serper API is available
 */
export async function getSerperStatus(): Promise<SourceStatus> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      source: 'serper',
      enabled: false,
      apiStatus: 'down',
      lastChecked: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(`${SERPER_API_BASE}/search`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'test',
        num: 1,
      }),
    });

    if (response.ok) {
      return {
        source: 'serper',
        enabled: true,
        apiStatus: 'healthy',
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        source: 'serper',
        enabled: true,
        apiStatus: 'degraded',
        lastChecked: new Date().toISOString(),
      };
    }
  } catch {
    return {
      source: 'serper',
      enabled: true,
      apiStatus: 'down',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Search Google via Serper API
 */
async function searchGoogle(
  query: string,
  numResults: number = 10,
  searchType: 'search' | 'news' = 'search'
): Promise<SerperResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Serper API: No API key configured');
    return [];
  }

  try {
    const endpoint = searchType === 'news' ? '/news' : '/search';

    const response = await fetch(`${SERPER_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: Math.min(numResults, 100),
      }),
    });

    if (!response.ok) {
      console.error(`Serper API error: ${response.status}`);
      return [];
    }

    const data: SerperSearchResponse = await response.json();

    const results = searchType === 'news' ? data.news : data.organic;

    if (!results) {
      return [];
    }

    return results.map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      date: item.date,
      source: item.source,
    }));
  } catch (error) {
    console.error('Serper search error:', error);
    return [];
  }
}

/**
 * Fetch news articles for specific TCG verticals
 */
export async function fetchSerperForVerticals(
  verticals: TCGVertical[],
  resultsPerVertical: number = 10,
  searchType: 'search' | 'news' = 'news'
): Promise<{ vertical: TCGVertical; results: SerperResult[] }[]> {
  const output: { vertical: TCGVertical; results: SerperResult[] }[] = [];

  for (const vertical of verticals) {
    const config = VERTICAL_CONFIGS[vertical];
    if (!config) continue;

    // Build search query
    const query = `${config.name} news ${config.keywords.slice(0, 2).join(' ')}`;

    const results = await searchGoogle(query, resultsPerVertical, searchType);
    output.push({ vertical, results });

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return output;
}

/**
 * Search for specific TCG news topics
 */
export async function searchTCGNews(
  vertical: TCGVertical,
  topic: string,
  numResults: number = 10
): Promise<SerperResult[]> {
  const config = VERTICAL_CONFIGS[vertical];
  if (!config) return [];

  const query = `${config.name} ${topic}`;
  return searchGoogle(query, numResults, 'news');
}

/**
 * Search for price/market related content
 */
export async function searchMarketNews(
  vertical: TCGVertical,
  numResults: number = 10
): Promise<SerperResult[]> {
  const config = VERTICAL_CONFIGS[vertical];
  if (!config) return [];

  const marketTerms = ['price', 'market', 'value', 'investment', 'grading'];
  const query = `${config.name} ${marketTerms.slice(0, 2).join(' OR ')} news`;

  return searchGoogle(query, numResults, 'news');
}

/**
 * Search for product launches and announcements
 */
export async function searchProductNews(
  vertical: TCGVertical,
  numResults: number = 10
): Promise<SerperResult[]> {
  const config = VERTICAL_CONFIGS[vertical];
  if (!config) return [];

  const productTerms = ['new set', 'release', 'announcement', 'preview', 'spoiler'];
  const query = `${config.name} ${productTerms.slice(0, 2).join(' OR ')}`;

  return searchGoogle(query, numResults, 'news');
}
