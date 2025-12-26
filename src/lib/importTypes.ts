// Types for brand import feature

export interface ExtractedValue<T> {
  value: T;
  confidence: number; // 0-100
  source: string;
}

export interface ExtractedBrand {
  id: string;
  source: 'pdf' | 'images' | 'url' | 'social' | 'json';
  sourceDetails: string;
  overallConfidence: number;
  extractedAt: Date;
  
  name?: ExtractedValue<string>;
  colors?: {
    primary?: ExtractedValue<string>;
    secondary?: ExtractedValue<string>;
    accent?: ExtractedValue<string>;
    additional?: ExtractedValue<string>[];
  };
  tone?: {
    formality?: ExtractedValue<number>;
    energy?: ExtractedValue<number>;
    confidence?: ExtractedValue<number>;
    style?: ExtractedValue<number>;
  };
  keywords?: ExtractedValue<string>[];
  doPatterns?: ExtractedValue<string>[];
  dontPatterns?: ExtractedValue<string>[];
  voiceSamples?: ExtractedValue<string>[];
  
  // Additional metadata
  detectedFonts?: ExtractedValue<string>[];
  logoDescriptions?: ExtractedValue<string>[];
  imageryStyle?: ExtractedValue<string>;
}

export interface ImportProgress {
  stage: 'uploading' | 'parsing' | 'analyzing' | 'extracting' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export type ImportSource = 'pdf' | 'images' | 'url' | 'social' | 'json';

export interface ImportSourceConfig {
  id: ImportSource;
  label: string;
  description: string;
  icon: string;
  accepts?: string; // file types
  placeholder?: string;
}

export const importSources: ImportSourceConfig[] = [
  {
    id: 'pdf',
    label: 'PDF Guidelines',
    description: 'Upload brand guidelines document',
    icon: 'document',
    accepts: '.pdf',
  },
  {
    id: 'images',
    label: 'Brand Images',
    description: 'Upload logos and brand assets',
    icon: 'image',
    accepts: 'image/*',
  },
  {
    id: 'url',
    label: 'Website URL',
    description: 'Analyze your website for brand elements',
    icon: 'globe',
    placeholder: 'https://yourcompany.com',
  },
  {
    id: 'social',
    label: 'Social Profiles',
    description: 'Import from Twitter, Instagram, LinkedIn',
    icon: 'users',
    placeholder: '@yourhandle or profile URL',
  },
  {
    id: 'json',
    label: 'Import JSON',
    description: 'Import BrandOS export or custom format',
    icon: 'code',
    accepts: '.json',
  },
];

export type ReviewMode = 'wizard' | 'grid' | 'comparison';

export interface ReviewModeConfig {
  id: ReviewMode;
  label: string;
  description: string;
  icon: string;
}

export const reviewModes: ReviewModeConfig[] = [
  {
    id: 'wizard',
    label: 'Step-by-Step',
    description: 'Review each element one at a time',
    icon: 'list',
  },
  {
    id: 'grid',
    label: 'All at Once',
    description: 'See everything on one page',
    icon: 'grid',
  },
  {
    id: 'comparison',
    label: 'Side-by-Side',
    description: 'Compare source with extracted values',
    icon: 'columns',
  },
];







