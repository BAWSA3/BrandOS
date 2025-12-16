'use client';

import { useEffect } from 'react';
import { useBrandStore } from '@/lib/store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useBrandStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}

