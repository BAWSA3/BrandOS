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

export interface GenerateRequest {
  prompt: string;
  contentType: ContentType;
}

export interface HistoryItem {
  id: string;
  type: 'check' | 'generate';
  brandId: string;
  brandName: string;
  input: string;
  contentType?: ContentType;
  output: CheckResult | string;
  timestamp: Date;
}

export interface ToneAnalysis {
  formality: number;
  energy: number;
  confidence: number;
  style: number;
  overallMatch: number;
  feedback: string;
}

export interface BrandTemplate {
  id: string;
  name: string;
  description: string;
  preview: Partial<BrandDNA>;
}

export interface Competitor {
  id: string;
  name: string;
  voiceSamples: string[];
  analysis?: string;
}

export interface DashboardStats {
  totalChecks: number;
  totalGenerations: number;
  averageScore: number;
  scoreHistory: { date: string; score: number }[];
  topIssues: { issue: string; count: number }[];
}

export interface VisualInspiration {
  id: string;
  imageUrl: string;
  analysis?: ImageAnalysis;
  addedAt: Date;
}

export interface ImageAnalysis {
  dominantColors: string[];
  mood: string[];
  style: string[];
  composition: string;
  keywords: string[];
}

export interface VisualConcept {
  title: string;
  description: string;
  colorPalette: string[];
  moodKeywords: string[];
  designDirection: string;
  typography: string;
  imagery: string;
  doNotUse: string[];
}

// ===== NEW PRD FEATURES =====

// Design Intent Blocks
export interface DesignIntentBlock {
  id: string;
  input: string; // Natural language directive
  intentType: 'visual_style' | 'typography' | 'layout' | 'motion' | 'color' | 'tone';
  colors?: string[];
  effects?: string[];
  emotionalSignals?: string[];
  rules: string[];
  createdAt: Date;
}

// Taste Translation Engine
export interface TasteTranslation {
  id: string;
  feedback: string; // e.g., "This doesn't feel premium"
  interpretation: string; // What the feedback means
  actionableRules: string[]; // Concrete design rules
  category: 'premium' | 'modern' | 'playful' | 'minimal' | 'bold' | 'elegant' | 'other';
}

// Brand Cohesion View
export interface CohesionAnalysis {
  overallScore: number;
  repetitionIssues: string[];
  toneDrift: {
    detected: boolean;
    details: string;
    severity: 'low' | 'medium' | 'high';
  };
  missingAnchors: string[];
  recommendations: string[];
}

// Platform Adaptation
export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'website' | 'email' | 'tiktok';

export interface PlatformRules {
  platform: Platform;
  toneAdjustments: string[];
  lengthConstraints: { min: number; max: number };
  visualStyle: string;
  doRules: string[];
  dontRules: string[];
}

export interface PlatformAdaptation {
  originalContent: string;
  adaptations: Record<Platform, {
    content: string;
    adjustments: string[];
  }>;
}

// Creator Guardrails
export interface CreatorDraft {
  id: string;
  content: string;
  contentType: ContentType;
  platform?: Platform;
  creatorName?: string;
  submittedAt: Date;
}

export interface GuardrailResult {
  draftId: string;
  alignmentScore: number;
  status: 'approved' | 'needs-revision' | 'rejected';
  violations: {
    rule: string;
    severity: 'minor' | 'major' | 'critical';
    suggestion: string;
  }[];
  approvedElements: string[];
  revisedVersion?: string;
}

// Brand Safe Zones
export interface SafeZone {
  id: string;
  element: string;
  category: 'logo' | 'color' | 'typography' | 'voice' | 'imagery' | 'motion' | 'layout';
  status: 'locked' | 'flexible' | 'experimental';
  rules: string[];
  examples?: string[];
}

// Brand Memory Timeline
export interface MemoryEvent {
  id: string;
  type: 'success' | 'failure' | 'experiment' | 'feedback';
  title: string;
  description: string;
  content?: string;
  outcome?: string;
  metrics?: {
    engagement?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    score?: number;
  };
  tags: string[];
  createdAt: Date;
}

export interface BrandMemory {
  events: MemoryEvent[];
  patterns: {
    successful: string[];
    failed: string[];
    trending: string[];
  };
  insights: string[];
}

// Taste Protection Mode
export interface TasteProtectionResult {
  originalContent: string;
  analysis: {
    isOverDesigned: boolean;
    excessElements: string[];
    unnecessaryAdditions: string[];
  };
  recommendations: {
    type: 'remove' | 'simplify' | 'refine';
    element: string;
    reason: string;
  }[];
  refinedVersion: string;
}

// Context-Aware Tone
export type ToneContext = 'launch' | 'tease' | 'apology' | 'crisis' | 'celebration' | 'update' | 'educational';

export interface ContextToneRules {
  context: ToneContext;
  description: string;
  toneAdjustments: {
    formality: number; // -100 to +100 adjustment
    energy: number;
    confidence: number;
    urgency: number;
  };
  doRules: string[];
  dontRules: string[];
  examplePhrases: string[];
}

export interface ContextAdaptedContent {
  originalContent: string;
  context: ToneContext;
  adaptedContent: string;
  adjustmentsApplied: string[];
}

// ===== GEMINI VISUAL ENGINE TYPES =====

// Animation Concepts
export type AnimationContext = 'page-load' | 'hover' | 'click' | 'transition' | 'scroll' | 'micro-interaction' | 'loading';

export interface AnimationConcept {
  id: string;
  context: AnimationContext;
  name: string;
  description: string;
  timing: {
    duration: string;
    delay?: string;
    easing: string;
    easingCurve?: string;
  };
  keyframes: {
    step: string;
    properties: Record<string, string>;
  }[];
  cssCode: string;
  framerMotionCode?: string;
  brandAlignment: string;
  createdAt: Date;
}

// UI Component Styles
export type UIComponentType = 'button' | 'card' | 'input' | 'modal' | 'tooltip' | 'badge' | 'avatar' | 'nav-item';

export interface UIStyle {
  id: string;
  componentType: UIComponentType;
  name: string;
  description: string;
  baseStyles: {
    borderRadius: string;
    padding: string;
    fontSize: string;
    fontWeight: string;
    letterSpacing?: string;
  };
  colors: {
    background: string;
    text: string;
    border?: string;
    shadow?: string;
  };
  states: {
    hover?: Record<string, string>;
    active?: Record<string, string>;
    focus?: Record<string, string>;
    disabled?: Record<string, string>;
  };
  cssVariables: Record<string, string>;
  tailwindClasses: string;
  brandAlignment: string;
  createdAt: Date;
}

// Background Patterns
export type PatternType = 'geometric' | 'organic' | 'noise' | 'gradient' | 'dots' | 'lines' | 'waves';

export interface Pattern {
  id: string;
  patternType: PatternType;
  name: string;
  description: string;
  cssCode: string;
  svgCode?: string;
  colors: string[];
  opacity?: number;
  scale?: string;
  brandAlignment: string;
  createdAt: Date;
}

// Icon Sets
export type IconStyle = 'line' | 'filled' | 'duotone' | 'outline';
export type IconCategory = 'navigation' | 'actions' | 'status' | 'social' | 'media' | 'commerce';

export interface IconSet {
  id: string;
  name: string;
  style: IconStyle;
  category: IconCategory;
  icons: {
    name: string;
    purpose: string;
    svgCode: string;
  }[];
  strokeWidth?: string;
  cornerRadius?: string;
  brandAlignment: string;
  createdAt: Date;
}

// Motion Design Brief
export interface MotionBrief {
  id: string;
  brandName: string;
  philosophy: string;
  principles: {
    name: string;
    description: string;
    example: string;
  }[];
  timingGuidelines: {
    microInteractions: string;
    transitions: string;
    pageAnimations: string;
    loading: string;
  };
  easingPreferences: {
    primary: string;
    secondary: string;
    avoid: string[];
  };
  doRules: string[];
  dontRules: string[];
  codeSnippets: {
    name: string;
    description: string;
    code: string;
  }[];
  createdAt: Date;
}
