'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CursorMode } from './CustomCursor';

interface CursorContextType {
  mode: CursorMode;
  setMode: (mode: CursorMode) => void;
  setCursorScanning: () => void;
  setCursorAnalyzing: () => void;
  setCursorInteractive: () => void;
  setCursorDefault: () => void;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function CursorProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CursorMode>('default');

  const setCursorScanning = useCallback(() => setMode('scanning'), []);
  const setCursorAnalyzing = useCallback(() => setMode('analyzing'), []);
  const setCursorInteractive = useCallback(() => setMode('interactive'), []);
  const setCursorDefault = useCallback(() => setMode('default'), []);

  return (
    <CursorContext.Provider
      value={{
        mode,
        setMode,
        setCursorScanning,
        setCursorAnalyzing,
        setCursorInteractive,
        setCursorDefault,
      }}
    >
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
}

// Hook to set cursor mode when entering/leaving an element
export function useCursorZone(enterMode: CursorMode) {
  const { setMode } = useCursor();

  const onMouseEnter = useCallback(() => {
    setMode(enterMode);
  }, [setMode, enterMode]);

  const onMouseLeave = useCallback(() => {
    setMode('default');
  }, [setMode]);

  return { onMouseEnter, onMouseLeave };
}
