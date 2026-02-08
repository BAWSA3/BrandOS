import { BrandDNA } from '@/lib/types';

// ===== Node Data Types =====

export interface IdeaInputData {
  topic: string;
}

export interface ToneContextData {
  tone: string | null;
  context: string | null;
}

export type TonePill =
  | 'launch'
  | 'hot-take'
  | 'educational'
  | 'casual'
  | 'behind-the-scenes'
  | 'announcement'
  | 'engagement-bait'
  | 'thread-starter';

export const TONE_OPTIONS: { value: TonePill; label: string; emoji: string }[] = [
  { value: 'launch', label: 'Launch', emoji: '🚀' },
  { value: 'hot-take', label: 'Hot Take', emoji: '🔥' },
  { value: 'educational', label: 'Educational', emoji: '📚' },
  { value: 'casual', label: 'Casual', emoji: '💬' },
  { value: 'behind-the-scenes', label: 'BTS', emoji: '🎬' },
  { value: 'announcement', label: 'Announce', emoji: '📢' },
  { value: 'engagement-bait', label: 'Engage', emoji: '🎣' },
  { value: 'thread-starter', label: 'Thread', emoji: '🧵' },
];

export interface BrandDNANodeData {
  brandDNA: BrandDNA | null;
}

export interface ContentGeneratorData {
  isGenerating: boolean;
  hasGenerated: boolean;
}

export interface Variation {
  content: string;
  characterCount: number;
  brandAlignmentScore: number;
  hashtags: string[];
}

export interface VariationsData {
  variations: Variation[];
  selectedIndex: number | null;
}

export interface EditRefineData {
  content: string;
  characterCount: number;
}

export interface MediaAttachData {
  mediaUrls: string[];
  linkUrl: string | null;
}

export interface XPreviewData {
  content: string;
  mediaUrls: string[];
  linkUrl: string | null;
  userProfile: {
    displayName: string;
    username: string;
    avatarUrl: string;
    verified: boolean;
  } | null;
}

// ===== Workflow Node Type IDs =====

export type WorkflowNodeType =
  | 'ideaInput'
  | 'toneContext'
  | 'brandDNA'
  | 'contentGenerator'
  | 'variations'
  | 'editRefine'
  | 'mediaAttach'
  | 'xPreview';

// ===== Accent Colors =====

export const NODE_ACCENT_COLORS: Record<WorkflowNodeType, string> = {
  ideaInput: '#2E6AFF',
  toneContext: '#FFD700',
  brandDNA: '#00FF41',
  contentGenerator: '#00FF41',
  variations: '#A855F7',
  editRefine: '#2E6AFF',
  mediaAttach: '#F472B6',
  xPreview: '#C0C0C0',
};
