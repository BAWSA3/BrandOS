import { NextResponse } from 'next/server';

// This endpoint can be used for AI-powered final extraction
// combining data from multiple sources

interface ExtractionRequest {
  sources: {
    type: 'pdf' | 'images' | 'url' | 'social';
    data: Record<string, unknown>;
  }[];
  preferences?: {
    prioritizeColors?: boolean;
    prioritizeTone?: boolean;
    prioritizeKeywords?: boolean;
  };
}

export async function POST(request: Request) {
  try {
    const body: ExtractionRequest = await request.json();

    if (!body.sources || body.sources.length === 0) {
      return NextResponse.json(
        { error: 'At least one source is required' },
        { status: 400 }
      );
    }

    // Merge data from multiple sources with conflict resolution
    const mergedResult = mergeExtractedData(body.sources, body.preferences);

    // In production, you could send this to an AI model for:
    // 1. Better conflict resolution
    // 2. Filling in gaps
    // 3. Improving confidence scores
    // 4. Generating additional insights

    return NextResponse.json(mergedResult);
  } catch (error) {
    console.error('Brand extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract brand data' },
      { status: 500 }
    );
  }
}

function mergeExtractedData(
  sources: ExtractionRequest['sources'],
  preferences?: ExtractionRequest['preferences']
) {
  // Source priority (higher index = higher priority)
  const sourcePriority: Record<string, number> = {
    pdf: 4,    // Brand guidelines are most authoritative
    images: 2, // Visual elements
    url: 3,    // Website data
    social: 1, // Social media
  };

  // Sort sources by priority
  const sortedSources = [...sources].sort(
    (a, b) => sourcePriority[a.type] - sourcePriority[b.type]
  );

  // Start with empty result
  const result: Record<string, unknown> = {
    overallConfidence: 0,
    name: null,
    colors: {},
    tone: {},
    keywords: [],
    doPatterns: [],
    dontPatterns: [],
    voiceSamples: [],
    fonts: [],
  };

  let confidenceSum = 0;
  let sourceCount = 0;

  // Merge each source (later sources override earlier ones due to priority)
  for (const source of sortedSources) {
    const data = source.data;
    sourceCount++;

    // Accumulate confidence
    if (typeof data.overallConfidence === 'number') {
      confidenceSum += data.overallConfidence;
    }

    // Merge name (highest priority wins)
    if (data.name) {
      result.name = data.name;
    }

    // Merge colors
    if (data.colors && typeof data.colors === 'object') {
      result.colors = { ...(result.colors as Record<string, unknown>), ...data.colors };
    }

    // Merge tone
    if (data.tone && typeof data.tone === 'object') {
      // Average tone values if both exist
      const existingTone = result.tone as Record<string, number>;
      const newTone = data.tone as Record<string, number>;
      
      for (const [key, value] of Object.entries(newTone)) {
        if (existingTone[key] !== undefined) {
          // Average the values
          existingTone[key] = Math.round((existingTone[key] + value) / 2);
        } else {
          existingTone[key] = value;
        }
      }
    }

    // Merge arrays (concatenate and dedupe)
    if (Array.isArray(data.keywords)) {
      const existingKeywords = result.keywords as string[];
      result.keywords = [...new Set([...existingKeywords, ...data.keywords])];
    }

    if (Array.isArray(data.doPatterns)) {
      const existing = result.doPatterns as string[];
      result.doPatterns = [...new Set([...existing, ...data.doPatterns])];
    }

    if (Array.isArray(data.dontPatterns)) {
      const existing = result.dontPatterns as string[];
      result.dontPatterns = [...new Set([...existing, ...data.dontPatterns])];
    }

    if (Array.isArray(data.voiceSamples)) {
      const existing = result.voiceSamples as string[];
      result.voiceSamples = [...new Set([...existing, ...data.voiceSamples])];
    }

    if (Array.isArray(data.fonts)) {
      const existing = result.fonts as string[];
      result.fonts = [...new Set([...existing, ...data.fonts])];
    }
  }

  // Calculate overall confidence as weighted average
  result.overallConfidence = sourceCount > 0 
    ? Math.round(confidenceSum / sourceCount)
    : 50;

  // Apply preferences to boost certain aspects
  if (preferences?.prioritizeColors && (result.colors as Record<string, unknown>)['primary']) {
    result.overallConfidence = Math.min(100, (result.overallConfidence as number) + 5);
  }

  // Limit arrays to reasonable sizes
  if (Array.isArray(result.keywords)) {
    result.keywords = (result.keywords as string[]).slice(0, 10);
  }
  if (Array.isArray(result.voiceSamples)) {
    result.voiceSamples = (result.voiceSamples as string[]).slice(0, 6);
  }
  if (Array.isArray(result.doPatterns)) {
    result.doPatterns = (result.doPatterns as string[]).slice(0, 6);
  }
  if (Array.isArray(result.dontPatterns)) {
    result.dontPatterns = (result.dontPatterns as string[]).slice(0, 6);
  }

  return result;
}
















