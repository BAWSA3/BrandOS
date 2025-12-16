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

export interface GenerateRequest {
  prompt: string;
  contentType?: 'social' | 'headline' | 'email' | 'general';
}


