// Shared helpers for the Import Hub analysis routes (consolidation step 7).
// The routes return a legacy-shaped payload the import components already
// consume; everything model- or web-derived passes through these clamps so a
// hostile document/page can't smuggle oversized or non-schema data into the
// client store.

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function asHexColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return HEX_COLOR.test(v) ? v : undefined;
}

export function clampTone(value: unknown, fallback = 50): number {
  const n = typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function asStringArray(value: unknown, maxItems: number, maxChars: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, maxItems)
    .map((v) => v.trim().slice(0, maxChars));
}

export function asShortString(value: unknown, maxChars: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().slice(0, maxChars);
  return v.length > 0 ? v : undefined;
}

/**
 * Pull a JSON object out of a model response that may wrap it in code fences
 * or prose. Returns null rather than throwing — callers surface a clean 502.
 */
export function parseModelJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Heuristic tone scoring shared by the URL and social analyzers (no LLM cost).
 * Formality (casual↔formal), energy (reserved↔energetic), confidence
 * (humble↔bold), style (classic↔experimental, defaults to middle).
 */
export function analyzeToneHeuristic(text: string): {
  formality: number;
  energy: number;
  confidence: number;
  style: number;
} {
  const lower = text.toLowerCase();

  const informalIndicators = ['hey', 'cool', 'awesome', 'check out', 'btw', '!', 'gonna', 'wanna'];
  const formalIndicators = ['therefore', 'furthermore', 'regarding', 'hereby', 'pursuant'];
  const informalCount = informalIndicators.filter((i) => lower.includes(i)).length;
  const formalCount = formalIndicators.filter((i) => lower.includes(i)).length;
  const formality = Math.min(100, Math.max(0, 50 + (formalCount - informalCount) * 15));

  const exclamations = (text.match(/!/g) || []).length;
  const energy = Math.min(100, Math.max(0, 30 + exclamations * 10));

  const boldIndicators = ['best', 'leading', '#1', 'revolutionary', 'ultimate', 'proven'];
  const humbleIndicators = ['try', 'maybe', 'might', 'could', 'possibly'];
  const boldCount = boldIndicators.filter((i) => lower.includes(i)).length;
  const humbleCount = humbleIndicators.filter((i) => lower.includes(i)).length;
  const confidence = Math.min(100, Math.max(0, 50 + (boldCount - humbleCount) * 15));

  return { formality, energy, confidence, style: 50 };
}

/** Frequency-based keyword extraction from free text (no LLM cost). */
export function extractKeywordsFromText(text: string, max = 6): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const stopWords = new Set([
    'about',
    'their',
    'would',
    'could',
    'should',
    'which',
    'where',
    'there',
    'these',
    'those',
    'being',
    'https',
  ]);
  const counts: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) counts[w] = (counts[w] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, max);
}
