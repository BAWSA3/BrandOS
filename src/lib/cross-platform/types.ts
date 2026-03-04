// =============================================================================
// CROSS-PLATFORM BRAND CONSISTENCY ENGINE — Core Types
// =============================================================================

// Supported social platforms
export type SocialPlatform =
  | 'x'
  | 'linkedin'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'threads';

// All content types across platforms
export type CrossPlatformContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'carousel'
  | 'story'
  | 'reel'
  | 'thread'
  | 'article'
  | 'short'
  | 'poll';

// Unified content model — every piece of content from any platform
export interface ContentItem {
  id: string;
  platform: SocialPlatform;
  contentType: CrossPlatformContentType;
  textContent?: string;
  transcript?: string;
  mediaUrls?: string[];
  metadata: ContentMetadata;
  rawData?: Record<string, unknown>;
}

export interface ContentMetadata {
  postedAt: string;
  engagement: EngagementMetrics;
  hashtags: string[];
  mentions: string[];
  url?: string;
  authorUsername?: string;
  authorDisplayName?: string;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  saves?: number;
  clicks?: number;
}

// Platform connection for OAuth-based integrations
export interface PlatformConnection {
  id: string;
  platform: SocialPlatform;
  platformUserId: string;
  platformUsername: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  scopes: string[];
  profileData?: Record<string, unknown>;
  connectedAt: string;
  lastSyncAt?: string;
}

// Platform-specific norms for scoring context
export interface PlatformNorms {
  platform: SocialPlatform;
  expectedFormality: number;
  expectedLength: { min: number; max: number };
  hashtagNorms: 'none' | 'minimal' | 'moderate' | 'heavy';
  emojiNorms: 'none' | 'rare' | 'moderate' | 'heavy';
  contentTypes: CrossPlatformContentType[];
  description: string;
}

export const PLATFORM_NORMS: Record<SocialPlatform, PlatformNorms> = {
  x: {
    platform: 'x',
    expectedFormality: 30,
    expectedLength: { min: 10, max: 280 },
    hashtagNorms: 'minimal',
    emojiNorms: 'moderate',
    contentTypes: ['text', 'image', 'video', 'thread', 'poll'],
    description: 'Conversational, concise, personality-driven. Threads for depth.',
  },
  linkedin: {
    platform: 'linkedin',
    expectedFormality: 70,
    expectedLength: { min: 50, max: 3000 },
    hashtagNorms: 'moderate',
    emojiNorms: 'rare',
    contentTypes: ['text', 'image', 'video', 'article', 'carousel', 'poll'],
    description: 'Professional, thought leadership, industry insights. Longer-form accepted.',
  },
  instagram: {
    platform: 'instagram',
    expectedFormality: 25,
    expectedLength: { min: 10, max: 2200 },
    hashtagNorms: 'heavy',
    emojiNorms: 'heavy',
    contentTypes: ['image', 'carousel', 'reel', 'story', 'video'],
    description: 'Visual-first, caption-driven, hashtag-rich. Stories for ephemeral content.',
  },
  youtube: {
    platform: 'youtube',
    expectedFormality: 50,
    expectedLength: { min: 100, max: 5000 },
    hashtagNorms: 'minimal',
    emojiNorms: 'moderate',
    contentTypes: ['video', 'short', 'text'],
    description: 'Long-form video, detailed descriptions, SEO-optimized titles.',
  },
  tiktok: {
    platform: 'tiktok',
    expectedFormality: 15,
    expectedLength: { min: 5, max: 300 },
    hashtagNorms: 'heavy',
    emojiNorms: 'heavy',
    contentTypes: ['video', 'image', 'carousel'],
    description: 'Ultra-casual, trend-driven, hook-first short-form video.',
  },
  threads: {
    platform: 'threads',
    expectedFormality: 35,
    expectedLength: { min: 10, max: 500 },
    hashtagNorms: 'minimal',
    emojiNorms: 'moderate',
    contentTypes: ['text', 'image', 'video', 'carousel'],
    description: 'Conversational, text-first, similar to X but more personal.',
  },
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  threads: 'Threads',
};

// Visual brand DNA extension
export interface VisualDNA {
  logoUsageRules: string[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    tolerancePercent: number;
  };
  typography: {
    headingFont?: string;
    bodyFont?: string;
    style: 'serif' | 'sans-serif' | 'monospace' | 'mixed';
  };
  imageStyle: 'photography' | 'illustration' | 'flat-design' | 'mixed' | 'minimal';
  filterPreset?: string;
  moodKeywords: string[];
}

// Cross-platform brand consistency score
export interface CrossPlatformScore {
  overallScore: number;
  perPlatform: Record<SocialPlatform, PlatformBrandScore>;
  crossPlatformConsistency: number;
  dimensions: {
    voiceConsistency: number;
    visualConsistency: number;
    contentThemeAlignment: number;
    postingCadenceHealth: number;
  };
  drift: {
    direction: 'stable' | 'drifting' | 'evolving';
    worstPlatform?: SocialPlatform;
    explanation: string;
  };
  computedAt: string;
}

export interface PlatformBrandScore {
  platform: SocialPlatform;
  connected: boolean;
  contentCount: number;
  voiceScore: number;
  visualScore: number;
  themeScore: number;
  overallScore: number;
  lastAnalyzedAt?: string;
}

// Transcript extraction result
export interface TranscriptResult {
  text: string;
  language: string;
  duration: number;
  segments?: TranscriptSegment[];
  source: 'youtube-captions' | 'whisper' | 'deepgram' | 'assemblyai' | 'manual';
  confidence: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

// Pre-publish check result
export interface PrePublishCheck {
  platform: SocialPlatform;
  contentType: CrossPlatformContentType;
  overallScore: number;
  voiceAlignment: number;
  toneCheck: {
    score: number;
    feedback: string;
  };
  visualCheck?: {
    score: number;
    feedback: string;
  };
  platformBestPractices: {
    score: number;
    suggestions: string[];
  };
  issues: {
    severity: 'info' | 'warning' | 'critical';
    message: string;
    suggestion?: string;
  }[];
  suggestedRewrite?: string;
}

// Team & agency types
export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface ApprovalWorkflow {
  id: string;
  brandId: string;
  contentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submittedBy: string;
  reviewedBy?: string;
  brandCheckScore?: number;
  feedback?: string;
  createdAt: string;
  resolvedAt?: string;
}
