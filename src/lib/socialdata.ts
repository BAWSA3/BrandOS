/**
 * SocialData.tools API Client
 *
 * Primary provider for all Twitter/X data fetching.
 * Pay-per-use (~$0.0002/request) with no daily caps.
 *
 * API returns Twitter v1.1-style JSON — we map it to our internal interfaces.
 */

const SOCIALDATA_BASE = 'https://api.socialdata.tools';

function getApiKey(): string | null {
  return process.env.SOCIALDATA_API_KEY || null;
}

async function socialDataFetch(path: string): Promise<Response> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('SOCIALDATA_API_KEY not configured');

  return fetch(`${SOCIALDATA_BASE}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
}

// ---------------------------------------------------------------------------
// Types — match existing XProfile and Tweet interfaces used across the app
// ---------------------------------------------------------------------------

export interface SocialDataProfile {
  id: string;
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  created_at: string;
  verified: boolean;
  location?: string;
  url?: string;
  protected: boolean;
}

export interface SocialDataTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
    bookmark_count?: number;
  };
  entities?: {
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url: string }[];
  };
  /** Attached media types ('photo' | 'video' | 'animated_gif'); empty when none. */
  media?: string[];
  /** Quote post (kept: it's the author's own words on top of someone else's). */
  is_quote?: boolean;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function fetchProfile(
  username: string
): Promise<{ profile?: SocialDataProfile; status: number; error?: string }> {
  try {
    const response = await socialDataFetch(`/twitter/user/${encodeURIComponent(username)}`);
    console.log(`[SOCIALDATA] profile @${username} -> ${response.status}`);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error(`[SOCIALDATA ERROR] ${response.status} @${username}:`, JSON.stringify(err));
      if (response.status === 404 || response.status === 400) {
        return { status: 404, error: `User @${username} not found on X` };
      }
      return { status: response.status, error: `SocialData error (${response.status})` };
    }

    const data = await response.json();
    if (!data || !data.id_str) {
      return { status: 404, error: `User @${username} not found on X` };
    }

    return {
      status: 200,
      profile: {
        id: data.id_str,
        name: data.name || '',
        username: data.screen_name || username,
        description: data.description || '',
        profile_image_url: (data.profile_image_url_https || '').replace('_normal', '_400x400'),
        public_metrics: {
          followers_count: data.followers_count || 0,
          following_count: data.friends_count || 0,
          tweet_count: data.statuses_count || 0,
          listed_count: data.listed_count || 0,
        },
        created_at: data.created_at || '',
        verified: data.verified || false,
        location: data.location || undefined,
        url: data.url || undefined,
        protected: data.protected || false,
      },
    };
  } catch (error) {
    console.error('[SOCIALDATA] Profile fetch error:', error);
    return { status: 500, error: 'SocialData request failed' };
  }
}

// ---------------------------------------------------------------------------
// User Tweets (timeline)
// ---------------------------------------------------------------------------

/**
 * Map a single SocialData v1.1 tweet to our internal format.
 */
function mapTweet(raw: Record<string, unknown>): SocialDataTweet {
  const fullText = (raw.full_text || raw.text || '') as string;
  // SocialData's v1.1 tweets carry tweet_created_at (ISO); created_at is absent
  const createdAt = ((raw.tweet_created_at || raw.created_at) as string) || '';

  // v1.1 metrics
  const likeCount = (raw.favorite_count as number) || 0;
  const retweetCount = (raw.retweet_count as number) || 0;
  const replyCount = (raw.reply_count as number) || 0;
  const quoteCount = (raw.quote_count as number) || 0;
  // SocialData may include bookmark/view counts on some endpoints
  const viewsObj = raw.ext_views as Record<string, unknown> | undefined;
  const impressionCount = (raw.views_count as number) || Number(viewsObj?.count) || 0;
  const bookmarkCount = (raw.bookmark_count as number) || 0;
  // Media lives in extended_entities / entities.media (never in entities.urls),
  // which is why every scan used to read "zero media"
  const mediaEnts = (
    (raw.extended_entities || raw.entities) as { media?: { type?: string }[] } | undefined
  )?.media;
  const media = (mediaEnts || []).map((m) => m.type || 'photo');

  // Entities mapping
  const rawEntities = raw.entities as Record<string, Record<string, unknown>[]> | undefined;
  let entities: SocialDataTweet['entities'] = undefined;
  if (rawEntities) {
    entities = {
      hashtags: (rawEntities.hashtags || []).map((h) => ({
        tag: (h.text as string) || '',
      })),
      mentions: (rawEntities.user_mentions || []).map((m) => ({
        username: (m.screen_name as string) || '',
      })),
      urls: (rawEntities.urls || []).map((u) => ({
        expanded_url: (u.expanded_url as string) || '',
      })),
    };
  }

  return {
    id: (raw.id_str as string) || String(raw.id || ''),
    text: fullText,
    created_at: createdAt,
    public_metrics: {
      like_count: likeCount,
      retweet_count: retweetCount,
      reply_count: replyCount,
      quote_count: quoteCount,
      impression_count: impressionCount,
      bookmark_count: bookmarkCount,
    },
    entities,
    media,
    is_quote: !!raw.is_quote_status,
  };
}

/** Timeline pages read per scan: ~21 posts a page, so 3 pages ≈ 40–60 original posts. */
const MAX_TIMELINE_PAGES = 3;

/** Retweets, replies and pinned posts aren't the author's recent original posting. */
function isRecentOriginal(t: Record<string, unknown>): boolean {
  const isRetweet = !!(t.retweeted_status || ((t.full_text as string) || '').startsWith('RT @'));
  const isReply = !!(t.in_reply_to_status_id_str || t.in_reply_to_status_id);
  // a pinned post is usually old; it skewed posting frequency for every account with one
  return !isRetweet && !isReply && !t.is_pinned;
}

/**
 * Fetch a user's recent original tweets via SocialData (user timeline).
 * The endpoint ignores `count` and returns ~21 posts per page, so we follow
 * next_cursor for up to MAX_TIMELINE_PAGES pages (one request each) until we
 * have maxResults originals.
 */
export async function fetchUserTweets(
  userId: string,
  maxResults: number = 20
): Promise<{ tweets: SocialDataTweet[]; error?: string }> {
  const want = Math.min(maxResults, 60);
  const seen = new Set<string>();
  const originals: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  try {
    for (let page = 0; page < MAX_TIMELINE_PAGES; page++) {
      const response = await socialDataFetch(
        `/twitter/user/${encodeURIComponent(userId)}/tweets` +
          (cursor ? `?cursor=${encodeURIComponent(cursor)}` : '')
      );
      console.log(`[SOCIALDATA] tweets for user ${userId} p${page + 1} -> ${response.status}`);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error(`[SOCIALDATA ERROR] tweets ${response.status}:`, JSON.stringify(err));
        // keep what earlier pages returned
        if (originals.length > 0) break;
        return { tweets: [], error: `SocialData error (${response.status})` };
      }

      const data = await response.json();
      const rawTweets: Record<string, unknown>[] = data.tweets || data || [];
      if (!Array.isArray(rawTweets)) {
        if (originals.length > 0) break;
        return { tweets: [], error: 'Unexpected response format' };
      }

      for (const t of rawTweets) {
        const id = String(t.id_str || t.id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        if (isRecentOriginal(t)) originals.push(t);
      }

      cursor = typeof data.next_cursor === 'string' ? data.next_cursor : undefined;
      if (originals.length >= want || !cursor || rawTweets.length === 0) break;
    }

    return { tweets: originals.slice(0, want).map(mapTweet) };
  } catch (error) {
    console.error('[SOCIALDATA] Tweet fetch error:', error);
    if (originals.length > 0) return { tweets: originals.slice(0, want).map(mapTweet) };
    return { tweets: [], error: 'SocialData request failed' };
  }
}

// ---------------------------------------------------------------------------
// Single post (with its author)
// ---------------------------------------------------------------------------

export interface SocialDataPost {
  id: string;
  text: string;
  createdAt: string;
  metrics: {
    likes: number;
    reposts: number;
    replies: number;
    quotes: number;
    bookmarks: number;
    views: number;
  };
  media: string[]; // 'photo' | 'video' | 'animated_gif'
  isReply: boolean;
  quotedText?: string;
  author: SocialDataProfile;
}

/** Fetch one post by id, with its author's profile (one request). */
export async function fetchTweetById(
  id: string
): Promise<{ post?: SocialDataPost; status: number; error?: string }> {
  try {
    const response = await socialDataFetch(`/twitter/tweets/${encodeURIComponent(id)}`);
    console.log(`[SOCIALDATA] tweet ${id} -> ${response.status}`);
    if (!response.ok) {
      if (response.status === 404 || response.status === 400)
        return { status: 404, error: 'Post not found' };
      return { status: response.status, error: `SocialData error (${response.status})` };
    }
    const d = (await response.json()) as Record<string, unknown>;
    const u = (d.user || {}) as Record<string, unknown>;
    if (!d.id_str || !u.id_str) return { status: 404, error: 'Post not found' };

    const ents = (d.extended_entities || d.entities || {}) as { media?: { type?: string }[] };
    const quoted = d.quoted_status as Record<string, unknown> | null | undefined;
    return {
      status: 200,
      post: {
        id: String(d.id_str),
        text: String(d.full_text || d.text || ''),
        createdAt: String(d.tweet_created_at || d.created_at || ''),
        metrics: {
          likes: Number(d.favorite_count) || 0,
          reposts: Number(d.retweet_count) || 0,
          replies: Number(d.reply_count) || 0,
          quotes: Number(d.quote_count) || 0,
          bookmarks: Number(d.bookmark_count) || 0,
          views: Number(d.views_count) || 0,
        },
        media: (ents.media || []).map((m) => m.type || 'photo'),
        isReply: !!d.in_reply_to_status_id_str,
        quotedText: quoted ? String(quoted.full_text || quoted.text || '') : undefined,
        author: {
          id: String(u.id_str),
          name: String(u.name || ''),
          username: String(u.screen_name || ''),
          description: String(u.description || ''),
          profile_image_url: String(u.profile_image_url_https || '').replace('_normal', '_400x400'),
          public_metrics: {
            followers_count: Number(u.followers_count) || 0,
            following_count: Number(u.friends_count) || 0,
            tweet_count: Number(u.statuses_count) || 0,
            listed_count: Number(u.listed_count) || 0,
          },
          created_at: String(u.created_at || ''),
          verified: !!(u.verified || u.is_blue_verified),
          location: (u.location as string) || undefined,
          url: (u.url as string) || undefined,
          protected: !!u.protected,
        },
      },
    };
  } catch (error) {
    console.error('[SOCIALDATA] Tweet fetch error:', error);
    return { status: 500, error: 'SocialData request failed' };
  }
}

/**
 * Fetch tweets by username (resolves user ID first via profile lookup).
 */
export async function fetchTweetsByUsername(
  username: string,
  maxResults: number = 20
): Promise<{ tweets: SocialDataTweet[]; userId?: string; error?: string }> {
  // First get user ID from profile
  const profileResult = await fetchProfile(username);
  if (!profileResult.profile) {
    return { tweets: [], error: profileResult.error || 'User not found' };
  }

  const result = await fetchUserTweets(profileResult.profile.id, maxResults);
  return { ...result, userId: profileResult.profile.id };
}

// ---------------------------------------------------------------------------
// Tweet Search
// ---------------------------------------------------------------------------

export interface SocialDataSearchResult extends SocialDataTweet {
  author_id?: string;
  author_username?: string;
}

/**
 * Search recent tweets via SocialData.
 */
export async function searchTweets(
  query: string,
  maxResults: number = 20
): Promise<SocialDataSearchResult[]> {
  try {
    const params = new URLSearchParams({
      query,
      type: 'Latest',
    });

    const response = await socialDataFetch(`/twitter/search?${params}`);
    console.log(`[SOCIALDATA] search "${query.slice(0, 40)}" -> ${response.status}`);

    if (!response.ok) {
      console.error(`[SOCIALDATA ERROR] search ${response.status}`);
      return [];
    }

    const data = await response.json();
    const rawTweets: Record<string, unknown>[] = data.tweets || data || [];

    if (!Array.isArray(rawTweets)) return [];

    return rawTweets.slice(0, maxResults).map((raw) => {
      const tweet = mapTweet(raw);
      const user = raw.user as Record<string, unknown> | undefined;
      return {
        ...tweet,
        author_id: user ? (user.id_str as string) || String(user.id || '') : undefined,
        author_username: user ? (user.screen_name as string) : undefined,
      };
    });
  } catch (error) {
    console.error('[SOCIALDATA] Search error:', error);
    return [];
  }
}

/**
 * Check if SocialData is configured and available.
 */
export function isSocialDataConfigured(): boolean {
  return !!process.env.SOCIALDATA_API_KEY;
}

// ---------------------------------------------------------------------------
// Post audience (growth dashboard, migration 041)
// ---------------------------------------------------------------------------

export interface AudiencePerson {
  handle: string;
  name: string;
  followers: number;
  at: string; // ISO time of the interaction (reposts: when we saw it)
}

const HANDLE_OK = /^[A-Za-z0-9_]{1,15}$/;

function person(u: Record<string, unknown> | undefined, at: string): AudiencePerson | null {
  const handle = String(u?.screen_name ?? '');
  if (!HANDLE_OK.test(handle)) return null;
  return {
    handle,
    name: String(u?.name ?? '').slice(0, 80),
    followers: Number(u?.followers_count) || 0,
    at,
  };
}

async function listOf(path: string, key: 'tweets' | 'users'): Promise<Record<string, unknown>[]> {
  try {
    const res = await socialDataFetch(path);
    if (!res.ok) {
      console.error(`[SOCIALDATA ERROR] ${path.split('?')[0]} ${res.status}`);
      return [];
    }
    const data = await res.json();
    const list = data[key];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('[SOCIALDATA] audience fetch failed', e);
    return [];
  }
}

/** People who replied to a post (one page, ~10–20), excluding the author's own replies. */
export async function fetchRepliers(
  tweetId: string,
  authorHandle: string
): Promise<AudiencePerson[]> {
  const q = new URLSearchParams({ query: `conversation_id:${tweetId}`, type: 'Latest' });
  const tweets = await listOf(`/twitter/search?${q}`, 'tweets');
  const self = authorHandle.toLowerCase();
  return tweets
    .map((t) =>
      person(
        t.user as Record<string, unknown> | undefined,
        String(t.tweet_created_at || t.created_at || new Date().toISOString())
      )
    )
    .filter((p): p is AudiencePerson => !!p && p.handle.toLowerCase() !== self);
}

/** People who reposted a post (one page). */
export async function fetchReposters(tweetId: string): Promise<AudiencePerson[]> {
  const now = new Date().toISOString();
  const users = await listOf(
    `/twitter/tweets/${encodeURIComponent(tweetId)}/retweeted_by`,
    'users'
  );
  return users.map((u) => person(u, now)).filter((p): p is AudiencePerson => !!p);
}

/** People who quoted a post (one page). */
export async function fetchQuoters(tweetId: string): Promise<AudiencePerson[]> {
  const tweets = await listOf(`/twitter/tweets/${encodeURIComponent(tweetId)}/quotes`, 'tweets');
  return tweets
    .map((t) =>
      person(
        t.user as Record<string, unknown> | undefined,
        String(t.tweet_created_at || t.created_at || new Date().toISOString())
      )
    )
    .filter((p): p is AudiencePerson => !!p);
}

// ---------------------------------------------------------------------------
// Account details for the bot check (/bots)
// ---------------------------------------------------------------------------

/** The public account fields the bot check reads (followers, engagers). */
export interface XAccount {
  id: string;
  handle: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  createdAt: string;
  defaultAvatar: boolean;
}

function xAccount(u: Record<string, unknown> | undefined): XAccount | null {
  const handle = String(u?.screen_name ?? '');
  const id = String(u?.id_str ?? '');
  if (!HANDLE_OK.test(handle) || !/^\d{1,25}$/.test(id)) return null;
  const avatar = String(u?.profile_image_url_https ?? u?.profile_image_url ?? '');
  return {
    id,
    handle,
    name: String(u?.name ?? '').slice(0, 80),
    bio: String(u?.description ?? '').slice(0, 300),
    followers: Number(u?.followers_count) || 0,
    following: Number(u?.friends_count) || 0,
    posts: Number(u?.statuses_count) || 0,
    likes: Number(u?.favourites_count) || 0,
    createdAt: String(u?.created_at ?? ''),
    defaultAvatar: !avatar || avatar.includes('default_profile'),
  };
}

/**
 * An account's newest followers, newest first: up to `maxAccounts`, reading
 * at most `maxPages` pages. Returns what it got if a later page fails.
 */
export async function fetchFollowerAccounts(
  userId: string,
  maxAccounts = 200,
  maxPages = 10
): Promise<{ accounts: XAccount[]; requests: number; failed: boolean }> {
  const out: XAccount[] = [];
  const seen = new Set<string>();
  let cursor = '';
  let requests = 0;
  let failed = false;
  for (let page = 0; page < maxPages && out.length < maxAccounts; page++) {
    const q = new URLSearchParams({ user_id: userId });
    if (cursor) q.set('cursor', cursor);
    requests++;
    let data: { users?: unknown; next_cursor?: unknown };
    try {
      const res = await socialDataFetch(`/twitter/followers/list?${q}`);
      if (!res.ok) {
        console.error(`[SOCIALDATA ERROR] followers ${res.status}`);
        failed = true;
        break;
      }
      data = await res.json();
    } catch (e) {
      console.error('[SOCIALDATA] followers fetch failed', e);
      failed = true;
      break;
    }
    const users = Array.isArray(data.users) ? (data.users as Record<string, unknown>[]) : [];
    for (const u of users) {
      const a = xAccount(u);
      if (a && !seen.has(a.id)) {
        seen.add(a.id);
        out.push(a);
      }
    }
    cursor = typeof data.next_cursor === 'string' ? data.next_cursor : '';
    if (!cursor || cursor === '0' || users.length === 0) break;
  }
  return { accounts: out.slice(0, maxAccounts), requests, failed };
}

/**
 * Everyone who replied to, reposted or quoted a post (one page each),
 * excluding the author. Three requests. `failed` when any of them errored
 * (so callers can tell "nobody engaged" from "couldn't read it").
 */
export async function fetchEngagerAccounts(
  tweetId: string,
  authorHandle: string
): Promise<{ accounts: XAccount[]; failed: boolean }> {
  let failed = false;
  const get = async (path: string, key: 'tweets' | 'users') => {
    try {
      const res = await socialDataFetch(path);
      if (!res.ok) {
        console.error(`[SOCIALDATA ERROR] ${path.split('?')[0]} ${res.status}`);
        failed = true;
        return [];
      }
      const list = (await res.json())[key];
      return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
    } catch (e) {
      console.error('[SOCIALDATA] engager fetch failed', e);
      failed = true;
      return [];
    }
  };
  const q = new URLSearchParams({ query: `conversation_id:${tweetId}`, type: 'Latest' });
  const [replies, reposts, quotes] = await Promise.all([
    get(`/twitter/search?${q}`, 'tweets'),
    get(`/twitter/tweets/${encodeURIComponent(tweetId)}/retweeted_by`, 'users'),
    get(`/twitter/tweets/${encodeURIComponent(tweetId)}/quotes`, 'tweets'),
  ]);
  const self = authorHandle.toLowerCase();
  const accounts = [
    ...replies.map((t) => xAccount(t.user as Record<string, unknown> | undefined)),
    ...reposts.map((u) => xAccount(u)),
    ...quotes.map((t) => xAccount(t.user as Record<string, unknown> | undefined)),
  ].filter((a): a is XAccount => !!a && a.handle.toLowerCase() !== self);
  return { accounts, failed };
}

// ---------------------------------------------------------------------------
// People to know (migration 053): niche creators a member could reach out to
// ---------------------------------------------------------------------------

export interface NicheAccount extends XAccount {
  /** X says this account accepts DMs from anyone. */
  canDm: boolean;
  avatarUrl: string | null;
}

function nicheAccount(u: Record<string, unknown> | undefined): NicheAccount | null {
  const a = xAccount(u);
  if (!a) return null;
  const avatar = String(u?.profile_image_url_https ?? '');
  return {
    ...a,
    canDm: u?.can_dm === true,
    avatarUrl: avatar.startsWith('https://pbs.twimg.com/')
      ? avatar.replace('_normal', '_200x200')
      : null,
  };
}

/** X's "similar accounts" for a user id (about 10). [] on any failure. */
export async function fetchSimilarAccounts(userId: string): Promise<NicheAccount[]> {
  if (!/^\d{1,25}$/.test(userId)) return [];
  try {
    const res = await socialDataFetch(`/twitter/user/${userId}/similar`);
    console.log(`[SOCIALDATA] similar ${userId} -> ${res.status}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { users?: Record<string, unknown>[] };
    return (data.users ?? []).map(nicheAccount).filter((a): a is NicheAccount => !!a);
  } catch (error) {
    console.error('[SOCIALDATA] similar error:', error);
    return [];
  }
}

/** Authors of the top recent posts for a search query (original posts only). [] on failure. */
export async function fetchSearchAuthors(query: string): Promise<NicheAccount[]> {
  try {
    const params = new URLSearchParams({ query, type: 'Top' });
    const res = await socialDataFetch(`/twitter/search?${params}`);
    console.log(`[SOCIALDATA] search authors "${query.slice(0, 40)}" -> ${res.status}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { tweets?: Record<string, unknown>[] };
    const seen = new Set<string>();
    const out: NicheAccount[] = [];
    for (const t of data.tweets ?? []) {
      const a = nicheAccount(t.user as Record<string, unknown> | undefined);
      if (!a || seen.has(a.handle.toLowerCase())) continue;
      seen.add(a.handle.toLowerCase());
      out.push(a);
    }
    return out;
  } catch (error) {
    console.error('[SOCIALDATA] search authors error:', error);
    return [];
  }
}
