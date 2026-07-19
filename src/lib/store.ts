import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandDNA } from './types';
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

// Phase tracking for guided experience. The first-check/first-generation
// flags and lastActivePhase were written only by the retired /app shell —
// the fields stay in the persisted shape (stored blobs still carry them)
// but only hasCompletedOnboarding is read or written today.
interface PhaseProgress {
  hasCompletedOnboarding: boolean;
  hasCompletedFirstCheck: boolean;
  hasCompletedFirstGeneration: boolean;
  lastActivePhase: 'home' | 'define' | 'check' | 'generate' | 'scale';
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
  hydrateBrands: (brands: BrandDNA[]) => void;
  replaceBrandId: (oldId: string, newId: string) => void;

  // Voice Fingerprints (per brand)
  voiceFingerprints: Record<string, VoiceFingerprint>;
  setVoiceFingerprint: (brandId: string, fp: VoiceFingerprint) => void;
  clearVoiceFingerprint: (brandId: string) => void;

  // Generation tracking & referral
  generationsUsed: number;
  generationLimit: number;
  referralCode: string | null;
  isUnlocked: boolean;
  incrementGeneration: () => void;
  unlockUnlimited: () => void;
  grantBonusGeneration: () => void;
  initReferralCode: () => string;

  // Phase Progress (for guided experience)
  phaseProgress: PhaseProgress;
  completeOnboarding: () => void;

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
    secondary: '#F2F0EF',
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
      voiceFingerprints: {},

      // Generation tracking & referral
      generationsUsed: 0,
      generationLimit: 5,
      referralCode: null,
      isUnlocked: true,

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
          brands: state.brands.map((brand) =>
            brand.id === state.currentBrandId ? { ...brand, ...dna, updatedAt: new Date() } : brand
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
          const newBrands = state.brands.filter((b) => b.id !== id);
          // Clean up associated data
          const { [id]: _vf, ...restFingerprints } = state.voiceFingerprints;
          return {
            brands: newBrands,
            currentBrandId:
              state.currentBrandId === id ? newBrands[0]?.id || null : state.currentBrandId,
            voiceFingerprints: restFingerprints,
          };
        }),

      switchBrand: (id) => set({ currentBrandId: id }),

      // Server-first hydration: replace local brands wholesale with the
      // workspace's server brands (the server is the source of truth once
      // the user is authed). Fingerprints stored on the brand rows are
      // unpacked into the per-brand record so panels read one source.
      hydrateBrands: (brands) =>
        set((state) => {
          if (brands.length === 0) return state;
          const currentStillExists = brands.some((b) => b.id === state.currentBrandId);

          const fingerprints = { ...state.voiceFingerprints };
          for (const b of brands) {
            if (b.voiceFingerprint) {
              try {
                const fp = JSON.parse(b.voiceFingerprint);
                // Legacy rows may hold un-stamped model output — panels
                // dereference metadata, so only accept complete fingerprints.
                if (
                  fp &&
                  typeof fp === 'object' &&
                  typeof fp.metadata === 'object' &&
                  fp.metadata
                ) {
                  fingerprints[b.id] = fp;
                }
              } catch {
                // Corrupt stored fingerprint — ignore; user can re-extract.
              }
            }
          }

          return {
            brands,
            currentBrandId: currentStillExists ? state.currentBrandId : brands[0].id,
            voiceFingerprints: fingerprints,
          };
        }),

      // Swap a local uuid for the server cuid after a create round-trips,
      // carrying every per-brand keyed record along so nothing orphans.
      replaceBrandId: (oldId, newId) =>
        set((state) => {
          const remap = <T>(record: Record<string, T>): Record<string, T> => {
            if (!(oldId in record)) return record;
            const { [oldId]: moved, ...rest } = record;
            return { ...rest, [newId]: moved };
          };
          return {
            brands: state.brands.map((b) => (b.id === oldId ? { ...b, id: newId } : b)),
            currentBrandId: state.currentBrandId === oldId ? newId : state.currentBrandId,
            voiceFingerprints: remap(state.voiceFingerprints),
          };
        }),

      // Voice Fingerprints — kept in the per-brand record for fast access AND
      // mirrored onto brand.voiceFingerprint (JSON string) so the server sync
      // (useBrandHydration → /api/brands) persists it to the workspace brand.
      setVoiceFingerprint: (brandId, fp) =>
        set((state) => ({
          voiceFingerprints: {
            ...state.voiceFingerprints,
            [brandId]: fp,
          },
          brands: state.brands.map((b) =>
            b.id === brandId
              ? { ...b, voiceFingerprint: JSON.stringify(fp), updatedAt: new Date() }
              : b
          ),
        })),

      clearVoiceFingerprint: (brandId) =>
        set((state) => {
          const { [brandId]: _, ...rest } = state.voiceFingerprints;
          return {
            voiceFingerprints: rest,
            brands: state.brands.map((b) =>
              b.id === brandId ? { ...b, voiceFingerprint: undefined, updatedAt: new Date() } : b
            ),
          };
        }),

      // Generation tracking & referral
      incrementGeneration: () => set((state) => ({ generationsUsed: state.generationsUsed + 1 })),

      unlockUnlimited: () => set({ isUnlocked: true }),

      grantBonusGeneration: () => set((state) => ({ generationLimit: state.generationLimit + 1 })),

      initReferralCode: () => {
        const state = get();
        if (state.referralCode) return state.referralCode;
        const code = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
        set({ referralCode: code });
        return code;
      },

      // Phase Progress Methods
      completeOnboarding: () =>
        set((state) => ({
          phaseProgress: { ...state.phaseProgress, hasCompletedOnboarding: true },
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
        voiceFingerprints: state.voiceFingerprints,
        generationsUsed: state.generationsUsed,
        generationLimit: state.generationLimit,
        referralCode: state.referralCode,
        isUnlocked: state.isUnlocked,
        phaseProgress: state.phaseProgress,
      }),
    }
  )
);

// Hydration hook — returns false during SSR/first render, true after Zustand rehydrates from localStorage
export const useHasHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useBrandStore.persist.onFinishHydration(() => setHydrated(true));
    // If already hydrated (e.g. fast load), set immediately
    if (useBrandStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
};

// Helper hook to get current brand
export const useCurrentBrand = () => {
  const { brands, currentBrandId } = useBrandStore();
  return brands.find((b) => b.id === currentBrandId) || null;
};
