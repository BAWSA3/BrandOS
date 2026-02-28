/**
 * Deterministic hashing for onchain attestations.
 * Uses Web Crypto API (available in Node 18+ and all modern browsers)
 * to produce SHA-256 hashes of structured data.
 */

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return '0x' + Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

export async function hashBrandDNA(brand: {
  name: string;
  colors: unknown;
  tone: unknown;
  keywords: string[];
  doPatterns: string[];
  dontPatterns: string[];
  voiceSamples: string[];
}): Promise<string> {
  const payload = canonicalize({
    name: brand.name,
    colors: brand.colors,
    tone: brand.tone,
    keywords: brand.keywords,
    doPatterns: brand.doPatterns,
    dontPatterns: brand.dontPatterns,
    voiceSamples: brand.voiceSamples,
  });
  return sha256(payload);
}

export async function hashContent(content: string): Promise<string> {
  return sha256(content);
}

export async function hashVoiceFingerprint(fingerprint: {
  sentencePatterns?: unknown;
  vocabulary?: unknown;
  formatting?: unknown;
  rhetoric?: unknown;
  thinkingStyle?: unknown;
  contentStructure?: unknown;
  signatureElements?: unknown;
  antiPatterns?: unknown;
  metadata?: unknown;
}): Promise<string> {
  const payload = canonicalize({
    sentencePatterns: fingerprint.sentencePatterns,
    vocabulary: fingerprint.vocabulary,
    formatting: fingerprint.formatting,
    rhetoric: fingerprint.rhetoric,
    thinkingStyle: fingerprint.thinkingStyle,
    contentStructure: fingerprint.contentStructure,
    signatureElements: fingerprint.signatureElements,
    antiPatterns: fingerprint.antiPatterns,
  });
  return sha256(payload);
}

export async function hashBrandScore(score: {
  username: string;
  overallScore: number;
  phases: Record<string, { score: number }>;
}): Promise<string> {
  const payload = canonicalize({
    username: score.username,
    overallScore: score.overallScore,
    phases: score.phases,
  });
  return sha256(payload);
}
