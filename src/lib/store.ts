import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandDNA } from './types';
import { v4 as uuidv4 } from 'uuid';

interface BrandStore {
  brandDNA: BrandDNA | null;
  setBrandDNA: (dna: Partial<BrandDNA>) => void;
  resetBrandDNA: () => void;
}

const defaultBrandDNA: BrandDNA = {
  id: uuidv4(),
  name: '',
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
};

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      brandDNA: defaultBrandDNA,
      setBrandDNA: (dna) =>
        set((state) => ({
          brandDNA: state.brandDNA
            ? { ...state.brandDNA, ...dna, updatedAt: new Date() }
            : { ...defaultBrandDNA, ...dna },
        })),
      resetBrandDNA: () => set({ brandDNA: defaultBrandDNA }),
    }),
    {
      name: 'brandos-storage',
    }
  )
);


