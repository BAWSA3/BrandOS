import { create } from 'zustand';
import { Variation, TonePill } from './workflow.types';

interface WorkflowState {
  // Node data
  topic: string;
  tone: TonePill | null;
  context: string | null;
  variations: Variation[];
  selectedVariationIndex: number | null;
  editedContent: string;
  mediaUrls: string[];
  linkUrl: string | null;

  // Processing state
  isGenerating: boolean;
  generationError: string | null;
  isPosting: boolean;
  postError: string | null;
  postResult: { tweetId: string; tweetUrl: string } | null;

  // Actions
  setTopic: (topic: string) => void;
  setTone: (tone: TonePill | null) => void;
  setContext: (context: string | null) => void;
  setVariations: (variations: Variation[]) => void;
  selectVariation: (index: number) => void;
  setEditedContent: (content: string) => void;
  addMediaUrl: (url: string) => void;
  removeMediaUrl: (index: number) => void;
  setLinkUrl: (url: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | null) => void;
  setIsPosting: (isPosting: boolean) => void;
  setPostError: (error: string | null) => void;
  setPostResult: (result: { tweetId: string; tweetUrl: string } | null) => void;
  reset: () => void;
}

const initialState = {
  topic: '',
  tone: null as TonePill | null,
  context: null as string | null,
  variations: [] as Variation[],
  selectedVariationIndex: null as number | null,
  editedContent: '',
  mediaUrls: [] as string[],
  linkUrl: null as string | null,
  isGenerating: false,
  generationError: null as string | null,
  isPosting: false,
  postError: null as string | null,
  postResult: null as { tweetId: string; tweetUrl: string } | null,
};

export const useWorkflowStore = create<WorkflowState>()((set) => ({
  ...initialState,

  setTopic: (topic) => set({ topic }),
  setTone: (tone) => set({ tone }),
  setContext: (context) => set({ context }),
  setVariations: (variations) => set({ variations, selectedVariationIndex: null, editedContent: '' }),
  selectVariation: (index) =>
    set((state) => ({
      selectedVariationIndex: index,
      editedContent: state.variations[index]?.content || '',
    })),
  setEditedContent: (content) => set({ editedContent: content }),
  addMediaUrl: (url) => set((state) => ({ mediaUrls: [...state.mediaUrls, url] })),
  removeMediaUrl: (index) =>
    set((state) => ({
      mediaUrls: state.mediaUrls.filter((_, i) => i !== index),
    })),
  setLinkUrl: (url) => set({ linkUrl: url }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationError: (error) => set({ generationError: error }),
  setIsPosting: (isPosting) => set({ isPosting }),
  setPostError: (error) => set({ postError: error }),
  setPostResult: (result) => set({ postResult: result }),
  reset: () => set(initialState),
}));
