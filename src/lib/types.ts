export interface BrandDNA {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tone: {
    minimal: number;
    playful: number;
    bold: number;
    experimental: number;
  };
  keywords: string[];
  doPatterns: string[];
  dontPatterns: string[];
  voiceSamples: string[];
  voiceFingerprint?: string; // JSON string of VoiceFingerprint
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckResult {
  score: number;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  revisedVersion: string;
}

export type ContentType =
  | 'general'
  | 'social-twitter'
  | 'social-linkedin'
  | 'social-instagram'
  | 'headline'
  | 'tagline'
  | 'email-subject'
  | 'email-body'
  | 'ad-copy'
  | 'product-description'
  | 'blog-intro';

export interface BrandTemplate {
  id: string;
  name: string;
  description: string;
  preview: Partial<BrandDNA>;
}

export type Platform =
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'website'
  | 'email'
  | 'tiktok'
  | 'youtube'
  | 'threads';
