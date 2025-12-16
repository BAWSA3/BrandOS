import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandDNA, HistoryItem, SafeZone, MemoryEvent, DesignIntentBlock } from './types';
import { v4 as uuidv4 } from 'uuid';

type Theme = 'light' | 'dark';

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
          return {
            brands: newBrands,
            currentBrandId: state.currentBrandId === id 
              ? newBrands[0]?.id || null 
              : state.currentBrandId,
            safeZones: restSafeZones,
            brandMemory: restMemory,
            designIntents: restIntents,
          };
        }),
      
      switchBrand: (id) =>
        set({ currentBrandId: id }),
      
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
    }),
    {
      name: 'brandos-storage',
    }
  )
);

// Helper hook to get current brand
export const useCurrentBrand = () => {
  const { brands, currentBrandId } = useBrandStore();
  return brands.find(b => b.id === currentBrandId) || null;
};
