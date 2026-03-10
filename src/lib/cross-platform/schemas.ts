// =============================================================================
// CROSS-PLATFORM SCHEMAS — Zod validation for all cross-platform types
// =============================================================================

import { z } from 'zod';

export const SocialPlatformSchema = z.enum([
  'x',
  'linkedin',
  'instagram',
  'youtube',
  'tiktok',
  'threads',
]);

export const CrossPlatformContentTypeSchema = z.enum([
  'text',
  'image',
  'video',
  'carousel',
  'story',
  'reel',
  'thread',
  'article',
  'short',
  'poll',
]);

export const EngagementMetricsSchema = z.object({
  likes: z.number().min(0),
  comments: z.number().min(0),
  shares: z.number().min(0),
  views: z.number().min(0).optional(),
  saves: z.number().min(0).optional(),
  clicks: z.number().min(0).optional(),
});

export const ContentMetadataSchema = z.object({
  postedAt: z.string(),
  engagement: EngagementMetricsSchema,
  hashtags: z.array(z.string()),
  mentions: z.array(z.string()),
  url: z.string().optional(),
  authorUsername: z.string().optional(),
  authorDisplayName: z.string().optional(),
});

export const ContentItemSchema = z.object({
  id: z.string(),
  platform: SocialPlatformSchema,
  contentType: CrossPlatformContentTypeSchema,
  textContent: z.string().optional(),
  transcript: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  metadata: ContentMetadataSchema,
  rawData: z.record(z.string(), z.unknown()).optional(),
});

// Manual content input (paste/upload flow)
export const ManualContentInputSchema = z.object({
  text: z.string().optional(),
  platform: SocialPlatformSchema,
  contentType: CrossPlatformContentTypeSchema.optional(),
  mediaUrls: z.array(z.string()).optional(),
  transcript: z.string().optional(),
}).refine(
  (data) => data.text || data.transcript || (data.mediaUrls && data.mediaUrls.length > 0),
  { message: 'At least one of text, transcript, or media must be provided' }
);

// Cross-platform voice analysis request
export const CrossPlatformVoiceAnalysisRequestSchema = z.object({
  items: z.array(ContentItemSchema).min(1, 'At least one content item required'),
  fingerprintJson: z.string().optional(),
  fallbackDescription: z.string().optional(),
});

// Pre-publish check request
export const PrePublishCheckRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  platform: SocialPlatformSchema,
  contentType: CrossPlatformContentTypeSchema.optional(),
  mediaUrls: z.array(z.string()).optional(),
  brandDnaJson: z.string().min(1, 'Brand DNA is required'),
  voiceFingerprintJson: z.string().optional(),
});

// Transcript extraction request
export const TranscriptRequestSchema = z.object({
  videoUrl: z.string().url().optional(),
  platform: SocialPlatformSchema.optional(),
}).refine(
  (data) => data.videoUrl,
  { message: 'A video URL is required' }
);

// Visual consistency check request
export const VisualConsistencyRequestSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1, 'At least one image URL is required'),
  visualDnaJson: z.string().optional(),
  brandDnaJson: z.string().optional(),
});

// Platform connection request
export const ConnectPlatformRequestSchema = z.object({
  platform: SocialPlatformSchema,
  authCode: z.string().min(1),
  redirectUri: z.string().url(),
});

// Cross-platform score request
export const CrossPlatformScoreRequestSchema = z.object({
  brandId: z.string().min(1),
  platforms: z.array(SocialPlatformSchema).optional(),
});

// Approval workflow request
export const CreateApprovalRequestSchema = z.object({
  brandId: z.string().min(1),
  content: z.string().min(1),
  platform: SocialPlatformSchema,
  contentType: CrossPlatformContentTypeSchema.optional(),
});

export const ReviewApprovalRequestSchema = z.object({
  approvalId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'request_revision']),
  feedback: z.string().optional(),
});

// Exported types
export type SocialPlatformType = z.infer<typeof SocialPlatformSchema>;
export type ContentItemInput = z.infer<typeof ContentItemSchema>;
export type ManualContentInput = z.infer<typeof ManualContentInputSchema>;
export type PrePublishCheckRequest = z.infer<typeof PrePublishCheckRequestSchema>;
export type TranscriptRequest = z.infer<typeof TranscriptRequestSchema>;
