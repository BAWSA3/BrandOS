import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandDNA, HistoryItem, SafeZone, MemoryEvent, DesignIntentBlock } from './types';
import { VoiceFingerprint } from './voice-fingerprint';
import { v4 as uuidv4 } from 'uuid';

type Theme = 'light' | 'dark';

// Demo Mode types for screenshot capture
export interface CapturedMoment {
  id: string;
  momentId: string;
  label: string;
  timestamp: number;
}

export interface DemoModeState {
  isActive: boolean;
  sessionId: string | null;
  captures: CapturedMoment[];
  currentMoment: string | null;
  captureCount: number;
}

// Phase tracking for guided experience
interface PhaseProgress {
  hasCompletedOnboarding: boolean;
  hasCompletedFirstCheck: boolean;
  hasCompletedFirstGeneration: boolean;
  lastActivePhase: 'home' | 'define' | 'check' | 'generate' | 'scale';
}

// Type for importing generated Brand DNA from X Brand Score analysis
export interface ImportableBrandDNA {
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
}

interface BrandStore {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Multiple brands
  brands: BrandDNA[];
  currentBrandId: string | null;
  
  // Brand management
  setBrandDNA: (dna: Partial<BrandDNA>) => void;
  createBrand: (name?: string) => void;
  deleteBrand: (id: string) => void;
  switchBrand: (id: string) => void;
  importBrandFromDNA: (dna: ImportableBrandDNA, twitterUsername: string) => string;
  
  // History
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // Safe Zones (per brand)
  safeZones: Record<string, SafeZone[]>;
  addSafeZone: (zone: Omit<SafeZone, 'id'>) => void;
  updateSafeZone: (id: string, zone: Partial<SafeZone>) => void;
  deleteSafeZone: (id: string) => void;
  
  // Brand Memory (per brand)
  brandMemory: Record<string, MemoryEvent[]>;
  addMemoryEvent: (event: Omit<MemoryEvent, 'id' | 'createdAt'>) => void;
  deleteMemoryEvent: (id: string) => void;
  
  // Design Intent Blocks (per brand)
  designIntents: Record<string, DesignIntentBlock[]>;
  addDesignIntent: (intent: DesignIntentBlock) => void;
  deleteDesignIntent: (id: string) => void;

  // Voice Fingerprints (per brand)
  voiceFingerprints: Record<string, VoiceFingerprint>;
  setVoiceFingerprint: (brandId: string, fp: VoiceFingerprint) => void;
  clearVoiceFingerprint: (brandId: string) => void;
  
  // Phase Progress (for guided experience)
  phaseProgress: PhaseProgress;
  completeOnboarding: () => void;
  markFirstCheck: () => void;
  markFirstGeneration: () => void;
  setLastActivePhase: (phase: PhaseProgress['lastActivePhase']) => void;
  resetOnboarding: () => void;

  // Demo Mode (for screenshot capture)
  demoMode: DemoModeState;
  startDemoSession: () => string;
  endDemoSession: () => void;
  setDemoMoment: (momentId: string | null) => void;
  recordDemoCapture: (momentId: string, label: string) => void;
  clearDemoCaptures: () => void;
}

const createDefaultBrandDNA = (name: string = ''): BrandDNA => ({
  id: uuidv4(),
  name,
  colors: {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#6366f1',
  },
  tone: {
    minimal: 50,
    playful: 50,
    bold: 50,
    experimental: 30,
  },
  keywords: [],
  doPatterns: [],
  dontPatterns: [],
  voiceSamples: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const initialBrand = createDefaultBrandDNA('My Brand');

export const useBrandStore = create<BrandStore>()(
  persist(
    (set, get) => ({
      theme: 'dark' as Theme,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      
      brands: [initialBrand],
      currentBrandId: initialBrand.id,
      history: [],
      safeZones: {},
      brandMemory: {},
      designIntents: {},
      voiceFingerprints: {},
      
      // Phase progress initial state
      phaseProgress: {
        hasCompletedOnboarding: false,
        hasCompletedFirstCheck: false,
        hasCompletedFirstGeneration: false,
        lastActivePhase: 'home',
      },

      // Demo mode initial state (not persisted - only active during session)
      demoMode: {
        isActive: false,
        sessionId: null,
        captures: [],
        currentMoment: null,
        captureCount: 0,
      },
      
      setBrandDNA: (dna) =>
        set((state) => ({
          brands: state.brands.map(brand =>
            brand.id === state.currentBrandId
              ? { ...brand, ...dna, updatedAt: new Date() }
              : brand
          ),
        })),
      
      createBrand: (name = 'New Brand') =>
        set((state) => {
          const newBrand = createDefaultBrandDNA(name);
          return {
            brands: [...state.brands, newBrand],
            currentBrandId: newBrand.id,
          };
        }),
      
      deleteBrand: (id) =>
        set((state) => {
          if (state.brands.length <= 1) return state;
          const newBrands = state.brands.filter(b => b.id !== id);
          // Clean up associated data
          const { [id]: _sz, ...restSafeZones } = state.safeZones;
          const { [id]: _mem, ...restMemory } = state.brandMemory;
          const { [id]: _di, ...restIntents } = state.designIntents;
          const { [id]: _vf, ...restFingerprints } = state.voiceFingerprints;
          return {
            brands: newBrands,
            currentBrandId: state.currentBrandId === id
              ? newBrands[0]?.id || null
              : state.currentBrandId,
            safeZones: restSafeZones,
            brandMemory: restMemory,
            designIntents: restIntents,
            voiceFingerprints: restFingerprints,
          };
        }),
      
      switchBrand: (id) =>
        set({ currentBrandId: id }),
      
      importBrandFromDNA: (dna, twitterUsername) => {
        const newBrand: BrandDNA = {
          id: uuidv4(),
          name: dna.name || `@${twitterUsername}`,
          colors: dna.colors || {
            primary: '#000000',
            secondary: '#ffffff',
            accent: '#6366f1',
          },
          tone: dna.tone || {
            minimal: 50,
            playful: 50,
            bold: 50,
            experimental: 30,
          },
          keywords: dna.keywords || [],
          doPatterns: dna.doPatterns || [],
          dontPatterns: dna.dontPatterns || [],
          voiceSamples: dna.voiceSamples || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          brands: [...state.brands, newBrand],
          currentBrandId: newBrand.id,
          // Mark onboarding as complete since they have real brand data
          phaseProgress: {
            ...state.phaseProgress,
            hasCompletedOnboarding: true,
          },
        }));
        
        return newBrand.id;
      },
      
      addHistoryItem: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              id: uuidv4(),
              timestamp: new Date(),
            },
            ...state.history,
          ].slice(0, 50), // Keep last 50 items
        })),
      
      clearHistory: () =>
        set({ history: [] }),
      
      // Safe Zones
      addSafeZone: (zone) =>
        set((state) => {
          const brandId = state.currentBrandId;
          if (!brandId) return state;
          const existing = state.safeZones[brandId] || [];
          return {
            safeZones: {
              ...state.safeZones,
              [brandId]: [...existing, { ...zone, id: uuidv4() }],
            },
          };
        }),
      
      updateSafeZone: (id, updates) =>
        set((state) => {
          const brandId = state.currentBrandId;
          if (!brandId) return state;
          const existing = state.safeZones[brandId] || [];
          return {
            safeZones: {
              ...state.safeZones,
              [brandId]: existing.map(sz => sz.id === id ? { ...sz, ...updates } : sz),
            },
          };
        }),
      
      deleteSafeZone: (id) =>
        set((state) => {
          const brandId = state.currentBrandId;
          if (!brandId) return state;
          const existing = state.safeZones[brandId] || [];
          return {
            safeZones: {
              ...state.safeZones,
              [brandId]: existing.filter(sz => sz.id !== id),
            },
          };
        }),
      
      // Brand Memory
      addMemoryEvent: (event) =>
        set((state) => {
          const brandId = state.currentBrandId;
          if (!brandId) return state;
          const existing = state.brandMemory[brandId] || [];
          return {
            brandMemory: {
              ...state.brandMemory,
              [brandId]: [{ ...event, id: uuidv4(), createdAt: new Date() }, ...existing].slice(0, 100),
            },
          };
        }),
      
      deleteMemoryEvent: (id) =>
        set((state) => {
          const brandId = state.currentBrandId;
          if (!brandId) return state;
          const existing = state.brandMemory[brandId] || [];
          return {
            brandMemory: {
              ...state.brandMemory,
              [brandId]: existing.filter(e => e.id !== id),
            },
          };
        }),
      
      // Design Intents
      addDesignIntent: (intent) =>
        set((state) => {
          const brandId = state.currentBrandId;
          if (!brandId) return state;
          const existing = state.designIntents[brandId] || [];
          return {
            designIntents: {
              ...state.designIntents,
              [brandId]: [intent, ...existing],
            },
          };
        }),
      
      deleteDesignIntent: (id) =>
        set((state) => {
          const brandId = state.currentBrandId;
          if (!brandId) return state;
          const existing = state.designIntents[brandId] || [];
          return {
            designIntents: {
              ...state.designIntents,
              [brandId]: existing.filter(di => di.id !== id),
            },
          };
        }),

      // Voice Fingerprints
      setVoiceFingerprint: (brandId, fp) =>
        set((state) => ({
          voiceFingerprints: {
            ...state.voiceFingerprints,
            [brandId]: fp,
          },
        })),

      clearVoiceFingerprint: (brandId) =>
        set((state) => {
          const { [brandId]: _, ...rest } = state.voiceFingerprints;
          return { voiceFingerprints: rest };
        }),

      // Phase Progress Methods
      completeOnboarding: () =>
        set((state) => ({
          phaseProgress: { ...state.phaseProgress, hasCompletedOnboarding: true },
        })),
      
      markFirstCheck: () =>
        set((state) => ({
          phaseProgress: { ...state.phaseProgress, hasCompletedFirstCheck: true },
        })),
      
      markFirstGeneration: () =>
        set((state) => ({
          phaseProgress: { ...state.phaseProgress, hasCompletedFirstGeneration: true },
        })),
      
      setLastActivePhase: (phase) =>
        set((state) => ({
          phaseProgress: { ...state.phaseProgress, lastActivePhase: phase },
        })),
      
      resetOnboarding: () =>
        set((state) => ({
          phaseProgress: {
            hasCompletedOnboarding: false,
            hasCompletedFirstCheck: false,
            hasCompletedFirstGeneration: false,
            lastActivePhase: 'home',
          },
        })),

      // Demo Mode Methods
      startDemoSession: () => {
        const sessionId = `demo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        set({
          demoMode: {
            isActive: true,
            sessionId,
            captures: [],
            currentMoment: null,
            captureCount: 0,
          },
        });
        return sessionId;
      },

      endDemoSession: () =>
        set({
          demoMode: {
            isActive: false,
            sessionId: null,
            captures: [],
            currentMoment: null,
            captureCount: 0,
          },
        }),

      setDemoMoment: (momentId) =>
        set((state) => ({
          demoMode: { ...state.demoMode, currentMoment: momentId },
        })),

      recordDemoCapture: (momentId, label) =>
        set((state) => ({
          demoMode: {
            ...state.demoMode,
            captures: [
              ...state.demoMode.captures,
              { id: uuidv4(), momentId, label, timestamp: Date.now() },
            ],
            captureCount: state.demoMode.captureCount + 1,
          },
        })),

      clearDemoCaptures: () =>
        set((state) => ({
          demoMode: {
            ...state.demoMode,
            captures: [],
            captureCount: 0,
          },
        })),
    }),
    {
      name: 'brandos-storage',
      partialize: (state) => ({
        // Exclude demoMode from persistence - it's session-only
        theme: state.theme,
        brands: state.brands,
        currentBrandId: state.currentBrandId,
        history: state.history,
        safeZones: state.safeZones,
        brandMemory: state.brandMemory,
        designIntents: state.designIntents,
        voiceFingerprints: state.voiceFingerprints,
        phaseProgress: state.phaseProgress,
      }),
    }
  )
);

// Helper hook to get current brand
export const useCurrentBrand = () => {
  const { brands, currentBrandId } = useBrandStore();
  return brands.find(b => b.id === currentBrandId) || null;
};
