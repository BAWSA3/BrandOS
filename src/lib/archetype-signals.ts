/**
 * Archetype Signal Detection Engine
 *
 * Analyzes tweet content and profile data for archetype-specific patterns.
 * Returns scored rankings that guide and validate Gemini's classification.
 */

export interface SignalScore {
  archetype: string;
  score: number;       // 0-100
  signals: string[];   // matched signals for debugging
  confidence: 'high' | 'medium' | 'low';
}

interface ProfileData {
  name: string;
  username: string;
  description?: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified?: boolean;
}

// =============================================================================
// Signal Definitions
// =============================================================================

interface ArchetypeSignalDef {
  archetype: string;
  keywords: string[];
  phrases: string[];
  bioKeywords: string[];
  // Custom scoring functions
  tweetScorer?: (tweets: string[]) => { score: number; signals: string[] };
  profileScorer?: (profile: ProfileData) => { score: number; signals: string[] };
}

const SIGNAL_DEFS: ArchetypeSignalDef[] = [
  {
    archetype: 'BUILD.EXE',
    keywords: [
      'shipped', 'shipping', 'launching', 'launched', 'deployed', 'deploy',
      'built', 'building', 'build', 'live', 'demo', 'release', 'released',
      'update', 'progress', 'milestone', 'commit', 'pushed', 'merged',
      'v1', 'v2', 'beta', 'alpha', 'open source', 'repo', 'feature',
      'bug fix', 'sprint', 'mvp', 'prototype', 'product', 'startup',
      'founded', 'cofounded', 'dev', 'code', 'coding', 'program',
    ],
    phrases: [
      'just shipped', "it's live", 'building in public', "here's what i built",
      'progress update', 'dev log', 'working on', 'new feature', 'just launched',
      'check it out', 'side project', 'open sourced', 'pushed to prod',
      'build in public', 'we just', 'now live', 'just dropped', 'sneak peek',
    ],
    bioKeywords: [
      'founder', 'builder', 'maker', 'developer', 'engineer', 'ceo', 'cto',
      'coo', 'cofounder', 'co-founder', 'dev', 'hacker', 'indie',
      'building', 'shipping', 'creating',
    ],
    tweetScorer: (tweets) => {
      let score = 0;
      const signals: string[] = [];
      const shipEmoji = tweets.filter(t => t.includes('🚢') || t.includes('🔨') || t.includes('⚡') || t.includes('🛠')).length;
      if (shipEmoji > 2) { score += 10; signals.push(`${shipEmoji} builder emojis`); }
      // Links to products/demos
      const linkTweets = tweets.filter(t => t.match(/https?:\/\//i) && (t.match(/launch|ship|live|demo|check out/i))).length;
      if (linkTweets > 2) { score += 15; signals.push(`${linkTweets} launch/demo links`); }
      return { score, signals };
    },
  },
  {
    archetype: 'FREQ',
    keywords: [
      'lmao', 'lmfao', 'lol', 'ratio', 'ngl', 'fr', 'ong', 'lowkey',
      'highkey', 'based', 'cope', 'seethe', 'mid', 'goated', 'bussin',
      'bruh', 'bro', 'fam', 'vibes', 'w', 'massive w', 'huge w',
      'respectfully', 'no cap', 'deadass', 'sus', 'sheesh',
    ],
    phrases: [
      "what's your", 'name a', 'unpopular opinion', 'hot take', 'wrong answers only',
      'this is the way', 'who else', 'am i the only', 'let that sink in',
      'say it louder', 'ratio this', 'gm', 'gn', 'good morning',
    ],
    bioKeywords: [
      'shitposter', 'memer', 'entertainer', 'vibes', 'culture',
    ],
    tweetScorer: (tweets) => {
      let score = 0;
      const signals: string[] = [];
      // Short tweets = engagement/shitposting style
      const shortTweets = tweets.filter(t => t.length < 60).length;
      const shortRatio = shortTweets / Math.max(tweets.length, 1);
      if (shortRatio > 0.5) { score += 20; signals.push(`${Math.round(shortRatio * 100)}% short posts`); }
      // High emoji usage
      const emojiTweets = tweets.filter(t => t.match(/[\u{1F300}-\u{1F9FF}]/u)).length;
      const emojiRatio = emojiTweets / Math.max(tweets.length, 1);
      if (emojiRatio > 0.4) { score += 10; signals.push(`${Math.round(emojiRatio * 100)}% emoji usage`); }
      // Question tweets (engagement bait)
      const questionTweets = tweets.filter(t => t.includes('?') && t.length < 120).length;
      if (questionTweets > 5) { score += 10; signals.push(`${questionTweets} question/engagement tweets`); }
      return { score, signals };
    },
    profileScorer: (profile) => {
      let score = 0;
      const signals: string[] = [];
      // Very high tweet count relative to followers = high-volume poster
      const tweetToFollowerRatio = profile.public_metrics.tweet_count / Math.max(profile.public_metrics.followers_count, 1);
      if (tweetToFollowerRatio > 3) { score += 15; signals.push(`high post volume (${tweetToFollowerRatio.toFixed(1)}x follower count)`); }
      return { score, signals };
    },
  },
  {
    archetype: 'SOURCE',
    keywords: [
      'thread', 'guide', 'explained', 'breakdown', 'deep dive', 'analysis',
      'framework', 'how to', 'step by step', 'lesson', 'takeaway', 'insight',
      'research', 'data', 'study', 'case study', 'tutorial', 'resource',
      'tips', 'strategy', 'methodology', 'principle',
    ],
    phrases: [
      "here's what i learned", 'a thread', 'let me explain', 'here are',
      "here's how", 'the truth about', 'most people', "you need to know",
      'step 1', 'step 2', '1/', '2/', '3/', 'quick thread',
      "here's why", 'the key is', 'pro tip',
    ],
    bioKeywords: [
      'writer', 'researcher', 'analyst', 'educator', 'expert', 'author',
      'professor', 'teacher', 'consultant', 'advisor', 'strategist',
    ],
    tweetScorer: (tweets) => {
      let score = 0;
      const signals: string[] = [];
      // Long-form content
      const longTweets = tweets.filter(t => t.length > 200).length;
      const longRatio = longTweets / Math.max(tweets.length, 1);
      if (longRatio > 0.3) { score += 20; signals.push(`${Math.round(longRatio * 100)}% long-form posts`); }
      // Thread markers
      const threadTweets = tweets.filter(t => t.match(/🧵|\b\d+\/\d*\b|thread|a thread/i)).length;
      if (threadTweets > 2) { score += 15; signals.push(`${threadTweets} threads/thread markers`); }
      // Numbered lists
      const listTweets = tweets.filter(t => t.match(/^\d[\.\)]\s|^-\s|^•/m)).length;
      if (listTweets > 3) { score += 10; signals.push(`${listTweets} list-format posts`); }
      return { score, signals };
    },
  },
  {
    archetype: 'ENTROPY',
    keywords: [
      'degen', 'ape', 'bullish', 'bearish', 'moon', 'rekt', 'conviction',
      'alpha', 'bet', 'play', 'position', 'entry', 'target', 'pump',
      'dump', 'long', 'short', 'leverage', 'liquidated', 'chart',
      'candle', 'breakout', 'support', 'resistance',
    ],
    phrases: [
      'send it', 'called it', 'told you', 'not financial advice', 'nfa',
      'this is going to', 'mark my words', 'just bought', 'loading up',
      'full send', 'lfg', "let's go", 'we are so early', 'early',
    ],
    bioKeywords: [
      'trader', 'degen', 'speculator', 'gambler', 'risk', 'alpha',
      'chad', 'ape', 'ct',
    ],
    tweetScorer: (tweets) => {
      let score = 0;
      const signals: string[] = [];
      // ALL CAPS emphasis (aggressive/bold style)
      const capsWords = tweets.join(' ').match(/\b[A-Z]{3,}\b/g) || [];
      if (capsWords.length > 10) { score += 10; signals.push(`${capsWords.length} all-caps words (bold style)`); }
      // Price/ticker mentions
      const tickerTweets = tweets.filter(t => t.match(/\$[A-Z]{2,}/)).length;
      if (tickerTweets > 3) { score += 15; signals.push(`${tickerTweets} ticker mentions`); }
      return { score, signals };
    },
  },
  {
    archetype: 'NULL',
    keywords: [
      'anon', 'pseudonymous', 'thesis', 'contrarian', 'framework',
      'mental model', 'first principles', 'abstraction', 'philosophy',
      'epistemology', 'ontology', 'paradigm',
    ],
    phrases: [
      'the real question is', 'most people miss', 'think about it',
      'consider this', 'the signal is', 'beneath the surface',
      'what if', 'imagine a world',
    ],
    bioKeywords: [
      'anon', 'pseudonymous', 'thinker', 'philosopher', 'observer',
    ],
    profileScorer: (profile) => {
      let score = 0;
      const signals: string[] = [];
      // No real name / pseudonymous indicators
      const name = profile.name.toLowerCase();
      const username = profile.username.toLowerCase();
      if (name.includes('0x') || name.includes('anon') || username.includes('0x')) {
        score += 15; signals.push('pseudonymous name pattern');
      }
      // Low personal disclosure — short or abstract bio
      if (!profile.description || profile.description.length < 30) {
        score += 10; signals.push('minimal bio');
      }
      return { score, signals };
    },
    tweetScorer: (tweets) => {
      let score = 0;
      const signals: string[] = [];
      // Low self-reference (no "I", "my", "me" dominant)
      const selfRef = tweets.filter(t => t.match(/\b(I|my|me|I'm|I've)\b/g)?.length ?? 0 > 2).length;
      const selfRatio = selfRef / Math.max(tweets.length, 1);
      if (selfRatio < 0.2) { score += 10; signals.push('low self-reference (ideas-first)'); }
      return { score, signals };
    },
  },
  {
    archetype: 'RELAY',
    keywords: [
      'shoutout', 'introducing', 'check out', 'follow', 'must-follow',
      'underrated', 'discovered', 'featuring', 'collaboration', 'partnered',
      'collab', 'community', 'network', 'connect', 'signal boost',
    ],
    phrases: [
      's/o to', 'shout out to', 'go follow', 'check out @', 'thread of people',
      'accounts to follow', 'here are some', 'love what', 'big fan of',
      'have you seen', 'give them a follow', 'underrated account',
    ],
    bioKeywords: [
      'connector', 'community', 'curator', 'networker', 'ambassador',
      'advocate', 'evangelist',
    ],
    tweetScorer: (tweets) => {
      let score = 0;
      const signals: string[] = [];
      // High mention rate
      const mentionTweets = tweets.filter(t => (t.match(/@\w+/g) || []).length >= 1).length;
      const mentionRatio = mentionTweets / Math.max(tweets.length, 1);
      if (mentionRatio > 0.4) { score += 20; signals.push(`${Math.round(mentionRatio * 100)}% tweets mention others`); }
      // RT/amplification language
      const ampTweets = tweets.filter(t => t.match(/check out|follow|underrated|shoutout|s\/o/i)).length;
      if (ampTweets > 3) { score += 15; signals.push(`${ampTweets} amplification posts`); }
      return { score, signals };
    },
  },
  {
    archetype: 'FORESIGHT',
    keywords: [
      'prediction', 'future', 'trend', 'paradigm', 'shift', 'narrative',
      'macro', 'long-term', 'decade', 'revolution', 'disruption', 'cycle',
      'thesis', 'vision', 'inevitable', 'transformation',
    ],
    phrases: [
      "here's what's coming", 'in 5 years', 'in 10 years', 'the future of',
      'this will change', 'mark my words', 'i predicted', 'called it',
      'the next big', 'paradigm shift', 'we are witnessing', 'this changes everything',
      'most people aren\'t ready for', 'the world is moving toward',
    ],
    bioKeywords: [
      'thought leader', 'futurist', 'visionary', 'advisor', 'investor',
      'venture', 'vc', 'angel', 'partner',
    ],
    profileScorer: (profile) => {
      let score = 0;
      const signals: string[] = [];
      // High influence + thought leadership
      if (profile.public_metrics.followers_count > 100000) {
        score += 15; signals.push('high influence (100K+ followers)');
      }
      if (profile.public_metrics.listed_count > 1000) {
        score += 10; signals.push('highly curated (1K+ lists)');
      }
      return { score, signals };
    },
  },
  {
    archetype: 'ARC',
    keywords: [
      'journey', 'milestone', 'grateful', 'first', 'growth', 'started',
      'progress', 'learning', 'beginner', 'newbie', 'aspiring',
      'dream', 'goal', 'hustle', 'grind',
    ],
    phrases: [
      'year ago', 'day 1', 'week 1', 'month 1', 'just hit', 'finally reached',
      'i just', 'my first', 'a year ago i was', 'where i started',
      'documenting my', 'the journey', 'starting from scratch',
      'grateful for', 'thank you all',
    ],
    bioKeywords: [
      'aspiring', 'learning', 'growing', 'student', 'beginner',
      'up and coming',
    ],
    profileScorer: (profile) => {
      let score = 0;
      const signals: string[] = [];
      if (profile.public_metrics.followers_count < 5000) {
        score += 15; signals.push('early-stage follower count');
      }
      if (profile.public_metrics.followers_count < 1000) {
        score += 10; signals.push('very early (<1K followers)');
      }
      return { score, signals };
    },
  },
];

// =============================================================================
// Main Detection Function
// =============================================================================

export function detectArchetypeSignals(
  tweets: string[],
  profile: ProfileData
): SignalScore[] {
  const allText = tweets.join(' ').toLowerCase();
  const bio = (profile.description || '').toLowerCase();
  const totalTweets = Math.max(tweets.length, 1);

  const scores: SignalScore[] = SIGNAL_DEFS.map((def) => {
    let score = 0;
    const signals: string[] = [];

    // 1. Keyword matching (max 35 points)
    let keywordHits = 0;
    for (const kw of def.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = allText.match(regex);
      if (matches) keywordHits += matches.length;
    }
    const keywordScore = Math.min(35, Math.round((keywordHits / totalTweets) * 50));
    if (keywordScore > 0) {
      score += keywordScore;
      signals.push(`${keywordHits} keyword matches`);
    }

    // 2. Phrase matching (max 25 points)
    let phraseHits = 0;
    for (const phrase of def.phrases) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = allText.match(regex);
      if (matches) phraseHits += matches.length;
    }
    const phraseScore = Math.min(25, phraseHits * 5);
    if (phraseScore > 0) {
      score += phraseScore;
      signals.push(`${phraseHits} phrase matches`);
    }

    // 3. Bio keyword matching (max 15 points)
    let bioHits = 0;
    for (const bk of def.bioKeywords) {
      if (bio.includes(bk)) bioHits++;
    }
    const bioScore = Math.min(15, bioHits * 5);
    if (bioScore > 0) {
      score += bioScore;
      signals.push(`${bioHits} bio signals`);
    }

    // 4. Custom tweet scorer (max 25 points from custom)
    if (def.tweetScorer) {
      const custom = def.tweetScorer(tweets);
      score += Math.min(25, custom.score);
      signals.push(...custom.signals);
    }

    // 5. Custom profile scorer
    if (def.profileScorer) {
      const custom = def.profileScorer(profile);
      score += custom.score;
      signals.push(...custom.signals);
    }

    // Cap at 100
    score = Math.min(100, score);

    const confidence: SignalScore['confidence'] =
      score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

    return {
      archetype: def.archetype,
      score,
      signals: signals.filter(Boolean),
      confidence,
    };
  });

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}
