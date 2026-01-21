'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBrandStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { BrandDNA } from '@/lib/types';

interface UseBrandSyncReturn {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  forcSync: () => Promise<void>;
}

export function useBrandSync(): UseBrandSyncReturn {
  const { user, isLoading: authLoading } = useAuth();
  const { brands, setBrandDNA, createBrand } = useBrandStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncDone = useRef(false);
  const previousBrandsRef = useRef<string>('');

  // Fetch brands from server
  const fetchServerBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands');
      if (!res.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await res.json();
      return data.brands as BrandDNA[];
    } catch (error) {
      console.error('[useBrandSync] Fetch error:', error);
      throw error;
    }
  }, []);

  // Save brand to server
  const saveBrandToServer = useCallback(async (brand: BrandDNA) => {
    try {
      // Check if brand exists on server
      const res = await fetch('/api/brands');
      const data = await res.json();
      const serverBrands = data.brands || [];
      const existsOnServer = serverBrands.some((b: BrandDNA) => b.id === brand.id);

      if (existsOnServer) {
        // Update existing brand
        const updateRes = await fetch('/api/brands', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: brand.id,
            name: brand.name,
            colors: brand.colors,
            tone: brand.tone,
            keywords: brand.keywords,
            doPatterns: brand.doPatterns,
            dontPatterns: brand.dontPatterns,
            voiceSamples: brand.voiceSamples,
          }),
        });
        if (!updateRes.ok) throw new Error('Failed to update brand');
      } else {
        // Create new brand
        const createRes = await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: brand.name,
            colors: brand.colors,
            tone: brand.tone,
            keywords: brand.keywords,
            doPatterns: brand.doPatterns,
            dontPatterns: brand.dontPatterns,
            voiceSamples: brand.voiceSamples,
          }),
        });
        if (!createRes.ok) throw new Error('Failed to create brand');
      }
    } catch (error) {
      console.error('[useBrandSync] Save error:', error);
      throw error;
    }
  }, []);

  // Initial sync: merge localStorage data with server data
  const performInitialSync = useCallback(async () => {
    if (!user || initialSyncDone.current) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Check for pending brand sync from OAuth flow
      const pendingBrandSync = localStorage.getItem('pendingBrandSync');

      // Fetch server brands
      const serverBrands = await fetchServerBrands();

      // If user has server brands, use them
      if (serverBrands.length > 0) {
        // Store current brands from localStorage
        const localBrands = brands;

        // If there are local brands not on server, sync them up
        for (const localBrand of localBrands) {
          const existsOnServer = serverBrands.some(b => b.id === localBrand.id);
          if (!existsOnServer && localBrand.name !== 'My Brand') {
            await saveBrandToServer(localBrand);
          }
        }
      } else {
        // No server brands - migrate localStorage brands if they have content
        const brandsToMigrate = brands.filter(b =>
          b.name !== 'My Brand' ||
          b.keywords.length > 0 ||
          b.doPatterns.length > 0 ||
          b.voiceSamples.length > 0
        );

        for (const brand of brandsToMigrate) {
          await saveBrandToServer(brand);
        }
      }

      // Clear pending sync data
      if (pendingBrandSync) {
        localStorage.removeItem('pendingBrandSync');
      }

      initialSyncDone.current = true;
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('[useBrandSync] Initial sync error:', error);
      setSyncError('Failed to sync brands. Your data is saved locally.');
    } finally {
      setIsSyncing(false);
    }
  }, [user, brands, fetchServerBrands, saveBrandToServer]);

  // Debounced sync on brand changes
  const debouncedSync = useCallback(async () => {
    if (!user || !initialSyncDone.current) return;

    const currentBrandsJson = JSON.stringify(brands);
    if (currentBrandsJson === previousBrandsRef.current) return;

    previousBrandsRef.current = currentBrandsJson;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new debounced sync
    syncTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        // Sync each brand that has changed
        for (const brand of brands) {
          await saveBrandToServer(brand);
        }
        setLastSyncedAt(new Date());
      } catch (error) {
        console.error('[useBrandSync] Sync error:', error);
        setSyncError('Failed to save changes. Your data is saved locally.');
      } finally {
        setIsSyncing(false);
      }
    }, 2000); // 2 second debounce
  }, [user, brands, saveBrandToServer]);

  // Initial sync on auth
  useEffect(() => {
    if (!authLoading && user && !initialSyncDone.current) {
      performInitialSync();
    }
  }, [authLoading, user, performInitialSync]);

  // Sync on brand changes
  useEffect(() => {
    if (user && initialSyncDone.current) {
      debouncedSync();
    }
  }, [brands, user, debouncedSync]);

  // Force sync function
  const forcSync = useCallback(async () => {
    if (!user) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      for (const brand of brands) {
        await saveBrandToServer(brand);
      }
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('[useBrandSync] Force sync error:', error);
      setSyncError('Failed to sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [user, brands, saveBrandToServer]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSyncing,
    lastSyncedAt,
    syncError,
    forcSync,
  };
}

export default useBrandSync;
