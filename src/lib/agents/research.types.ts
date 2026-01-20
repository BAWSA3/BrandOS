// ===== RESEARCH AGENT - TYPE DEFINITIONS =====

import { Platform, ContentType } from '@/lib/types';

// ===== VERTICALS & SOURCES =====

export type TCGVertical =
  | 'pokemon'
  | 'mtg'
  | 'yugioh'
  | 'sports-cards'
  | 'collectibles';

export type ResearchSource =
  | 'twitter'
  | 'reddit'
  | 'youtube'
  | 'serper';

export type TopicCategory =
  | 'news'
  | 'trend'
  | 'controversy'
  | 'product-launch'
  | 'price-alert'
  | 'community'
  | 'tournament';

export type EngagementLevel = 'low' | 'medium' | 'high' | 'viral';

export type TrendingPeriod = 'last-24h' | 'last-week' | 'last-month';

// ===== VERTICAL CONFIGURATION =====

export interface VerticalConfig {
  name: string;
  hashtags: string[];
  subreddits: string[];
  youtubeChannels: string[];
  keywords: string[];
  influencers: string[];
}

export const VERTICAL_CONFIGS: Record<TCGVertical, VerticalConfig> = {
  pokemon: {
    name: 'Pokemon TCG',
    hashtags: ['#PokemonTCG', '#PokemonCards', '#PTCG', '#PokemonPulls', '#Pokemon'],
    subreddits: ['pokemontcg', 'PokemonTCG', 'PKMNTCGDeals', 'pkmntcgcollections'],
    youtubeChannels: ['leonhart', 'pokereview', 'unlisted leaf', 'pokerev'],
    keywords: ['PSA', 'Charizard', 'booster box', 'ETB', 'chase card', 'graded', 'vintage', 'WOTC'],
    influencers: ['leonhartimern', 'pokeinvesting', 'pokebeach'],
  },
  mtg: {
    name: 'Magic: The Gathering',
    hashtags: ['#MTG', '#MagicTheGathering', '#MTGFinance', '#MTGCommunity'],
    subreddits: ['mtgfinance', 'magicTCG', 'ModernMagic', 'EDH', 'mtg'],
    youtubeChannels: ['tolarian community college', 'mtggoldfish', 'the command zone'],
    keywords: ['reserved list', 'Modern', 'Standard', 'Commander', 'fetch lands', 'proxy', 'reprint'],
    influencers: ['mtggoldfish', 'loadingreadyrun', 'commanderin'],
  },
  yugioh: {
    name: 'Yu-Gi-Oh!',
    hashtags: ['#YuGiOh', '#Yugioh', '#YGO', '#YuGiOhTCG'],
    subreddits: ['yugioh', 'YuGiOhMasterDuel', 'yugiohshowcase'],
    youtubeChannels: ['cimooooo', 'dzeeff', 'teamsamuraix1'],
    keywords: ['meta', 'ban list', 'Master Duel', 'OCG', 'TCG', 'ghost rare', 'starlight'],
    influencers: ['officialyugioh', 'ygorganization'],
  },
  'sports-cards': {
    name: 'Sports Cards',
    hashtags: ['#SportsCards', '#TheHobby', '#WaxRip', '#CardBreaks', '#Topps', '#Panini'],
    subreddits: ['basketballcards', 'baseballcards', 'footballcards', 'sportscards'],
    youtubeChannels: ['jabs family', 'layton sports cards', 'whatnot'],
    keywords: ['PSA', 'BGS', 'rookie card', 'auto', 'patch', '1/1', 'case hit', 'break'],
    influencers: ['cardpurchaser', 'sportscardsradio'],
  },
  collectibles: {
    name: 'Other Collectibles',
    hashtags: ['#Funko', '#FunkoPop', '#Comics', '#Collectibles', '#Grails'],
    subreddits: ['funkopop', 'comicbookcollecting', 'VinylCollectors', 'ActionFigures'],
    youtubeChannels: ['top pops', 'comic tom', 'toy galaxy'],
    keywords: ['chase', 'exclusive', 'convention', 'grail', 'CGC', 'CBCS', 'first appearance'],
    influencers: ['originalfunko', 'funkopopsnews'],
  },
};

// ===== SOURCE DATA TYPES =====

export interface SourceReference {
  source: ResearchSource;
  url?: string;
  author?: string;
  publishedAt?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  snippet?: string;
}

export interface TwitterPost {
  id: string;
  text: string;
  authorUsername: string;
  authorName: string;
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    impressions?: number;
  };
  hashtags: string[];
  urls: string[];
}

export interface RedditPost {
  id: string;
  title: string;
  selftext?: string;
  author: string;
  subreddit: string;
  createdAt: string;
  score: number;
  numComments: number;
  url: string;
  permalink: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
}

// ===== AGGREGATED DATA =====

export interface RawSourceData {
  twitter?: TwitterPost[];
  reddit?: RedditPost[];
  youtube?: YouTubeVideo[];
  serper?: SerperResult[];
  fetchedAt: string;
  errors?: { source: ResearchSource; error: string }[];
}

// ===== RESEARCH TOPIC =====

export interface ResearchTopic {
  id: string;
  title: string;
  summary: string;
  vertical: TCGVertical;
  category: TopicCategory;
  relevanceScore: number; // 0-100
  sentimentScore?: number; // -100 to 100
  engagementLevel?: EngagementLevel;

  // Source data
  sources: SourceReference[];
  keywords: string[];
  hashtags?: string[];
  mentions?: string[];

  // Timing
  trendingPeriod?: TrendingPeriod;
  firstSeen: string;
  lastUpdated: string;

  // Content suggestions
  contentAngles?: string[];
  suggestedPlatforms?: Platform[];
}

// ===== RESEARCH REQUEST/RESPONSE =====

export interface ResearchOptions {
  verticals?: TCGVertical[];
  sources?: ResearchSource[];
  timeRange?: TrendingPeriod;
  limit?: number;
  minRelevance?: number;
}

export interface ResearchFilters {
  vertical?: TCGVertical;
  category?: TopicCategory;
  minRelevance?: number;
  engagementLevel?: EngagementLevel;
}

export interface ResearchBrief {
  topics: ResearchTopic[];
  summary: string;
  trendingKeywords: string[];
  verticalSummaries: Record<TCGVertical, string>;
  aggregatedAt: string;
}

export interface ResearchRunStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  verticals: TCGVertical[];
  sources: ResearchSource[];
  startedAt: string;
  completedAt?: string;
  topicsFound: number;
  error?: string;
}

// ===== TOPIC SELECTION =====

export interface TopicSelection {
  topicId: string;
  topic: ResearchTopic;
  contentTypes: ContentType[];
  status: 'selected' | 'in-progress' | 'content-generated' | 'dismissed';
  selectedAt: string;
  generatedCount: number;
}

// ===== CONTENT BRIEF FROM RESEARCH =====

export interface ResearchContentBrief {
  topic: ResearchTopic;
  contentType: ContentType;
  platform: Platform;
  angle: string;
  keyPoints: string[];
  sourcesToCite: SourceReference[];
  suggestedHashtags: string[];
  tone?: string;
}

// ===== SOURCE STATUS =====

export interface SourceStatus {
  source: ResearchSource;
  enabled: boolean;
  apiStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastChecked?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: string;
}

// ===== API TYPES =====

export type ResearchAction =
  | 'aggregate'
  | 'summarize'
  | 'get-topics'
  | 'select-topics'
  | 'generate-briefs';

export interface ResearchRequest {
  action: ResearchAction;
  params: {
    // For aggregate
    verticals?: TCGVertical[];
    sources?: ResearchSource[];
    timeRange?: TrendingPeriod;

    // For get-topics
    filters?: ResearchFilters;
    limit?: number;

    // For select-topics
    topicIds?: string[];
    contentTypes?: ContentType[];

    // For generate-briefs
    selections?: TopicSelection[];
    platforms?: Platform[];
  };
}

export interface ResearchResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
}
