import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Asset Types
export interface LogoAsset {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'icon' | 'wordmark' | 'monochrome';
  url: string;
  fileType: string;
  clearSpace: number; // percentage
  minSize: number; // pixels
  usageNotes: string;
  createdAt: Date;
}

export interface ExtendedColor {
  id: string;
  name: string;
  hex: string;
  category: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic';
  usage: string;
  contrastRatio?: number;
}

export interface FontConfig {
  id: string;
  name: string;
  family: string;
  url?: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  category: 'heading' | 'body' | 'accent' | 'monospace';
}

export interface TypeScale {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing: string;
  fontFamily: string;
}

export interface TypographyConfig {
  fonts: FontConfig[];
  scale: TypeScale[];
  pairing: {
    heading: string;
    body: string;
    accent?: string;
  };
}

export interface ImageryAsset {
  id: string;
  name: string;
  url: string;
  type: 'photo' | 'illustration' | 'pattern' | 'texture';
  category: 'hero' | 'lifestyle' | 'product' | 'abstract' | 'moodboard';
  tags: string[];
  doExample?: boolean;
  dontExample?: boolean;
  notes: string;
  createdAt: Date;
}

export interface IconAsset {
  id: string;
  name: string;
  url: string;
  category: string;
  sizes: number[];
  style: 'outline' | 'filled' | 'duotone';
  createdAt: Date;
}

export interface TemplateAsset {
  id: string;
  name: string;
  type: 'social' | 'email' | 'ad' | 'presentation' | 'document';
  platform?: string; // e.g., 'instagram', 'twitter', 'linkedin'
  dimensions: { width: number; height: number };
  previewUrl?: string;
  content: {
    layout: string;
    elements: TemplateElement[];
  };
  createdAt: Date;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: Record<string, string | number>;
}

export interface CanvasSection {
  id: string;
  type: 'logos' | 'colors' | 'typography' | 'imagery' | 'icons' | 'templates';
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
}

export interface CanvasLayout {
  sections: CanvasSection[];
  zoom: number;
  panX: number;
  panY: number;
  gridEnabled: boolean;
  snapToGrid: boolean;
}

export interface BrandKitAssets {
  logos: LogoAsset[];
  extendedColors: ExtendedColor[];
  typography: TypographyConfig;
  imagery: ImageryAsset[];
  icons: IconAsset[];
  templates: TemplateAsset[];
  canvasLayout: CanvasLayout;
}

interface BrandKitStore {
  // Brand kit assets per brand
  brandKits: Record<string, BrandKitAssets>;
  
  // Get current brand kit
  getCurrentBrandKit: (brandId: string) => BrandKitAssets;
  
  // Initialize brand kit for a brand
  initializeBrandKit: (brandId: string) => void;
  
  // Logo management
  addLogo: (brandId: string, logo: Omit<LogoAsset, 'id' | 'createdAt'>) => void;
  updateLogo: (brandId: string, logoId: string, updates: Partial<LogoAsset>) => void;
  deleteLogo: (brandId: string, logoId: string) => void;
  
  // Color management
  addColor: (brandId: string, color: Omit<ExtendedColor, 'id'>) => void;
  updateColor: (brandId: string, colorId: string, updates: Partial<ExtendedColor>) => void;
  deleteColor: (brandId: string, colorId: string) => void;
  
  // Typography management
  updateTypography: (brandId: string, typography: Partial<TypographyConfig>) => void;
  addFont: (brandId: string, font: Omit<FontConfig, 'id'>) => void;
  deleteFont: (brandId: string, fontId: string) => void;
  
  // Imagery management
  addImagery: (brandId: string, image: Omit<ImageryAsset, 'id' | 'createdAt'>) => void;
  updateImagery: (brandId: string, imageId: string, updates: Partial<ImageryAsset>) => void;
  deleteImagery: (brandId: string, imageId: string) => void;
  
  // Icon management
  addIcon: (brandId: string, icon: Omit<IconAsset, 'id' | 'createdAt'>) => void;
  updateIcon: (brandId: string, iconId: string, updates: Partial<IconAsset>) => void;
  deleteIcon: (brandId: string, iconId: string) => void;
  
  // Template management
  addTemplate: (brandId: string, template: Omit<TemplateAsset, 'id' | 'createdAt'>) => void;
  updateTemplate: (brandId: string, templateId: string, updates: Partial<TemplateAsset>) => void;
  deleteTemplate: (brandId: string, templateId: string) => void;
  
  // Canvas layout
  updateCanvasLayout: (brandId: string, layout: Partial<CanvasLayout>) => void;
  updateCanvasSection: (brandId: string, sectionId: string, updates: Partial<CanvasSection>) => void;
}

const defaultTypography: TypographyConfig = {
  fonts: [],
  scale: [
    { name: 'H1', fontSize: '3rem', lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'inherit' },
    { name: 'H2', fontSize: '2.25rem', lineHeight: '1.3', fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'inherit' },
    { name: 'H3', fontSize: '1.5rem', lineHeight: '1.4', fontWeight: 600, letterSpacing: '0', fontFamily: 'inherit' },
    { name: 'H4', fontSize: '1.25rem', lineHeight: '1.5', fontWeight: 500, letterSpacing: '0', fontFamily: 'inherit' },
    { name: 'Body', fontSize: '1rem', lineHeight: '1.6', fontWeight: 400, letterSpacing: '0', fontFamily: 'inherit' },
    { name: 'Small', fontSize: '0.875rem', lineHeight: '1.5', fontWeight: 400, letterSpacing: '0.01em', fontFamily: 'inherit' },
    { name: 'Caption', fontSize: '0.75rem', lineHeight: '1.4', fontWeight: 400, letterSpacing: '0.02em', fontFamily: 'inherit' },
  ],
  pairing: {
    heading: 'system-ui',
    body: 'system-ui',
  },
};

const defaultCanvasLayout: CanvasLayout = {
  sections: [
    { id: 'logos', type: 'logos', x: 0, y: 0, width: 400, height: 200, collapsed: false },
    { id: 'colors', type: 'colors', x: 420, y: 0, width: 400, height: 200, collapsed: false },
    { id: 'typography', type: 'typography', x: 0, y: 220, width: 400, height: 250, collapsed: false },
    { id: 'imagery', type: 'imagery', x: 420, y: 220, width: 400, height: 250, collapsed: false },
    { id: 'icons', type: 'icons', x: 0, y: 490, width: 400, height: 200, collapsed: false },
    { id: 'templates', type: 'templates', x: 420, y: 490, width: 400, height: 200, collapsed: false },
  ],
  zoom: 1,
  panX: 0,
  panY: 0,
  gridEnabled: true,
  snapToGrid: true,
};

const createDefaultBrandKit = (): BrandKitAssets => ({
  logos: [],
  extendedColors: [],
  typography: defaultTypography,
  imagery: [],
  icons: [],
  templates: [],
  canvasLayout: defaultCanvasLayout,
});

export const useBrandKitStore = create<BrandKitStore>()(
  persist(
    (set, get) => ({
      brandKits: {},
      
      getCurrentBrandKit: (brandId: string) => {
        const kit = get().brandKits[brandId];
        if (!kit) {
          get().initializeBrandKit(brandId);
          return get().brandKits[brandId];
        }
        return kit;
      },
      
      initializeBrandKit: (brandId: string) =>
        set((state) => ({
          brandKits: {
            ...state.brandKits,
            [brandId]: state.brandKits[brandId] || createDefaultBrandKit(),
          },
        })),
      
      // Logo management
      addLogo: (brandId, logo) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                logos: [...kit.logos, { ...logo, id: uuidv4(), createdAt: new Date() }],
              },
            },
          };
        }),
      
      updateLogo: (brandId, logoId, updates) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                logos: kit.logos.map((l) => (l.id === logoId ? { ...l, ...updates } : l)),
              },
            },
          };
        }),
      
      deleteLogo: (brandId, logoId) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                logos: kit.logos.filter((l) => l.id !== logoId),
              },
            },
          };
        }),
      
      // Color management
      addColor: (brandId, color) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                extendedColors: [...kit.extendedColors, { ...color, id: uuidv4() }],
              },
            },
          };
        }),
      
      updateColor: (brandId, colorId, updates) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                extendedColors: kit.extendedColors.map((c) =>
                  c.id === colorId ? { ...c, ...updates } : c
                ),
              },
            },
          };
        }),
      
      deleteColor: (brandId, colorId) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                extendedColors: kit.extendedColors.filter((c) => c.id !== colorId),
              },
            },
          };
        }),
      
      // Typography management
      updateTypography: (brandId, typography) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                typography: { ...kit.typography, ...typography },
              },
            },
          };
        }),
      
      addFont: (brandId, font) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                typography: {
                  ...kit.typography,
                  fonts: [...kit.typography.fonts, { ...font, id: uuidv4() }],
                },
              },
            },
          };
        }),
      
      deleteFont: (brandId, fontId) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                typography: {
                  ...kit.typography,
                  fonts: kit.typography.fonts.filter((f) => f.id !== fontId),
                },
              },
            },
          };
        }),
      
      // Imagery management
      addImagery: (brandId, image) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                imagery: [...kit.imagery, { ...image, id: uuidv4(), createdAt: new Date() }],
              },
            },
          };
        }),
      
      updateImagery: (brandId, imageId, updates) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                imagery: kit.imagery.map((i) => (i.id === imageId ? { ...i, ...updates } : i)),
              },
            },
          };
        }),
      
      deleteImagery: (brandId, imageId) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                imagery: kit.imagery.filter((i) => i.id !== imageId),
              },
            },
          };
        }),
      
      // Icon management
      addIcon: (brandId, icon) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                icons: [...kit.icons, { ...icon, id: uuidv4(), createdAt: new Date() }],
              },
            },
          };
        }),
      
      updateIcon: (brandId, iconId, updates) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                icons: kit.icons.map((i) => (i.id === iconId ? { ...i, ...updates } : i)),
              },
            },
          };
        }),
      
      deleteIcon: (brandId, iconId) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                icons: kit.icons.filter((i) => i.id !== iconId),
              },
            },
          };
        }),
      
      // Template management
      addTemplate: (brandId, template) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                templates: [...kit.templates, { ...template, id: uuidv4(), createdAt: new Date() }],
              },
            },
          };
        }),
      
      updateTemplate: (brandId, templateId, updates) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                templates: kit.templates.map((t) =>
                  t.id === templateId ? { ...t, ...updates } : t
                ),
              },
            },
          };
        }),
      
      deleteTemplate: (brandId, templateId) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                templates: kit.templates.filter((t) => t.id !== templateId),
              },
            },
          };
        }),
      
      // Canvas layout
      updateCanvasLayout: (brandId, layout) =>
        set((state) => {
          const kit = state.brandKits[brandId] || createDefaultBrandKit();
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                canvasLayout: { ...kit.canvasLayout, ...layout },
              },
            },
          };
        }),
      
      updateCanvasSection: (brandId, sectionId, updates) =>
        set((state) => {
          const kit = state.brandKits[brandId];
          if (!kit) return state;
          return {
            brandKits: {
              ...state.brandKits,
              [brandId]: {
                ...kit,
                canvasLayout: {
                  ...kit.canvasLayout,
                  sections: kit.canvasLayout.sections.map((s) =>
                    s.id === sectionId ? { ...s, ...updates } : s
                  ),
                },
              },
            },
          };
        }),
    }),
    {
      name: 'brandos-brandkit-storage',
    }
  )
);







