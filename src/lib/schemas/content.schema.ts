import { z } from 'zod';

const CONTENT_TYPES = [
  'tweet', 'thread', 'poll', 'hot-take',
  'educational', 'counter-argument', 'story',
] as const;

const DRAFT_STATUSES = ['idea', 'draft', 'scheduled', 'published'] as const;

export const CreateContentDraftSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  contentType: z.enum(CONTENT_TYPES).default('tweet'),
  tone: z.string().default('casual'),
  brandId: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
  sourceType: z.enum(['idea-feed', 'manual', 'repurpose']).optional(),
  sourceId: z.string().optional(),
  parentId: z.string().optional(),
});

export const UpdateContentDraftSchema = z.object({
  content: z.string().min(1).optional(),
  contentType: z.enum(CONTENT_TYPES).optional(),
  tone: z.string().optional(),
  status: z.enum(DRAFT_STATUSES).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  authenticity: z.number().min(0).max(100).optional(),
});

export type CreateContentDraftInput = z.infer<typeof CreateContentDraftSchema>;
export type UpdateContentDraftInput = z.infer<typeof UpdateContentDraftSchema>;
