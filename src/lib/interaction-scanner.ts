/**
 * Interaction Scanner — Detects who a user interacts with most on X/Twitter.
 *
 * Fetches last 100 tweets INCLUDING replies, retweets, and QRTs,
 * then extracts and ranks interaction targets by frequency.
 */

import {
  fetchProfile,
  isSocialDataConfigured,
  type SocialDataTweet,
} from './socialdata';

const SOCIALDATA_BASE = 'https://api.socialdata.tools';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InteractionTarget {
  username: string;
  score: number; // total weighted interaction points
  breakdown: {
    replies: number;
    mentions: number;
    retweets: number;
    quoteTweets: number;
  };
}

export interface InteractionScanResult {
  username: string;
  topInteractors: InteractionTarget[];
  totalTweetsScanned: number;
  error?: string;
}

export interface MutualInteractionResult {
  userA: string;
  userB: string;
  mutualScore: number; // combined interaction score
  aToB: InteractionTarget;
  bToA: InteractionTarget;
}

// ---------------------------------------------------------------------------
// Weights — how much each interaction type counts
// ---------------------------------------------------------------------------

const WEIGHTS = {
  reply: 3,     // replying = strongest signal
  quoteTweet: 2, // QRT = strong engagement
  mention: 1,    // mention in original tweet
  retweet: 1,    // RT = acknowledgment
};

// ---------------------------------------------------------------------------
// Internal: Fetch tweets WITH replies and retweets (no filtering)
// ---------------------------------------------------------------------------

interface RawTweet {
  id_str?: string;
  id?: number;
  full_text?: string;
  text?: string;
  in_reply_to_screen_name?: string;
  in_reply_to_status_id_str?: string;
  retweeted_status?: Record<string, unknown>;
  quoted_status?: Record<string, unknown>;
  is_quote_status?: boolean;
  entities?: {
    user_mentions?: { screen_name: string }[];
    urls?: { expanded_url: string }[];
  };
}

async function fetchAllTweets(
  userId: string,
  maxResults: number = 100
): Promise<{ tweets: RawTweet[]; error?: string }> {
  const apiKey = process.env.SOCIALDATA_API_KEY;
  if (!apiKey) return { tweets: [], error: 'SOCIALDATA_API_KEY not configured' };

  try {
    const response = await fetch(
      `${SOCIALDATA_BASE}/twitter/user/${encodeURIComponent(userId)}/tweets?count=${Math.min(maxResults, 200)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      return { tweets: [], error: `SocialData error (${response.status})` };
    }

    const data = await response.json();
    const rawTweets: RawTweet[] = data.tweets || data || [];

    if (!Array.isArray(rawTweets)) {
      return { tweets: [], error: 'Unexpected response format' };
    }

    // DO NOT filter — we need replies, RTs, and QRTs for interaction detection
    return { tweets: rawTweets.slice(0, maxResults) };
  } catch (error) {
    console.error('[INTERACTION-SCANNER] Tweet fetch error:', error);
    return { tweets: [], error: 'Failed to fetch tweets' };
  }
}

// ---------------------------------------------------------------------------
// Extract interactions from tweets
// ---------------------------------------------------------------------------

function extractInteractions(
  tweets: RawTweet[],
  ownUsername: string
): Map<string, InteractionTarget['breakdown']> {
  const interactions = new Map<string, InteractionTarget['breakdown']>();
  const ownLower = ownUsername.toLowerCase();

  function ensure(username: string): InteractionTarget['breakdown'] {
    const lower = username.toLowerCase();
    if (lower === ownLower) return { replies: 0, mentions: 0, retweets: 0, quoteTweets: 0 };
    if (!interactions.has(lower)) {
      interactions.set(lower, { replies: 0, mentions: 0, retweets: 0, quoteTweets: 0 });
    }
    return interactions.get(lower)!;
  }

  for (const tweet of tweets) {
    const text = tweet.full_text || tweet.text || '';

    // 1. Reply detection
    if (tweet.in_reply_to_screen_name) {
      const target = tweet.in_reply_to_screen_name;
      if (target.toLowerCase() !== ownLower) {
        ensure(target).replies++;
      }
    }

    // 2. Retweet detection
    if (tweet.retweeted_status) {
      const rtUser = tweet.retweeted_status.user as { screen_name?: string } | undefined;
      if (rtUser?.screen_name) {
        ensure(rtUser.screen_name).retweets++;
      }
    }

    // 3. Quote tweet detection
    if (tweet.is_quote_status && tweet.quoted_status) {
      const qtUser = tweet.quoted_status.user as { screen_name?: string } | undefined;
      if (qtUser?.screen_name) {
        ensure(qtUser.screen_name).quoteTweets++;
      }
    }

    // 4. @mention detection (from entities, excluding reply targets already counted)
    if (tweet.entities?.user_mentions) {
      for (const mention of tweet.entities.user_mentions) {
        if (!mention.screen_name) continue;
        const lower = mention.screen_name.toLowerCase();
        if (lower === ownLower) continue;
        // Don't double-count the reply target
        if (tweet.in_reply_to_screen_name?.toLowerCase() === lower) continue;
        // Don't count RT mentions (the RT'd user's mentions bleed through)
        if (tweet.retweeted_status) continue;
        ensure(mention.screen_name).mentions++;
      }
    }
  }

  return interactions;
}

// ---------------------------------------------------------------------------
// Score and rank interactions
// ---------------------------------------------------------------------------

function rankInteractions(
  interactions: Map<string, InteractionTarget['breakdown']>
): InteractionTarget[] {
  const ranked: InteractionTarget[] = [];

  for (const [username, breakdown] of interactions) {
    const score =
      breakdown.replies * WEIGHTS.reply +
      breakdown.quoteTweets * WEIGHTS.quoteTweet +
      breakdown.mentions * WEIGHTS.mention +
      breakdown.retweets * WEIGHTS.retweet;

    if (score > 0) {
      ranked.push({ username, score, breakdown });
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan a user's last 100 tweets and return their top interactors ranked by frequency.
 */
export async function scanInteractions(
  username: string,
  maxTweets: number = 100
): Promise<InteractionScanResult> {
  if (!isSocialDataConfigured()) {
    return { username, topInteractors: [], totalTweetsScanned: 0, error: 'SocialData not configured' };
  }

  // Resolve username to user ID
  const profileResult = await fetchProfile(username);
  if (!profileResult.profile) {
    return { username, topInteractors: [], totalTweetsScanned: 0, error: profileResult.error || 'User not found' };
  }

  // Fetch tweets WITH replies/RTs
  const { tweets, error } = await fetchAllTweets(profileResult.profile.id, maxTweets);
  if (error || tweets.length === 0) {
    return { username, topInteractors: [], totalTweetsScanned: 0, error: error || 'No tweets found' };
  }

  // Extract and rank
  const interactions = extractInteractions(tweets, username);
  const ranked = rankInteractions(interactions);

  return {
    username,
    topInteractors: ranked.slice(0, 20), // top 20
    totalTweetsScanned: tweets.length,
  };
}

/**
 * Confirm mutual interaction between two users.
 * Scans both users' tweets and checks if they interact with each other.
 */
export async function confirmMutualInteraction(
  userA: string,
  userB: string,
  scanA?: InteractionScanResult
): Promise<MutualInteractionResult | null> {
  // Scan A if not already provided
  const resultA = scanA || await scanInteractions(userA);
  if (resultA.error) return null;

  // Find B in A's interactions
  const aToBEntry = resultA.topInteractors.find(
    (t) => t.username.toLowerCase() === userB.toLowerCase()
  );

  // Scan B
  const resultB = await scanInteractions(userB);
  if (resultB.error) return null;

  // Find A in B's interactions
  const bToAEntry = resultB.topInteractors.find(
    (t) => t.username.toLowerCase() === userA.toLowerCase()
  );

  // Need at least one direction to have interaction
  if (!aToBEntry && !bToAEntry) return null;

  const aToB: InteractionTarget = aToBEntry || {
    username: userB,
    score: 0,
    breakdown: { replies: 0, mentions: 0, retweets: 0, quoteTweets: 0 },
  };

  const bToA: InteractionTarget = bToAEntry || {
    username: userA,
    score: 0,
    breakdown: { replies: 0, mentions: 0, retweets: 0, quoteTweets: 0 },
  };

  const mutualScore = aToB.score + bToA.score;

  // Both sides must have some interaction for it to be "mutual"
  if (aToB.score === 0 || bToA.score === 0) return null;

  return {
    userA,
    userB,
    mutualScore,
    aToB,
    bToA,
  };
}

/**
 * Find the best opp for a user based on interaction data.
 * Returns the top mutual interactor, or null if none found.
 */
export async function findInteractionBasedOpp(
  username: string
): Promise<{ opp: string; mutualData: MutualInteractionResult } | null> {
  const scan = await scanInteractions(username);
  if (scan.error || scan.topInteractors.length === 0) return null;

  // Check top interactors for mutual interaction (check up to top 5)
  const candidates = scan.topInteractors.slice(0, 5);

  for (const candidate of candidates) {
    const mutual = await confirmMutualInteraction(
      username,
      candidate.username,
      scan
    );
    if (mutual && mutual.mutualScore > 0) {
      return { opp: candidate.username, mutualData: mutual };
    }
  }

  return null;
}
