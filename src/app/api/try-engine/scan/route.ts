import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { VoiceScanRequestSchema } from '@/lib/agents/content-engine.types';
import Anthropic from '@anthropic-ai/sdk';

// Quick voice scan — fetches recent tweets and extracts tone/style summary
// Returns a lightweight voice profile, not a full VoiceFingerprint

export interface QuickVoiceScan {
  toneWords: string[];        // e.g. ["direct", "lowercase", "punchy"]
  doPatterns: string[];       // e.g. ["uses short sentences", "code metaphors"]
  dontPatterns: string[];     // e.g. ["never uses emojis", "avoids corporate speak"]
  sampleTopics: string[];     // topics they post about
  suggestedVibe: string;      // maps to our tone presets
  confidence: number;         // 0-100
}

async function fetchTweets(username: string): Promise<string[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) throw new Error('X API not configured');

  // Get user ID first
  const userRes = await fetch(
    `https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  const userData = await userRes.json();
  if (!userData.data?.id) throw new Error('User not found');

  // Fetch recent tweets (exclude replies and retweets)
  const tweetsRes = await fetch(
    `https://api.x.com/2/users/${userData.data.id}/tweets?max_results=15&exclude=replies,retweets&tweet.fields=text`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );
  const tweetsData = await tweetsRes.json();

  if (!tweetsData.data || tweetsData.data.length === 0) {
    throw new Error('No tweets found');
  }

  return tweetsData.data.map((t: { text: string }) => t.text);
}

async function analyzeVoice(tweets: string[]): Promise<QuickVoiceScan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('API key not configured');

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Analyze these ${tweets.length} tweets and extract the creator's voice/tone profile.

TWEETS:
${tweets.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return ONLY valid JSON:
{
  "toneWords": ["3-5 adjectives describing their tone, e.g. direct, lowercase, punchy, witty"],
  "doPatterns": ["3-5 things they consistently do in writing style"],
  "dontPatterns": ["2-3 things they avoid"],
  "sampleTopics": ["2-4 topics they post about"],
  "suggestedVibe": "one of: bold, chill, pro, edgy, default",
  "confidence": 0-100
}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse voice scan');
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const { limited } = checkRateLimit(`try-scan:${clientId}`, {
    interval: 60 * 1000,
    maxRequests: 5,
  });

  if (limited) {
    return NextResponse.json(
      { error: 'Too many scan requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // Validate with Zod schema (includes regex check for username format)
    const parsed = VoiceScanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Strip @ if present
    const clean = parsed.data.username.replace(/^@/, '').trim();

    const tweets = await fetchTweets(clean);
    const scan = await analyzeVoice(tweets);

    return NextResponse.json(scan);
  } catch (err) {
    console.error('Voice scan failed:', err);
    const message = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
