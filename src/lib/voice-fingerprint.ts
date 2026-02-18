// ===== VOICE FINGERPRINT — Types & Utilities =====

// Core fingerprint capturing how a creator actually writes
export interface VoiceFingerprint {
  // Sentence patterns: rhythm, length distribution, structure preferences
  sentencePatterns: {
    avgLength: 'short' | 'medium' | 'long'; // word count tendency
    lengthVariation: 'uniform' | 'mixed' | 'dramatic'; // how much length varies
    openingStyle: string; // how they typically start (e.g., "questions", "bold claims", "stories")
    closingStyle: string; // how they typically end (e.g., "CTA", "open question", "mic drop")
    fragmentUsage: 'never' | 'occasional' | 'frequent'; // sentence fragments
    listStyle: 'none' | 'bullets' | 'numbered' | 'inline'; // how they list things
  };

  // Vocabulary: word choice patterns
  vocabulary: {
    complexity: 'simple' | 'moderate' | 'advanced'; // reading level
    jargonLevel: 'none' | 'light' | 'heavy'; // industry/niche jargon
    signatureWords: string[]; // words they use unusually often
    avoidedWords: string[]; // words they never use
    contractionUsage: 'always' | 'sometimes' | 'never';
    slangComfort: 'none' | 'light' | 'heavy';
  };

  // Formatting: visual structure preferences
  formatting: {
    paragraphLength: 'short' | 'medium' | 'long';
    useOfEmphasis: 'minimal' | 'moderate' | 'heavy'; // bold, italic, caps
    emojiUsage: 'never' | 'rare' | 'moderate' | 'heavy';
    lineBreakStyle: 'dense' | 'airy' | 'mixed';
    hashtagStyle: 'none' | 'minimal' | 'moderate' | 'heavy';
  };

  // Rhetoric: persuasion and argumentation style
  rhetoric: {
    primaryDevice: string; // e.g., "analogy", "data-driven", "storytelling", "provocation"
    proofStyle: string; // how they back claims: "personal experience", "data", "authority", "logic"
    emotionalRange: 'restrained' | 'moderate' | 'expressive';
    humorStyle: 'none' | 'dry' | 'witty' | 'self-deprecating' | 'absurdist';
    controversyComfort: 'avoids' | 'measured' | 'leans-in';
  };

  // Thinking style: how they process and present ideas
  thinkingStyle: {
    perspective: 'first-person' | 'third-person' | 'mixed';
    abstractVsConcrete: 'abstract' | 'balanced' | 'concrete';
    certaintyLevel: 'hedging' | 'balanced' | 'assertive';
    nuanceLevel: 'black-and-white' | 'balanced' | 'highly-nuanced';
  };

  // Content structure: how they organize posts/pieces
  contentStructure: {
    hookStyle: string; // how they grab attention
    transitionStyle: string; // how they move between ideas
    pacing: 'steady' | 'building' | 'front-loaded';
    signOff: string; // how they typically end (catchphrase, CTA, question, etc.)
  };

  // Signature elements: the unmistakable "them" markers
  signatureElements: string[]; // e.g., "always starts with a question", "uses em-dashes constantly"

  // Anti-patterns: things that would make their writing sound fake
  antiPatterns: string[]; // e.g., "never uses 'excited to announce'", "never starts with 'In today's'"

  // Source metadata
  metadata: {
    sampleCount: number;
    totalWordCount: number;
    extractedAt: string; // ISO date
    confidence: number; // 0-100, how confident we are in this fingerprint
    version: number; // schema version for future migrations
  };
}

// Compact summary for embedding in generation prompts (~200 tokens)
export interface VoiceFingerprintSummary {
  voiceDescription: string; // 2-3 sentence natural language description
  keyRules: string[]; // 5-8 concrete rules for matching this voice
  antiRules: string[]; // 3-5 things to absolutely avoid
  signatureMarkers: string[]; // 2-4 unmistakable markers
}

// Authenticity scoring result
export interface AuthenticityScore {
  overall: number; // 0-100
  dimensions: {
    vocabulary: number;
    sentenceRhythm: number;
    formatting: number;
    rhetoric: number;
    signatureElements: number;
    opinionStrength: number;
    storytelling: number;
  };
  verdict: 'authentic' | 'mostly_authentic' | 'needs_work' | 'generic' | 'ai_detected';
  flags: AuthenticityFlag[];
  summary: string; // one-sentence summary
}

// Individual flag on a piece of content
export interface AuthenticityFlag {
  id: string;
  text: string; // the flagged text
  startIndex: number;
  endIndex: number;
  severity: 'low' | 'medium' | 'high';
  reason: string; // why it was flagged
  suggestion: string; // suggested rewrite
  dimension: keyof AuthenticityScore['dimensions'];
}

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Compress a full VoiceFingerprint into a ~200-token summary
 * suitable for embedding in generation prompts.
 */
export function summarizeFingerprint(fp: VoiceFingerprint): VoiceFingerprintSummary {
  const voiceParts: string[] = [];

  // Sentence style
  voiceParts.push(
    `Writes in ${fp.sentencePatterns.avgLength} sentences with ${fp.sentencePatterns.lengthVariation} variation.`
  );

  // Vocabulary
  voiceParts.push(
    `${fp.vocabulary.complexity} vocabulary, ${fp.vocabulary.contractionUsage === 'always' ? 'uses contractions' : fp.vocabulary.contractionUsage === 'never' ? 'avoids contractions' : 'occasionally uses contractions'}.`
  );

  // Rhetoric
  voiceParts.push(
    `Argues via ${fp.rhetoric.primaryDevice}, ${fp.rhetoric.emotionalRange} emotional range, ${fp.rhetoric.humorStyle} humor.`
  );

  const voiceDescription = voiceParts.join(' ');

  // Build concrete rules
  const keyRules: string[] = [];

  if (fp.sentencePatterns.fragmentUsage === 'frequent') {
    keyRules.push('Use sentence fragments freely for emphasis and rhythm');
  }
  if (fp.sentencePatterns.openingStyle) {
    keyRules.push(`Open with ${fp.sentencePatterns.openingStyle}`);
  }
  if (fp.vocabulary.signatureWords.length > 0) {
    keyRules.push(`Naturally incorporate words like: ${fp.vocabulary.signatureWords.slice(0, 5).join(', ')}`);
  }
  if (fp.formatting.emojiUsage !== 'never') {
    keyRules.push(`Use emojis ${fp.formatting.emojiUsage}ly`);
  }
  if (fp.rhetoric.primaryDevice) {
    keyRules.push(`Lean on ${fp.rhetoric.primaryDevice} as primary persuasion tool`);
  }
  if (fp.thinkingStyle.certaintyLevel === 'assertive') {
    keyRules.push('Make strong, direct claims without hedging');
  } else if (fp.thinkingStyle.certaintyLevel === 'hedging') {
    keyRules.push('Acknowledge complexity and qualify statements');
  }
  if (fp.contentStructure.hookStyle) {
    keyRules.push(`Hook: ${fp.contentStructure.hookStyle}`);
  }
  if (fp.contentStructure.signOff) {
    keyRules.push(`End with: ${fp.contentStructure.signOff}`);
  }

  // Anti-rules
  const antiRules = fp.antiPatterns.slice(0, 5);
  if (fp.vocabulary.avoidedWords.length > 0) {
    antiRules.push(`Never use: ${fp.vocabulary.avoidedWords.slice(0, 5).join(', ')}`);
  }

  // Signature markers
  const signatureMarkers = fp.signatureElements.slice(0, 4);

  return {
    voiceDescription,
    keyRules: keyRules.slice(0, 8),
    antiRules: antiRules.slice(0, 5),
    signatureMarkers,
  };
}

/**
 * Format a VoiceFingerprintSummary as a prompt-injectable string
 */
export function formatSummaryForPrompt(summary: VoiceFingerprintSummary): string {
  return `VOICE FINGERPRINT:
${summary.voiceDescription}

VOICE RULES (match these):
${summary.keyRules.map(r => `- ${r}`).join('\n')}

VOICE ANTI-RULES (never do these):
${summary.antiRules.map(r => `- ${r}`).join('\n')}

SIGNATURE MARKERS (include naturally):
${summary.signatureMarkers.map(m => `- ${m}`).join('\n')}`;
}

/**
 * Create an empty/default fingerprint
 */
export function createEmptyFingerprint(): VoiceFingerprint {
  return {
    sentencePatterns: {
      avgLength: 'medium',
      lengthVariation: 'mixed',
      openingStyle: '',
      closingStyle: '',
      fragmentUsage: 'occasional',
      listStyle: 'none',
    },
    vocabulary: {
      complexity: 'moderate',
      jargonLevel: 'none',
      signatureWords: [],
      avoidedWords: [],
      contractionUsage: 'sometimes',
      slangComfort: 'none',
    },
    formatting: {
      paragraphLength: 'medium',
      useOfEmphasis: 'moderate',
      emojiUsage: 'never',
      lineBreakStyle: 'mixed',
      hashtagStyle: 'none',
    },
    rhetoric: {
      primaryDevice: '',
      proofStyle: '',
      emotionalRange: 'moderate',
      humorStyle: 'none',
      controversyComfort: 'measured',
    },
    thinkingStyle: {
      perspective: 'first-person',
      abstractVsConcrete: 'balanced',
      certaintyLevel: 'balanced',
      nuanceLevel: 'balanced',
    },
    contentStructure: {
      hookStyle: '',
      transitionStyle: '',
      pacing: 'steady',
      signOff: '',
    },
    signatureElements: [],
    antiPatterns: [],
    metadata: {
      sampleCount: 0,
      totalWordCount: 0,
      extractedAt: new Date().toISOString(),
      confidence: 0,
      version: 1,
    },
  };
}
