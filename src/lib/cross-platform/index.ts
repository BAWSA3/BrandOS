// =============================================================================
// CROSS-PLATFORM MODULE — Public API
// =============================================================================

// Core types
export type {
  SocialPlatform,
  CrossPlatformContentType,
  ContentItem,
  ContentMetadata,
  EngagementMetrics,
  PlatformConnection,
  PlatformNorms,
  VisualDNA,
  CrossPlatformScore,
  PlatformBrandScore,
  TranscriptResult,
  TranscriptSegment,
  PrePublishCheck,
  TeamRole,
  TeamInvite,
  ApprovalWorkflow,
} from './types';

export { PLATFORM_NORMS, PLATFORM_LABELS } from './types';

// Normalizers
export {
  normalizeTweet,
  normalizeLinkedInPost,
  normalizeInstagramPost,
  normalizeYouTubeVideo,
  normalizeTikTokVideo,
  normalizeThreadsPost,
  normalizeManualInput,
  computeEngagementRate,
} from './normalizers';

// Voice engine
export {
  analyzeVoiceConsistencyForContent,
  analyzeVoiceConsistencyByPlatform,
  computeCrossPlatformVoiceScore,
} from './voice-engine';

// Brand health engine
export {
  computeEngagementFromContent,
  computeActivityFromContent,
  computePerPlatformHealth,
  computeCrossPlatformHealthDimensions,
} from './brand-health-engine';

// Scoring engine
export { computeCrossPlatformBrandScore } from './scoring-engine';

// Pre-publish engine
export { runPrePublishCheck, quickPrePublishCheck } from './pre-publish-engine';

// Team & agency engine
export {
  getPermissions,
  hasPermission,
  requiresApproval,
  canReview,
  computeApprovalSummary,
  computeAgencyOverview,
} from './team-engine';
export type { TeamPermissions, AgencyBrandOverview } from './team-engine';

// Visual engine
export {
  analyzeVisualConsistency,
  auditVisualConsistency,
  crossPlatformVisualAudit,
} from './visual-engine';
export type {
  VisualConsistencyResult,
  CrossPlatformVisualAudit,
} from './visual-engine';

// Transcript engine
export {
  fetchTranscript,
  fetchYouTubeCaptions,
  extractYouTubeVideoId,
  extractTikTokVideoId,
  detectVideoSource,
  createManualTranscript,
} from './transcript-engine';

// Schemas
export {
  SocialPlatformSchema,
  CrossPlatformContentTypeSchema,
  ContentItemSchema,
  ManualContentInputSchema,
  CrossPlatformVoiceAnalysisRequestSchema,
  PrePublishCheckRequestSchema,
  TranscriptRequestSchema,
  VisualConsistencyRequestSchema,
  ConnectPlatformRequestSchema,
  CrossPlatformScoreRequestSchema,
  CreateApprovalRequestSchema,
  ReviewApprovalRequestSchema,
} from './schemas';
