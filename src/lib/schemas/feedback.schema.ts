import { z } from 'zod';

const FEEDBACK_TYPES = ['bug', 'idea', 'other', 'nps', 'feature_request'] as const;
const FEEDBACK_CATEGORIES = ['score_journey', 'brand_dna', 'agents', 'ui', 'performance'] as const;

export const SubmitFeedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  category: z.enum(FEEDBACK_CATEGORIES).optional(),
  message: z.string().min(1, 'Feedback message is required').max(5000),
  rating: z.number().min(0).max(10).optional(),
  url: z.string().url().optional(),
});

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;
