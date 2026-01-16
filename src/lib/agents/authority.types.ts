// ===== BRAND AUTHORITY AGENT - TYPE DEFINITIONS =====
// Positions Relique as the trusted authority in RWA collectibles

import { Platform } from '@/lib/types';

// ===== CORE TYPES =====

export type AuthorityPillar = 'security' | 'transparency' | 'liquidity' | 'authenticity';

export type TargetAudience = 'collector' | 'trader' | 'seller';

export type ObjectionType = 'trust' | 'complexity' | 'value' | 'control';

export type CompetitorType = 'ebay' | 'tcgplayer' | 'localshop' | 'courtyard' | 'alt' | 'dibbs';

export type AuthorityContentType =
  | 'thought-leadership'
  | 'educational'
  | 'competitive'
  | 'trust-building'
  | 'conversion';

// ===== MESSAGING FRAMEWORK TYPES =====

export interface PillarMessage {
  headline: string;
  description: string;
  proofPoints: string[];
  emotionalHook: string;
  keywords: string[];
}

export interface AudienceProfile {
  name: string;
  description: string;
  primaryValue: string;
  painPoints: string[];
  keyMessages: string[];
  preferredPlatforms: Platform[];
  cta: string;
}

export interface ObjectionResponse {
  objection: string;
  shortResponse: string;
  fullResponse: string;
  proofPoints: string[];
  followUpQuestion?: string;
}

export interface CompetitorPosition {
  name: string;
  type: 'traditional' | 'rwa';
  ourAdvantage: string[];
  theirWeakness: string[];
  positioningStatement: string;
  comparisonPoints: {
    feature: string;
    us: string;
    them: string;
  }[];
}

export interface MessagingFramework {
  pillars: Record<AuthorityPillar, PillarMessage>;
  audiences: Record<TargetAudience, AudienceProfile>;
  objections: Record<ObjectionType, ObjectionResponse>;
  competitors: Record<CompetitorType, CompetitorPosition>;
}

// ===== CONTENT GENERATION TYPES =====

export interface AuthorityContentRequest {
  contentType: AuthorityContentType;
  audience?: TargetAudience;
  pillar?: AuthorityPillar;
  topic?: string;
  platform?: Platform;
  competitor?: CompetitorType;
  objection?: ObjectionType;
  trendContext?: string; // From Research Agent
}

export interface AuthorityContent {
  id: string;
  contentType: AuthorityContentType;
  audience: TargetAudience;
  pillar: AuthorityPillar;
  headline: string;
  body: string;
  callToAction: string;
  hashtags?: string[];
  platform?: Platform;
  keyMessages: string[];
  proofPoints: string[];
  brandAlignmentScore: number;
  suggestedVisuals?: string[];
}

export interface AuthorityBrief {
  topic: string;
  angle: string;
  audience: TargetAudience;
  pillar: AuthorityPillar;
  keyPoints: string[];
  competitorDifferentiation?: string;
  trendConnection?: string;
}

// ===== WORKFLOW TYPES =====

export interface TrendToAuthorityRequest {
  trendTopic: string;
  trendSummary: string;
  vertical?: string;
  audiences?: TargetAudience[];
  platforms?: Platform[];
}

export interface TrendToAuthorityResult {
  trend: {
    topic: string;
    summary: string;
  };
  authorityAngles: AuthorityBrief[];
  suggestedContent: AuthorityContent[];
}

export interface ObjectionHandlingRequest {
  objectionType: ObjectionType;
  context?: string; // e.g., "social media comment", "sales call", "FAQ"
  audience?: TargetAudience;
  format?: 'short' | 'detailed' | 'empathetic';
}

export interface ObjectionHandlingResult {
  objection: string;
  response: string;
  proofPoints: string[];
  followUp?: string;
  relatedContent?: AuthorityContent[];
}

export interface CompetitiveContentRequest {
  competitor: CompetitorType;
  audience?: TargetAudience;
  format?: 'comparison' | 'differentiation' | 'migration-guide';
  platform?: Platform;
}

export interface CompetitiveContentResult {
  competitor: CompetitorPosition;
  content: AuthorityContent;
  comparisonTable?: {
    feature: string;
    relique: string;
    competitor: string;
    advantage: 'relique' | 'competitor' | 'neutral';
  }[];
}

// ===== EDUCATIONAL CONTENT TYPES =====

export type EducationalTopic =
  | 'how-vaulting-works'
  | 'nft-basics'
  | 'tokenization-explained'
  | 'grading-importance'
  | 'authentication-process'
  | 'blockchain-transparency'
  | 'instant-liquidity'
  | 'global-marketplace';

export interface EducationalContentRequest {
  topic: EducationalTopic;
  audience?: TargetAudience;
  depth?: 'beginner' | 'intermediate' | 'advanced';
  format?: 'explainer' | 'faq' | 'guide' | 'infographic-script';
}

export interface EducationalContent extends AuthorityContent {
  educationalTopic: EducationalTopic;
  learningObjectives: string[];
  keyTerms: { term: string; definition: string }[];
  nextSteps: string[];
}

// ===== TRUST CONTENT TYPES =====

export type TrustContentFormat =
  | 'vault-tour'
  | 'security-feature'
  | 'process-transparency'
  | 'team-spotlight'
  | 'customer-story'
  | 'insurance-coverage'
  | 'audit-report';

export interface TrustContentRequest {
  format: TrustContentFormat;
  audience?: TargetAudience;
  platform?: Platform;
  focusPillar?: AuthorityPillar;
}

export interface TrustContent extends AuthorityContent {
  trustFormat: TrustContentFormat;
  verificationPoints: string[];
  socialProof?: string[];
}

// ===== RESEARCH INTEGRATION TYPES =====

export interface ResearchToAuthorityParams {
  verticals?: string[];
  audiences?: TargetAudience[];
  platforms?: Platform[];
  contentTypes?: AuthorityContentType[];
  maxAnglesPerTopic?: number;
}

export interface ResearchToAuthorityResult {
  researchTopics: {
    id: string;
    title: string;
    summary: string;
    vertical: string;
  }[];
  authorityContent: AuthorityContent[];
  workflow: {
    stage: string;
    status: 'completed' | 'pending' | 'failed';
    message?: string;
  }[];
}
