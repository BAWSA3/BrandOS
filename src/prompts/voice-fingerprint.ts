import { VoiceFingerprint, VoiceFingerprintSummary, AuthenticityFlag, formatSummaryForPrompt } from '@/lib/voice-fingerprint';

// ── Extraction Prompts ──────────────────────────────────────────

/**
 * Analyzes raw writing samples and extracts a structured VoiceFingerprint.
 */
export function buildFingerprintExtractionPrompt(samples: string[]): string {
  const samplesText = samples
    .map((s, i) => `--- SAMPLE ${i + 1} ---\n${s}`)
    .join('\n\n');

  return `You are a voice forensics expert. Analyze these writing samples to create a detailed voice fingerprint — a structural model of HOW this person writes, not WHAT they write about.

Focus on patterns that repeat across samples. Ignore one-off anomalies.

${samplesText}

Analyze across these dimensions and return ONLY valid JSON matching this exact structure:

{
  "sentencePatterns": {
    "avgLength": "short" | "medium" | "long",
    "lengthVariation": "uniform" | "mixed" | "dramatic",
    "openingStyle": "<how they typically start posts/paragraphs, e.g. 'bold claims', 'questions', 'stories'>",
    "closingStyle": "<how they typically end, e.g. 'call to action', 'question', 'mic drop statement'>",
    "fragmentUsage": "never" | "occasional" | "frequent",
    "listStyle": "none" | "bullets" | "numbered" | "inline"
  },
  "vocabulary": {
    "complexity": "simple" | "moderate" | "advanced",
    "jargonLevel": "none" | "light" | "heavy",
    "signatureWords": ["words they use unusually often — max 10"],
    "avoidedWords": ["words they conspicuously never use — max 5"],
    "contractionUsage": "always" | "sometimes" | "never",
    "slangComfort": "none" | "light" | "heavy"
  },
  "formatting": {
    "paragraphLength": "short" | "medium" | "long",
    "useOfEmphasis": "minimal" | "moderate" | "heavy",
    "emojiUsage": "never" | "rare" | "moderate" | "heavy",
    "lineBreakStyle": "dense" | "airy" | "mixed",
    "hashtagStyle": "none" | "minimal" | "moderate" | "heavy"
  },
  "rhetoric": {
    "primaryDevice": "<main persuasion tool: analogy, data-driven, storytelling, provocation, authority, logic>",
    "proofStyle": "<how they back claims: personal experience, data, authority, logic, social proof>",
    "emotionalRange": "restrained" | "moderate" | "expressive",
    "humorStyle": "none" | "dry" | "witty" | "self-deprecating" | "absurdist",
    "controversyComfort": "avoids" | "measured" | "leans-in"
  },
  "thinkingStyle": {
    "perspective": "first-person" | "third-person" | "mixed",
    "abstractVsConcrete": "abstract" | "balanced" | "concrete",
    "certaintyLevel": "hedging" | "balanced" | "assertive",
    "nuanceLevel": "black-and-white" | "balanced" | "highly-nuanced"
  },
  "contentStructure": {
    "hookStyle": "<how they grab attention in opening>",
    "transitionStyle": "<how they move between ideas>",
    "pacing": "steady" | "building" | "front-loaded",
    "signOff": "<how they typically end — catchphrase, CTA, question, etc.>"
  },
  "signatureElements": [
    "3-6 unmistakable markers, e.g. 'always uses em-dashes', 'starts threads with a contrarian take'"
  ],
  "antiPatterns": [
    "4-8 things this writer would NEVER do, including common AI-isms they avoid, e.g. 'never says excited to announce', 'never uses In today\\'s fast-paced world'"
  ],
  "metadata": {
    "sampleCount": ${samples.length},
    "totalWordCount": ${samples.reduce((sum, s) => sum + s.split(/\s+/).length, 0)},
    "extractedAt": "${new Date().toISOString()}",
    "confidence": <0-100 based on sample quality and consistency>,
    "version": 1
  }
}`;
}

/**
 * Updates an existing fingerprint with new writing samples.
 */
export function buildFingerprintRefinementPrompt(
  existing: VoiceFingerprint,
  newSamples: string[]
): string {
  const samplesText = newSamples
    .map((s, i) => `--- NEW SAMPLE ${i + 1} ---\n${s}`)
    .join('\n\n');

  return `You are a voice forensics expert. You have an existing voice fingerprint and new writing samples. Update the fingerprint by incorporating patterns from the new samples.

EXISTING FINGERPRINT:
${JSON.stringify(existing, null, 2)}

NEW SAMPLES:
${samplesText}

Rules:
1. If new samples confirm existing patterns, increase confidence.
2. If new samples reveal patterns not captured, add them.
3. If new samples contradict existing patterns, update to reflect the broader truth.
4. Update metadata: increment sampleCount by ${newSamples.length}, update totalWordCount, set new extractedAt, adjust confidence.

Return the complete updated fingerprint as ONLY valid JSON with the same structure as the existing fingerprint.`;
}

// ── Authenticity Check Prompts ──────────────────────────────────

/**
 * Scores content against a voice fingerprint for authenticity.
 */
export function buildAuthenticityCheckPrompt(
  fingerprint: VoiceFingerprint,
  content: string
): string {
  return `You are an AI content authenticity detector. Given a creator's voice fingerprint and a piece of content, score how authentic the content sounds — does it read like this specific human wrote it, or like an AI?

VOICE FINGERPRINT:
${JSON.stringify(fingerprint, null, 2)}

CONTENT TO CHECK:
"${content}"

Score each dimension 0-100 (100 = perfectly matches this creator's voice):

1. **vocabulary** — Does the word choice match? Signature words present? Avoided words absent?
2. **sentenceRhythm** — Do sentence lengths and structures match the pattern?
3. **formatting** — Does formatting (emphasis, emojis, line breaks) match?
4. **rhetoric** — Does the persuasion style and proof method match?
5. **signatureElements** — Are the creator's signature markers present?
6. **opinionStrength** — Does the certainty/hedging level match?
7. **storytelling** — Does the content structure and pacing match?

Also flag specific phrases that sound generic, AI-generated, or inconsistent with this creator's voice. Common AI tells include:
- "In today's fast-paced world" / "In an era of..."
- "Excited to announce/share" (when the creator never says this)
- Excessive hedging ("It's worth noting that...", "It's important to remember...")
- Perfect parallel structure (real humans are messier)
- Corporate filler ("leverage", "synergy", "at the end of the day")
- Opening with "I" followed by a passive observation

Return ONLY valid JSON:
{
  "overall": <0-100 weighted average>,
  "dimensions": {
    "vocabulary": <0-100>,
    "sentenceRhythm": <0-100>,
    "formatting": <0-100>,
    "rhetoric": <0-100>,
    "signatureElements": <0-100>,
    "opinionStrength": <0-100>,
    "storytelling": <0-100>
  },
  "verdict": "authentic" | "mostly_authentic" | "needs_work" | "generic" | "ai_detected",
  "flags": [
    {
      "id": "<unique-id>",
      "text": "<exact flagged text from the content>",
      "startIndex": <character index where flagged text starts>,
      "endIndex": <character index where flagged text ends>,
      "severity": "low" | "medium" | "high",
      "reason": "<why this sounds inauthentic for this creator>",
      "suggestion": "<rewritten version in the creator's actual voice>",
      "dimension": "<which dimension this violates>"
    }
  ],
  "summary": "<one sentence: 'This content [scores well/needs work] because...'>"
}`;
}

/**
 * Rewrites flagged sections in the creator's actual voice.
 */
export function buildAuthenticityRewritePrompt(
  fingerprint: VoiceFingerprint,
  content: string,
  flags: AuthenticityFlag[]
): string {
  const summary = {
    voiceDescription: `Writes in ${fingerprint.sentencePatterns.avgLength} sentences, ${fingerprint.vocabulary.complexity} vocabulary, ${fingerprint.rhetoric.primaryDevice} rhetoric, ${fingerprint.rhetoric.humorStyle} humor.`,
    signatureWords: fingerprint.vocabulary.signatureWords,
    signatureElements: fingerprint.signatureElements,
    antiPatterns: fingerprint.antiPatterns,
    formatting: fingerprint.formatting,
    perspective: fingerprint.thinkingStyle.perspective,
    certainty: fingerprint.thinkingStyle.certaintyLevel,
  };

  const flagDescriptions = flags
    .map((f, i) => `${i + 1}. "${f.text}" — ${f.reason}`)
    .join('\n');

  return `You are a voice-matching rewriter. Rewrite the content below so it sounds authentically like this specific creator, fixing all flagged sections.

CREATOR'S VOICE PROFILE:
${JSON.stringify(summary, null, 2)}

ANTI-PATTERNS (never use these):
${fingerprint.antiPatterns.map(a => `- ${a}`).join('\n')}

SIGNATURE ELEMENTS (include naturally):
${fingerprint.signatureElements.map(s => `- ${s}`).join('\n')}

ORIGINAL CONTENT:
"${content}"

FLAGGED SECTIONS TO FIX:
${flagDescriptions}

Rules:
1. Keep the core message and information intact
2. Only change phrasing, word choice, and structure to match the creator's voice
3. The result should feel like the creator wrote it from scratch, not like an edited AI draft
4. Incorporate signature elements naturally — don't force them
5. Match the creator's typical formatting (paragraph length, emphasis, emoji usage)

Return ONLY valid JSON:
{
  "rewrittenContent": "<the full rewritten content>",
  "changesApplied": ["<brief description of each change made>"]
}`;
}

/**
 * Build voice fingerprint instructions for injection into generation prompts.
 */
export function buildVoiceFingerprintInstructions(summary: VoiceFingerprintSummary): string {
  return `

=== VOICE AUTHENTICITY LAYER ===
${formatSummaryForPrompt(summary)}

CRITICAL: The content must sound like this specific human wrote it, NOT like an AI.
Apply every voice rule above. If something sounds like "ChatGPT wrote this", rewrite it.
===`;
}
