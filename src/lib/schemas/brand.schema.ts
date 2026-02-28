import { z } from 'zod';

export const BrandColorsSchema = z.object({
  primary: z.string().min(1),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  background: z.string().optional(),
});

export const BrandToneSchema = z.object({
  formality: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  humor: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
});

export const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  colors: BrandColorsSchema,
  tone: BrandToneSchema,
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  doPatterns: z.array(z.string()),
  dontPatterns: z.array(z.string()),
  voiceSamples: z.array(z.string()),
});

export const UpdateBrandSchema = CreateBrandSchema.partial();

export const ShareBrandSchema = z.object({
  brandId: z.string().min(1),
  permission: z.enum(['view', 'edit']),
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
}).refine(
  (data) => data.userId || data.email,
  { message: 'Either userId or email must be provided' }
);

export type CreateBrandInput = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandInput = z.infer<typeof UpdateBrandSchema>;
export type ShareBrandInput = z.infer<typeof ShareBrandSchema>;
