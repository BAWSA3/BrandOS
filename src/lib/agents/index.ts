// ===== BRANDOS PRODUCT AGENTS - REGISTRY & ORCHESTRATOR =====
// Central hub for all product-facing AI agents

import { BrandDNA, Platform } from '@/lib/types';
import { 
  AgentContext, 
  AgentName,
  AgentResponse, 
  AgentCapability,
  CampaignBrief,
  CampaignPlan,
  ContentBrief,
  GeneratedContent,
  ContentBatch,
  AnalyticsRequest,
  AnalyticsReport,
  ContentPerformanceData,
  IdeaToCampaignOptions,
  IdeaToCampaignResult,
} from './types';

// Import agent functions
import {
  createCampaignPlan,
  getCampaignSummary
} from './campaign.agent';

import {
  generateContent,
  generateContentBatch,
  adaptContentForPlatform,
  generateContentIdeas,
} from './content.agent';

import {
  analyzePerformance,
  quickPerformanceCheck,
  comparePerformancePeriods,
} from './analytics.agent';

import {
  aggregateTrends,
  getTopicsForVertical,
  generateContentBrief as generateResearchContentBrief,
  rankTopics,
  getQuickSummary,
} from './research.agent';

import {
  TCGVertical,
  ResearchSource,
  ResearchTopic,
  ResearchBrief,
  ResearchOptions,
  ResearchContentBrief,
} from './research.types';

// Authority Agent imports
import {
  generateAuthorityContent,
  createPositioningFromTrend,
  handleObjection,
  generateCompetitiveContent,
  generateEducationalContent,
  generateTrustContent,
  getObjectionTypes,
  getCompetitorPositions,
  getEducationalTopicsList,
  getMessagingFrameworkSummary,
} from './authority.agent';

import {
  AuthorityContentType,
  AuthorityPillar,
  TargetAudience,
  ObjectionType,
  CompetitorType,
  AuthorityContent,
  AuthorityContentRequest,
  ObjectionHandlingRequest,
  ObjectionHandlingResult,
  CompetitiveContentRequest,
  CompetitiveContentResult,
  EducationalContentRequest,
  EducationalContent,
  EducationalTopic,
  TrustContentRequest,
  TrustContent,
  TrustContentFormat,
  TrendToAuthorityRequest,
  TrendToAuthorityResult,
} from './authority.types';

// Re-export all types for convenience
export * from './types';
export * from './chat.types';
export * from './conductor';
export * from './research.types';
export * from './authority.types';

// Re-export individual agent functions for direct use
export {
  // Campaign Agent
  createCampaignPlan,
  getCampaignSummary,
  // Content Agent
  generateContent,
  generateContentBatch,
  adaptContentForPlatform,
  generateContentIdeas,
  // Analytics Agent
  analyzePerformance,
  quickPerformanceCheck,
  comparePerformancePeriods,
  // Research Agent
  aggregateTrends,
  getTopicsForVertical,
  generateResearchContentBrief,
  rankTopics,
  getQuickSummary,
  // Authority Agent
  generateAuthorityContent,
  createPositioningFromTrend,
  handleObjection,
  generateCompetitiveContent,
  generateEducationalContent,
  generateTrustContent,
  getObjectionTypes,
  getCompetitorPositions,
  getEducationalTopicsList,
  getMessagingFrameworkSummary,
};

// ===== AGENT REGISTRY =====

/**
 * Registry of all available agents with their capabilities
 */
export const agentRegistry: Record<AgentName, AgentCapability> = {
  campaign: {
    name: 'campaign',
    description: 'Creates marketing campaign plans from ideas. Turns concepts into phased strategies with content calendars and success metrics.',
    capabilities: [
      'campaign-planning',
      'content-calendar-generation', 
      'strategy-development',
      'objective-setting',
      'audience-targeting',
    ],
  },
  content: {
    name: 'content',
    description: 'Generates platform-specific, on-brand content. Creates posts, emails, and copy optimized for each channel.',
    capabilities: [
      'content-creation',
      'copywriting',
      'platform-optimization',
      'content-adaptation',
      'batch-generation',
      'idea-generation',
    ],
  },
  analytics: {
    name: 'analytics',
    description: 'Analyzes content performance and provides actionable recommendations. Identifies patterns and suggests optimizations.',
    capabilities: [
      'performance-analysis',
      'recommendation-generation',
      'ab-test-suggestions',
      'trend-identification',
      'benchmark-comparison',
      'period-comparison',
    ],
  },
  research: {
    name: 'research',
    description: 'Aggregates TCG/collectibles news and trends from social platforms, Reddit, YouTube, and news sources. Synthesizes findings into actionable content topics.',
    capabilities: [
      'trend-aggregation',
      'news-monitoring',
      'topic-synthesis',
      'content-brief-generation',
      'source-tracking',
      'vertical-analysis',
    ],
  },
  authority: {
    name: 'authority',
    description: 'Positions Relique as the trusted authority in RWA collectibles. Generates thought leadership, educational, competitive, and trust-building content.',
    capabilities: [
      'thought-leadership',
      'educational-content',
      'competitive-positioning',
      'objection-handling',
      'trust-building',
      'trend-to-authority',
      'audience-targeting',
    ],
  },
};

/**
 * Get information about available agents
 */
export function getAvailableAgents(): AgentCapability[] {
  return Object.values(agentRegistry);
}

/**
 * Check if an agent exists
 */
export function isValidAgent(name: string): name is AgentName {
  return name in agentRegistry;
}

// ===== BRAND AGENTS CLASS =====

/**
 * Unified interface for interacting with all BrandOS agents
 * 
 * @example
 * ```typescript
 * const agents = new BrandAgents(myBrandDNA);
 * 
 * // Plan a campaign
 * const campaign = await agents.planCampaign({ idea: 'Launch our new feature' });
 * 
 * // Generate content
 * const content = await agents.createContent({
 *   type: 'social-twitter',
 *   platform: 'twitter',
 *   topic: 'Announcing our new feature',
 * });
 * 
 * // Analyze performance
 * const report = await agents.analyzeContent({
 *   performanceData: myMetrics,
 *   period: 'Last 30 days',
 * });
 * ```
 */
export class BrandAgents {
  private context: AgentContext;

  constructor(brandDNA: BrandDNA, userId?: string, sessionId?: string) {
    this.context = { brandDNA, userId, sessionId };
  }

  /**
   * Get the current brand context
   */
  getContext(): AgentContext {
    return this.context;
  }

  /**
   * Update the brand DNA (e.g., after user edits)
   */
  updateBrandDNA(brandDNA: BrandDNA): void {
    this.context.brandDNA = brandDNA;
  }

  // ===== CAMPAIGN AGENT METHODS =====

  /**
   * Create a full marketing campaign plan from an idea
   */
  async planCampaign(brief: CampaignBrief): Promise<AgentResponse<CampaignPlan>> {
    return createCampaignPlan(this.context, brief);
  }

  /**
   * Get a quick campaign summary (lighter weight)
   */
  async getCampaignPreview(idea: string): Promise<AgentResponse<{ 
    name: string; 
    summary: string; 
    suggestedChannels: string[] 
  }>> {
    return getCampaignSummary(this.context, idea);
  }

  // ===== CONTENT AGENT METHODS =====

  /**
   * Generate a single piece of content
   */
  async createContent(brief: ContentBrief): Promise<AgentResponse<GeneratedContent>> {
    return generateContent(this.context, brief);
  }

  /**
   * Generate multiple pieces of content
   */
  async createContentBatch(briefs: ContentBrief[]): Promise<AgentResponse<ContentBatch>> {
    return generateContentBatch(this.context, briefs);
  }

  /**
   * Adapt content from one platform to another
   */
  async adaptContent(
    content: string, 
    fromPlatform: Platform, 
    toPlatform: Platform
  ): Promise<AgentResponse<GeneratedContent>> {
    return adaptContentForPlatform(this.context, content, fromPlatform, toPlatform);
  }

  /**
   * Generate content ideas for a topic
   */
  async getContentIdeas(
    topic: string, 
    platforms: Platform[], 
    count?: number
  ): Promise<AgentResponse<{ ideas: { platform: Platform; hook: string; angle: string }[] }>> {
    return generateContentIdeas(this.context, topic, platforms, count);
  }

  // ===== ANALYTICS AGENT METHODS =====

  /**
   * Analyze content performance and get recommendations
   */
  async analyzeContent(request: AnalyticsRequest): Promise<AgentResponse<AnalyticsReport>> {
    return analyzePerformance(this.context, request);
  }

  /**
   * Quick performance health check
   */
  async quickCheck(data: ContentPerformanceData[]): Promise<AgentResponse<{
    status: 'winning' | 'neutral' | 'losing';
    keyMetric: string;
    oneAction: string;
  }>> {
    return quickPerformanceCheck(this.context, data);
  }

  /**
   * Compare performance between two periods
   */
  async comparePeriods(
    periodA: { name: string; data: ContentPerformanceData[] },
    periodB: { name: string; data: ContentPerformanceData[] }
  ): Promise<AgentResponse<{
    comparison: string;
    periodAStats: { impressions: number; engagements: number; rate: number };
    periodBStats: { impressions: number; engagements: number; rate: number };
    change: { direction: 'up' | 'down' | 'flat'; percentage: number };
    insights: string[];
  }>> {
    return comparePerformancePeriods(this.context, periodA, periodB);
  }

  // ===== RESEARCH AGENT METHODS =====

  /**
   * Aggregate trends from multiple sources and synthesize into research brief
   */
  async researchTrends(options?: ResearchOptions): Promise<AgentResponse<ResearchBrief>> {
    return aggregateTrends(this.context, options);
  }

  /**
   * Get trending topics for a specific vertical
   */
  async getVerticalTopics(
    vertical: TCGVertical,
    limit?: number
  ): Promise<AgentResponse<ResearchTopic[]>> {
    return getTopicsForVertical(this.context, vertical, limit);
  }

  /**
   * Generate a content brief from a research topic
   */
  async createBriefFromTopic(
    topic: ResearchTopic,
    contentType: string,
    platform: string
  ): Promise<AgentResponse<ResearchContentBrief>> {
    return generateResearchContentBrief(this.context, topic, contentType, platform);
  }

  /**
   * Get a quick summary of trending topics
   */
  async getResearchSummary(
    verticals?: TCGVertical[]
  ): Promise<AgentResponse<{
    summary: string;
    topTopics: { title: string; vertical: string }[];
    trendingKeywords: string[];
  }>> {
    return getQuickSummary(this.context, verticals);
  }

  /**
   * Rank topics by relevance and engagement
   */
  rankTopicsByRelevance(
    topics: ResearchTopic[],
    options?: {
      preferredVerticals?: TCGVertical[];
      minRelevance?: number;
      sortBy?: 'relevance' | 'engagement' | 'recency';
    }
  ): ResearchTopic[] {
    return rankTopics(topics, options);
  }

  // ===== AUTHORITY AGENT METHODS =====

  /**
   * Generate authority content (thought leadership, educational, etc.)
   */
  async createAuthorityContent(
    request: AuthorityContentRequest
  ): Promise<AgentResponse<AuthorityContent>> {
    return generateAuthorityContent(this.context.brandDNA, request);
  }

  /**
   * Create positioning angles from a trending topic
   */
  async trendToAuthority(
    request: TrendToAuthorityRequest
  ): Promise<AgentResponse<TrendToAuthorityResult>> {
    return createPositioningFromTrend(this.context.brandDNA, request);
  }

  /**
   * Handle customer/prospect objections
   */
  async handleCustomerObjection(
    request: ObjectionHandlingRequest
  ): Promise<AgentResponse<ObjectionHandlingResult>> {
    return handleObjection(this.context.brandDNA, request);
  }

  /**
   * Generate competitive positioning content
   */
  async createCompetitiveContent(
    request: CompetitiveContentRequest
  ): Promise<AgentResponse<CompetitiveContentResult>> {
    return generateCompetitiveContent(this.context.brandDNA, request);
  }

  /**
   * Generate educational content
   */
  async createEducationalContent(
    request: EducationalContentRequest
  ): Promise<AgentResponse<EducationalContent>> {
    return generateEducationalContent(this.context.brandDNA, request);
  }

  /**
   * Generate trust-building content
   */
  async createTrustContent(
    request: TrustContentRequest
  ): Promise<AgentResponse<TrustContent>> {
    return generateTrustContent(this.context.brandDNA, request);
  }

  /**
   * Get available objection types and quick responses
   */
  getObjectionTypes() {
    return getObjectionTypes();
  }

  /**
   * Get competitor positioning data
   */
  getCompetitorPositions() {
    return getCompetitorPositions();
  }

  /**
   * Get list of educational topics
   */
  getEducationalTopics() {
    return getEducationalTopicsList();
  }

  /**
   * Get messaging framework summary
   */
  getMessagingFramework() {
    return getMessagingFrameworkSummary();
  }

  // ===== ORCHESTRATED WORKFLOWS =====

  /**
   * Complete workflow: Idea → Campaign Plan → Content
   * 
   * Takes an idea and optionally generates the first batch of content
   * based on the campaign calendar.
   */
  async ideaToCampaignWithContent(
    idea: string,
    options: IdeaToCampaignOptions = {}
  ): Promise<IdeaToCampaignResult> {
    // Step 1: Create campaign plan
    const campaignResult = await this.planCampaign({ idea });
    
    if (!campaignResult.success || !campaignResult.data) {
      return { campaign: campaignResult };
    }

    // If content generation not requested, return just the campaign
    if (!options.generateContent) {
      return { campaign: campaignResult };
    }

    // Step 2: Generate content from campaign calendar
    const campaign = campaignResult.data;
    const contentBriefs: ContentBrief[] = [];
    const limit = options.contentCount || 5;

    // Extract content briefs from the calendar
    for (const week of campaign.contentCalendar) {
      for (const item of week.items) {
        if (contentBriefs.length >= limit) break;
        
        contentBriefs.push({
          type: this.mapContentType(item.contentType),
          platform: item.platform,
          topic: item.description,
          campaignContext: campaign.name,
        });
      }
      if (contentBriefs.length >= limit) break;
    }

    // Generate the content
    const contentResult = await this.createContentBatch(contentBriefs);

    return {
      campaign: campaignResult,
      content: contentResult,
    };
  }

  /**
   * Workflow: Analyze → Recommend → Generate Improved Content
   * 
   * Analyzes performance, then generates new content based on learnings.
   */
  async analyzeAndImprove(
    performanceData: ContentPerformanceData[],
    platforms: Platform[]
  ): Promise<{
    analysis: AgentResponse<AnalyticsReport>;
    improvedContent?: AgentResponse<ContentBatch>;
  }> {
    // Step 1: Analyze performance
    const analysisResult = await this.analyzeContent({
      performanceData,
      period: 'Recent performance',
    });

    if (!analysisResult.success || !analysisResult.data) {
      return { analysis: analysisResult };
    }

    // Step 2: Extract what worked and create briefs for improved content
    const whatWorked = analysisResult.data.contentAnalysis.whatWorked;
    const recommendations = analysisResult.data.recommendations.immediate;

    if (whatWorked.length === 0 && recommendations.length === 0) {
      return { analysis: analysisResult };
    }

    // Create content briefs based on successful patterns
    const contentBriefs: ContentBrief[] = platforms.slice(0, 3).map(platform => ({
      type: 'general' as const,
      platform,
      topic: `Content applying learnings: ${whatWorked[0]?.pattern || recommendations[0]?.action || 'optimization'}`,
      keyMessage: whatWorked[0]?.pattern,
    }));

    const contentResult = await this.createContentBatch(contentBriefs);

    return {
      analysis: analysisResult,
      improvedContent: contentResult,
    };
  }

  /**
   * Workflow: Research → Select Topics → Generate Content
   *
   * Researches trends, lets user select topics, then generates content.
   * This is the main workflow for "create content based on latest trends".
   */
  async researchToContent(options: {
    verticals?: TCGVertical[];
    selectedTopics?: ResearchTopic[];
    platforms?: Platform[];
    contentPerTopic?: number;
  } = {}): Promise<{
    research: AgentResponse<ResearchBrief>;
    content?: AgentResponse<ContentBatch>;
  }> {
    const {
      verticals = ['pokemon', 'mtg', 'sports-cards'],
      selectedTopics,
      platforms = ['twitter', 'instagram'],
      contentPerTopic = 2,
    } = options;

    // Step 1: Research trends (skip if topics already selected)
    let topics: ResearchTopic[] = selectedTopics || [];
    let researchResult: AgentResponse<ResearchBrief>;

    if (!selectedTopics || selectedTopics.length === 0) {
      researchResult = await this.researchTrends({ verticals, timeRange: 'last-week' });

      if (!researchResult.success || !researchResult.data) {
        return { research: researchResult };
      }

      // Auto-select top 3 topics if none provided
      topics = this.rankTopicsByRelevance(researchResult.data.topics, {
        minRelevance: 50,
        sortBy: 'relevance',
      }).slice(0, 3);
    } else {
      // Create a minimal research result for pre-selected topics
      researchResult = {
        success: true,
        data: {
          topics: selectedTopics,
          summary: 'Using pre-selected topics',
          trendingKeywords: [],
          verticalSummaries: {} as Record<TCGVertical, string>,
          aggregatedAt: new Date().toISOString(),
        },
        confidence: 1,
        processingTime: 0,
      };
    }

    if (topics.length === 0) {
      return { research: researchResult };
    }

    // Step 2: Generate content briefs for each topic
    const contentBriefs: ContentBrief[] = [];

    for (const topic of topics) {
      for (const platform of platforms.slice(0, 2)) {
        for (let i = 0; i < contentPerTopic; i++) {
          const angle = topic.contentAngles?.[i] || topic.title;
          contentBriefs.push({
            type: this.mapContentType(platform),
            platform: platform as Platform,
            topic: `${topic.title}: ${angle}`,
            keyMessage: topic.summary,
            includeHashtags: true,
          });
        }
      }
    }

    // Step 3: Generate content
    const contentResult = await this.createContentBatch(contentBriefs.slice(0, 10));

    return {
      research: researchResult,
      content: contentResult,
    };
  }

  /**
   * Workflow: Research → Authority → Content
   *
   * Researches trends, creates authority positioning angles, then generates
   * authoritative content that positions Relique as the expert.
   */
  async researchToAuthorityContent(options: {
    verticals?: TCGVertical[];
    audiences?: TargetAudience[];
    platforms?: Platform[];
    contentTypes?: AuthorityContentType[];
    maxAnglesPerTopic?: number;
  } = {}): Promise<{
    research: AgentResponse<ResearchBrief>;
    authorityContent: AuthorityContent[];
    workflow: { stage: string; status: 'completed' | 'pending' | 'failed'; message?: string }[];
  }> {
    const {
      verticals = ['pokemon', 'mtg', 'sports-cards'],
      audiences = ['collector', 'trader'],
      platforms = ['twitter', 'instagram'],
      contentTypes = ['thought-leadership', 'educational'],
      maxAnglesPerTopic = 2,
    } = options;

    const workflow: { stage: string; status: 'completed' | 'pending' | 'failed'; message?: string }[] = [];
    const authorityContent: AuthorityContent[] = [];

    // Step 1: Research trends
    workflow.push({ stage: 'Research trends', status: 'pending' });
    const researchResult = await this.researchTrends({ verticals, timeRange: 'last-week' });

    if (!researchResult.success || !researchResult.data) {
      workflow[0].status = 'failed';
      workflow[0].message = researchResult.error;
      return { research: researchResult, authorityContent, workflow };
    }
    workflow[0].status = 'completed';

    // Step 2: Select top topics
    const topTopics = this.rankTopicsByRelevance(researchResult.data.topics, {
      minRelevance: 50,
      sortBy: 'relevance',
    }).slice(0, 3);

    if (topTopics.length === 0) {
      workflow.push({ stage: 'Select topics', status: 'failed', message: 'No relevant topics found' });
      return { research: researchResult, authorityContent, workflow };
    }
    workflow.push({ stage: 'Select topics', status: 'completed', message: `Selected ${topTopics.length} topics` });

    // Step 3: Create authority positioning for each topic
    workflow.push({ stage: 'Create authority angles', status: 'pending' });

    for (const topic of topTopics) {
      const authorityResult = await this.trendToAuthority({
        trendTopic: topic.title,
        trendSummary: topic.summary,
        vertical: topic.vertical,
        audiences,
        platforms,
      });

      if (authorityResult.success && authorityResult.data) {
        // Add suggested content from the authority angles
        authorityContent.push(...authorityResult.data.suggestedContent.slice(0, maxAnglesPerTopic));
      }
    }

    workflow[2].status = authorityContent.length > 0 ? 'completed' : 'failed';
    workflow[2].message = `Generated ${authorityContent.length} authority content pieces`;

    return {
      research: researchResult,
      authorityContent,
      workflow,
    };
  }

  // ===== HELPER METHODS =====

  /**
   * Map generic content type strings to ContentType
   */
  private mapContentType(type: string): ContentBrief['type'] {
    const typeMap: Record<string, ContentBrief['type']> = {
      'thread': 'social-twitter',
      'tweet': 'social-twitter',
      'twitter': 'social-twitter',
      'post': 'general',
      'linkedin': 'social-linkedin',
      'instagram': 'social-instagram',
      'email': 'email-body',
      'blog': 'blog-intro',
      'article': 'blog-intro',
    };

    const normalizedType = type.toLowerCase();
    return typeMap[normalizedType] || 'general';
  }
}

// ===== FACTORY FUNCTION =====

/**
 * Create a BrandAgents instance
 * 
 * @example
 * ```typescript
 * // In an API route
 * const agents = createAgents(brandDNA, userId);
 * const result = await agents.planCampaign({ idea: 'New product launch' });
 * ```
 */
export function createAgents(
  brandDNA: BrandDNA, 
  userId?: string,
  sessionId?: string
): BrandAgents {
  return new BrandAgents(brandDNA, userId, sessionId);
}

// ===== STANDALONE UTILITIES =====

/**
 * Validate that brand DNA has minimum required fields for agents
 */
export function validateBrandDNA(brandDNA: unknown): brandDNA is BrandDNA {
  if (!brandDNA || typeof brandDNA !== 'object') return false;
  
  const brand = brandDNA as Record<string, unknown>;
  
  return (
    typeof brand.name === 'string' &&
    brand.name.length > 0 &&
    typeof brand.tone === 'object' &&
    brand.tone !== null
  );
}

/**
 * Create a minimal brand DNA for testing
 */
export function createMinimalBrandDNA(name: string): BrandDNA {
  return {
    id: `brand_${Date.now()}`,
    name,
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#0066cc',
    },
    tone: {
      minimal: 50,
      playful: 50,
      bold: 50,
      experimental: 50,
    },
    keywords: [],
    doPatterns: [],
    dontPatterns: [],
    voiceSamples: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

