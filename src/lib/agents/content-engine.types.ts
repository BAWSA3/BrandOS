// ===== CONTENT ENGINE TYPES =====
// Configurable content scheduling, CTA rotation, and engagement context

import { z } from 'zod';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type SlotId = 'post1' | 'post2';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface SlotConfig {
  format: string;       // e.g., "Framework", "Thread", "Hot Take"
  description?: string;
}

export interface DaySchedule {
  post1: SlotConfig;
  post2: SlotConfig;
}

export type ContentSchedule = Record<DayOfWeek, DaySchedule>;
export type CTARotation = Record<DayOfWeek, { post1: string; post2: string }>;

export interface EngagementContext {
  followerCount?: number;
  followerTarget?: number;
  targetDate?: string;
  engagementRate?: number;
  avgRetweets?: number;
  rtToLikeRatio?: number;
  ctaScore?: number;
  ctaTarget?: number;
  topGaps: string[];
}

export interface ContentEngineConfig {
  title?: string;
  scannedHandle?: string;
  schedule: ContentSchedule;
  ctaRotation: CTARotation;
  engagement: EngagementContext;
  voiceConstraints: string[];
  doPatterns: string[];
  neverSay: string[];
  themes: string[];
}

export interface ContentEngineRequest {
  day: DayOfWeek;
  slot: SlotId;
  topic?: string;
}

export interface ContentEngineOutput {
  meta: {
    slot: string;
    format: string;
    ctaType: string;
    gapTargeted: string;
  };
  content: string;
  footer: {
    postingWindow: string;
    hashtags: string;
  };
  raw: string;
}

// ===== ZOD SCHEMAS =====

const DayOfWeekSchema = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const SlotIdSchema = z.enum(['post1', 'post2']);

const SlotConfigSchema = z.object({
  format: z.string(),
  description: z.string().optional(),
});

const DayScheduleSchema = z.object({
  post1: SlotConfigSchema,
  post2: SlotConfigSchema,
});

const ContentScheduleSchema = z.record(DayOfWeekSchema, DayScheduleSchema);
const CTARotationSchema = z.record(DayOfWeekSchema, z.object({ post1: z.string(), post2: z.string() }));

const EngagementContextSchema = z.object({
  followerCount: z.number().optional(),
  followerTarget: z.number().optional(),
  targetDate: z.string().optional(),
  engagementRate: z.number().optional(),
  avgRetweets: z.number().optional(),
  rtToLikeRatio: z.number().optional(),
  ctaScore: z.number().optional(),
  ctaTarget: z.number().optional(),
  topGaps: z.array(z.string()),
});

const ContentEngineConfigSchema = z.object({
  title: z.string().optional(),
  scannedHandle: z.string().optional(),
  schedule: ContentScheduleSchema,
  ctaRotation: CTARotationSchema,
  engagement: EngagementContextSchema,
  voiceConstraints: z.array(z.string()),
  doPatterns: z.array(z.string()),
  neverSay: z.array(z.string()),
  themes: z.array(z.string()),
});

const BrandToneSchema = z.object({
  minimal: z.number(),
  playful: z.number(),
  bold: z.number(),
  experimental: z.number(),
});

const BrandDNASchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  tone: BrandToneSchema,
  keywords: z.array(z.string()),
  doPatterns: z.array(z.string()),
  dontPatterns: z.array(z.string()),
  voiceSamples: z.array(z.string()),
}).passthrough();

export const ContentEngineRequestSchema = z.object({
  brandDNA: BrandDNASchema,
  engineConfig: ContentEngineConfigSchema,
  day: DayOfWeekSchema,
  slot: SlotIdSchema,
  topic: z.string().optional(),
});

export const TryEngineRequestSchema = z.object({
  name: z.string().max(100).optional(),
  tone: z.string().max(50).optional(),
  day: DayOfWeekSchema,
  slot: SlotIdSchema,
  topic: z.string().max(500).optional(),
  ctaType: z.string().max(100).optional(),
  gapTargeted: z.string().max(100).optional(),
  voiceScan: z.object({
    toneWords: z.array(z.string()),
    doPatterns: z.array(z.string()),
    dontPatterns: z.array(z.string()),
    sampleTopics: z.array(z.string()),
    suggestedVibe: z.string(),
    confidence: z.number(),
  }).optional(),
});

export const VoiceScanRequestSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .regex(/^@?[a-zA-Z0-9_]{1,15}$/, 'Invalid X username format'),
});

// Sensible defaults for new users
export const DEFAULT_CONTENT_ENGINE_CONFIG: ContentEngineConfig = {
  schedule: {
    Monday:    { post1: { format: 'Framework' },      post2: { format: 'Conversational' } },
    Tuesday:   { post1: { format: 'Thread' },          post2: { format: 'Observation/QRT' } },
    Wednesday: { post1: { format: 'Hot Take' },        post2: { format: 'Personal Insight' } },
    Thursday:  { post1: { format: 'Build Log' },       post2: { format: 'Quick Insight' } },
    Friday:    { post1: { format: 'Thread' },          post2: { format: 'Friday Energy' } },
    Saturday:  { post1: { format: 'Community' },       post2: { format: 'Weekend Personal' } },
    Sunday:    { post1: { format: 'Reflection' },      post2: { format: 'Week Recap' } },
  },
  ctaRotation: {
    Monday:    { post1: 'Bookmark This',    post2: 'Reply With Yours' },
    Tuesday:   { post1: 'Quote RT',         post2: 'Agree/Disagree' },
    Wednesday: { post1: 'Agree/Disagree',   post2: 'Reply With Yours' },
    Thursday:  { post1: 'Reply With Yours', post2: 'Bookmark This' },
    Friday:    { post1: 'Quote RT',         post2: 'Reply With Yours' },
    Saturday:  { post1: 'Bookmark This',    post2: 'Agree/Disagree' },
    Sunday:    { post1: 'Quote RT',         post2: 'Reply With Yours' },
  },
  engagement: {
    topGaps: ['CTA'],
  },
  voiceConstraints: [],
  doPatterns: [],
  neverSay: [],
  themes: [],
};
