import { z } from 'zod';

export const PostVoiceScoreSchema = z.object({
  tweetId: z.string(),
  text: z.string(),
  score: z.number().min(0).max(100),
  flags: z.array(z.string()),
  postedAt: z.string(),
});

export const VoiceDriftSchema = z.object({
  direction: z.enum(['stable', 'drifting', 'evolving']),
  trendLine: z.array(z.number()),
  explanation: z.string(),
});

export const VoiceDimensionsSchema = z.object({
  toneConsistency: z.number().min(0).max(100),
  vocabularyConsistency: z.number().min(0).max(100),
  structureConsistency: z.number().min(0).max(100),
  topicConsistency: z.number().min(0).max(100),
});

export const VoiceConsistencyReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  postScores: z.array(PostVoiceScoreSchema),
  drift: VoiceDriftSchema,
  dimensions: VoiceDimensionsSchema,
  outliers: z.array(PostVoiceScoreSchema),
  insights: z.array(z.string()),
});

export const VoiceConsistencyRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export type PostVoiceScore = z.infer<typeof PostVoiceScoreSchema>;
export type VoiceDrift = z.infer<typeof VoiceDriftSchema>;
export type VoiceDimensions = z.infer<typeof VoiceDimensionsSchema>;
export type VoiceConsistencyReport = z.infer<typeof VoiceConsistencyReportSchema>;
export type VoiceConsistencyRequest = z.infer<typeof VoiceConsistencyRequestSchema>;
