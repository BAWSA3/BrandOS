// =============================================================================
// TRANSCRIPT ENGINE — Extract transcripts from video content
// Supports YouTube captions API, and prepared for Whisper/Deepgram integration.
// =============================================================================

import type { TranscriptResult, TranscriptSegment, SocialPlatform } from './types';

// ── YouTube Captions (free, no extra service) ───────────────────

/**
 * Extract a YouTube video ID from various URL formats.
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch YouTube captions using the YouTube Data API v3.
 * Requires YOUTUBE_API_KEY env var.
 */
export async function fetchYouTubeCaptions(
  videoId: string
): Promise<TranscriptResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('[Transcript] YOUTUBE_API_KEY not configured');
    return null;
  }

  try {
    // Step 1: Get caption tracks
    const captionListUrl = `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${apiKey}`;
    const listRes = await fetch(captionListUrl);

    if (!listRes.ok) {
      // Fallback to the timedtext approach (works for many public videos)
      return fetchYouTubeTimedText(videoId);
    }

    const listData = await listRes.json();
    const tracks = listData.items ?? [];

    if (tracks.length === 0) {
      return fetchYouTubeTimedText(videoId);
    }

    // Prefer English auto-generated or manual captions
    const englishTrack =
      tracks.find((t: any) => t.snippet?.language === 'en' && t.snippet?.trackKind === 'standard') ??
      tracks.find((t: any) => t.snippet?.language === 'en') ??
      tracks[0];

    const language = englishTrack?.snippet?.language ?? 'en';

    // Use timedtext fallback since downloading captions via API requires OAuth
    return fetchYouTubeTimedText(videoId, language);
  } catch (error) {
    console.error('[Transcript] YouTube captions API error:', error);
    return fetchYouTubeTimedText(videoId);
  }
}

/**
 * Fallback: Fetch YouTube auto-generated captions via timedtext endpoint.
 * Works for most public videos without OAuth.
 */
async function fetchYouTubeTimedText(
  videoId: string,
  lang = 'en'
): Promise<TranscriptResult | null> {
  try {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
    const res = await fetch(url);

    if (!res.ok) {
      // Try auto-generated captions
      const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&kind=asr&fmt=json3`;
      const autoRes = await fetch(autoUrl);
      if (!autoRes.ok) return null;

      return parseTimedTextResponse(await autoRes.json(), lang);
    }

    return parseTimedTextResponse(await res.json(), lang);
  } catch (error) {
    console.error('[Transcript] YouTube timedtext error:', error);
    return null;
  }
}

function parseTimedTextResponse(
  data: any,
  language: string
): TranscriptResult | null {
  const events = data?.events;
  if (!events || !Array.isArray(events)) return null;

  const segments: TranscriptSegment[] = [];
  let fullText = '';
  let maxEnd = 0;

  for (const event of events) {
    if (!event.segs) continue;

    const segText = event.segs.map((s: any) => s.utf8 ?? '').join('');
    if (!segText.trim()) continue;

    const start = (event.tStartMs ?? 0) / 1000;
    const duration = (event.dDurationMs ?? 0) / 1000;
    const end = start + duration;

    segments.push({ start, end, text: segText.trim() });
    fullText += (fullText ? ' ' : '') + segText.trim();
    maxEnd = Math.max(maxEnd, end);
  }

  if (segments.length === 0) return null;

  return {
    text: fullText,
    language,
    duration: maxEnd,
    segments,
    source: 'youtube-captions',
    confidence: 0.8,
  };
}

// ── TikTok Transcript (via video URL) ───────────────────────────

/**
 * Extract a TikTok video ID from a URL.
 */
export function extractTikTokVideoId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

// ── Platform URL Detection ──────────────────────────────────────

/**
 * Detect platform and extract video ID from a URL.
 */
export function detectVideoSource(url: string): {
  platform: SocialPlatform;
  videoId: string;
} | null {
  const ytId = extractYouTubeVideoId(url);
  if (ytId) return { platform: 'youtube', videoId: ytId };

  const ttId = extractTikTokVideoId(url);
  if (ttId) return { platform: 'tiktok', videoId: ttId };

  return null;
}

// ── Main Transcript Fetcher ─────────────────────────────────────

/**
 * Fetch transcript for a video URL. Routes to the correct provider.
 */
export async function fetchTranscript(
  videoUrl: string
): Promise<TranscriptResult | null> {
  const source = detectVideoSource(videoUrl);

  if (!source) {
    console.error('[Transcript] Unsupported video URL:', videoUrl);
    return null;
  }

  switch (source.platform) {
    case 'youtube':
      return fetchYouTubeCaptions(source.videoId);

    case 'tiktok':
      // TikTok doesn't have a public caption API — would need Whisper/Deepgram
      console.warn('[Transcript] TikTok transcript requires Whisper/Deepgram integration');
      return null;

    default:
      return null;
  }
}

/**
 * Create a manual TranscriptResult from user-pasted text.
 */
export function createManualTranscript(text: string): TranscriptResult {
  const words = text.split(/\s+/).length;
  const estimatedDuration = (words / 150) * 60; // ~150 words per minute

  return {
    text,
    language: 'en',
    duration: estimatedDuration,
    source: 'manual',
    confidence: 1.0,
  };
}
