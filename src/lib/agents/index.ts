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

// Re-export all types for convenience
export * from './types';

// Re-export individual agent functions for direct use
export {
  createCampaignPlan,
  getCampaignSummary,
  generateContent,
  generateContentBatch,
  adaptContentForPlatform,
  generateContentIdeas,
  analyzePerformance,
  quickPerformanceCheck,
  comparePerformancePeriods,
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

