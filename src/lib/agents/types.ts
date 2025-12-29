// ===== BRANDOS PRODUCT AGENTS - TYPE DEFINITIONS =====

import { BrandDNA, ContentType, Platform } from '@/lib/types';

// ===== AGENT SYSTEM TYPES =====

export type AgentName = 'campaign' | 'content' | 'analytics';

export interface AgentContext {
  brandDNA: BrandDNA;
  userId?: string;
  sessionId?: string;
}

export interface AgentResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  confidence: number;
  processingTime: number;
}

// ===== CAMPAIGN AGENT TYPES =====

export type CampaignObjective = 'awareness' | 'engagement' | 'conversion' | 'retention';
export type BudgetLevel = 'minimal' | 'moderate' | 'significant';

export interface CampaignBrief {
  idea: string;
  objective?: CampaignObjective;
  targetAudience?: string;
  timeline?: string;
  channels?: Platform[];
  budget?: BudgetLevel;
}

export interface CampaignObjectives {
  primary: string;
  secondary: string[];
  metrics: { name: string; target: string }[];
}

export interface AudienceSegment {
  description: string;
  painPoints: string[];
}

export interface CampaignPhase {
  name: string;
  duration: string;
  goal: string;
  tactics: string[];
  contentPieces: {
    platform: Platform;
    type: ContentType;
    description: string;
  }[];
}

export interface CalendarItem {
  day: string;
  platform: Platform;
  contentType: string;
  description: string;
  status: 'planned' | 'draft' | 'ready' | 'published';
}

export interface ContentCalendarWeek {
  week: number;
  items: CalendarItem[];
}

export interface SuccessMetric {
  metric: string;
  target: string;
  measurement: string;
}

export interface CampaignPlan {
  name: string;
  summary: string;
  objectives: CampaignObjectives;
  targetAudience: {
    primary: AudienceSegment;
    secondary?: AudienceSegment;
  };
  keyMessages: {
    primary: string;
    supporting: string[];
  };
  phases: CampaignPhase[];
  contentCalendar: ContentCalendarWeek[];
  successMetrics: SuccessMetric[];
}

// ===== CONTENT AGENT TYPES =====

export type ContentTone = 'default' | 'energetic' | 'professional' | 'casual';
export type ContentLength = 'short' | 'medium' | 'long';

export interface ContentBrief {
  type: ContentType;
  platform: Platform;
  topic: string;
  keyMessage?: string;
  cta?: string;
  tone?: ContentTone;
  length?: ContentLength;
  includeHashtags?: boolean;
  campaignContext?: string;
}

export interface PostingNotes {
  bestTime?: string;
  mediaNeeded?: string[];
  ctaTracking?: string;
}

export interface GeneratedContent {
  platform: Platform;
  contentType: ContentType;
  content: string;
  variations?: string[];
  hashtags?: string[];
  postingNotes: PostingNotes;
  brandAlignmentScore: number;
  brandAlignmentNotes: string;
}

export interface ContentBatchSummary {
  totalPieces: number;
  platforms: Platform[];
  averageBrandScore: number;
}

export interface ContentBatch {
  pieces: GeneratedContent[];
  summary: ContentBatchSummary;
}

// ===== ANALYTICS AGENT TYPES =====

export interface ContentMetrics {
  impressions?: number;
  engagements?: number;
  clicks?: number;
  shares?: number;
  comments?: number;
  saves?: number;
  conversions?: number;
}

export interface ContentPerformanceData {
  contentId: string;
  platform: Platform;
  contentType: ContentType;
  publishedAt: string;
  metrics: ContentMetrics;
  content?: string;
}

export interface AnalyticsGoal {
  metric: string;
  target: number;
}

export interface AnalyticsRequest {
  performanceData: ContentPerformanceData[];
  period: string;
  goals?: AnalyticsGoal[];
  questions?: string[];
}

export type GoalStatus = 'exceeded' | 'met' | 'close' | 'missed';

export interface GoalAchievement {
  goal: string;
  target: number;
  actual: number;
  status: GoalStatus;
}

export interface ContentPerformanceHighlight {
  description: string;
  metric: string;
  value: number;
}

export interface ChannelPerformance {
  platform: Platform;
  summary: string;
  topContent: ContentPerformanceHighlight;
  underperformer?: ContentPerformanceHighlight;
  insights: string[];
}

export interface ContentPattern {
  pattern: string;
  evidence: string;
}

export interface ContentAnalysis {
  whatWorked: ContentPattern[];
  whatDidnt: ContentPattern[];
  surprises: string[];
}

export interface Recommendation {
  action: string;
  rationale: string;
  expectedImpact: string;
}

export interface ABTestSuggestion {
  hypothesis: string;
  test: string;
  successMetric: string;
}

export interface AnalyticsReport {
  period: string;
  summary: string;
  goalAchievement: GoalAchievement[];
  channelPerformance: ChannelPerformance[];
  contentAnalysis: ContentAnalysis;
  recommendations: {
    immediate: Recommendation[];
    strategic: Recommendation[];
  };
  abTestSuggestions?: ABTestSuggestion[];
}

// ===== ORCHESTRATION TYPES =====

export interface AgentCapability {
  name: AgentName;
  description: string;
  capabilities: string[];
}

export interface IdeaToCampaignOptions {
  generateContent?: boolean;
  contentCount?: number;
}

export interface IdeaToCampaignResult {
  campaign: AgentResponse<CampaignPlan>;
  content?: AgentResponse<ContentBatch>;
}

