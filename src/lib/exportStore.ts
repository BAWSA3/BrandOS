import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GeneratedContentItem, VisualConcept } from './types';
import { v4 as uuidv4 } from 'uuid';

interface ExportStore {
  // Generated content that can be approved for export
  generatedContent: GeneratedContentItem[];
  addContent: (item: Omit<GeneratedContentItem, 'id' | 'createdAt'>) => void;
  removeContent: (id: string) => void;
  toggleApproval: (id: string) => void;
  clearAll: () => void;
  
  // Visual concepts saved for export
  savedConcepts: VisualConcept[];
  addConcept: (concept: VisualConcept) => void;
  removeConcept: (title: string) => void;
  clearConcepts: () => void;
}

export const useExportStore = create<ExportStore>()(
  persist(
    (set) => ({
      generatedContent: [],
      savedConcepts: [],
      
      addContent: (item) => set((state) => ({
        generatedContent: [
          ...state.generatedContent,
          { ...item, id: uuidv4(), createdAt: new Date() }
        ]
      })),
      
      removeContent: (id) => set((state) => ({
        generatedContent: state.generatedContent.filter((c) => c.id !== id)
      })),
      
      toggleApproval: (id) => set((state) => ({
        generatedContent: state.generatedContent.map((c) =>
          c.id === id ? { ...c, approved: !c.approved } : c
        )
      })),
      
      clearAll: () => set({ generatedContent: [] }),
      
      addConcept: (concept) => set((state) => ({
        savedConcepts: [...state.savedConcepts, concept]
      })),
      
      removeConcept: (title) => set((state) => ({
        savedConcepts: state.savedConcepts.filter((c) => c.title !== title)
      })),
      
      clearConcepts: () => set({ savedConcepts: [] }),
    }),
    { name: 'brandos-export-storage' }
  )
);

