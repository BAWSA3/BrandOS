'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBrandStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { BrandDNA } from '@/lib/types';

// Server-first brand sync (replaces the old push-only useBrandSync):
// 1. On auth, hydrate the local store FROM the server — the server is the
//    source of truth for a signed-in user.
// 2. Local brands with real content that the server doesn't know yet are
//    pushed up, and their local uuid is swapped for the server cuid via
//    replaceBrandId — the id mismatch is what made the old hook create a
//    duplicate server row on every debounced sync.
// 3. After hydration, edits push with the server id (PUT), new brands POST
//    then swap ids, and local deletes propagate as DELETE so the brand
//    doesn't resurrect on the next login.

interface UseBrandHydrationReturn {
  isSyncing: boolean;
  isHydrated: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  forceSync: () => Promise<void>;
}

interface ServerBrand extends Omit<BrandDNA, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
  workspaceId?: string | null;
}

function toBrandDNA(b: ServerBrand): BrandDNA {
  return {
    id: b.id,
    name: b.name,
    colors: b.colors,
    tone: b.tone,
    keywords: b.keywords,
    doPatterns: b.doPatterns,
    dontPatterns: b.dontPatterns,
    voiceSamples: b.voiceSamples,
    voiceFingerprint: b.voiceFingerprint ?? undefined,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt),
  };
}

// Only brands the user actually worked on are worth a server row.
// Also the first-run signal: no brand with content → show the setup wizard.
export function brandHasContent(b: BrandDNA): boolean {
  return (
    b.keywords.length > 0 ||
    b.doPatterns.length > 0 ||
    b.dontPatterns.length > 0 ||
    b.voiceSamples.length > 0 ||
    (b.name !== '' && b.name !== 'My Brand' && b.name !== 'New Brand')
  );
}

function brandPayload(b: BrandDNA) {
  return {
    name: b.name,
    colors: b.colors,
    tone: b.tone,
    keywords: b.keywords,
    doPatterns: b.doPatterns,
    dontPatterns: b.dontPatterns,
    voiceSamples: b.voiceSamples,
    voiceFingerprint: b.voiceFingerprint ?? null,
  };
}

export function useBrandHydration(): UseBrandHydrationReturn {
  const { user, isLoading: authLoading } = useAuth();
  const { brands, hydrateBrands, replaceBrandId } = useBrandStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const serverIdsRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);
  const pushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPushedRef = useRef<string>('');

  const createOnServer = useCallback(
    async (brand: BrandDNA): Promise<BrandDNA> => {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandPayload(brand)),
      });
      if (!res.ok) throw new Error('Failed to create brand');
      const { brand: created } = await res.json();
      const dna = toBrandDNA(created);
      replaceBrandId(brand.id, dna.id);
      serverIdsRef.current.add(dna.id);
      return dna;
    },
    [replaceBrandId]
  );

  const updateOnServer = useCallback(async (brand: BrandDNA) => {
    const res = await fetch('/api/brands', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: brand.id, ...brandPayload(brand) }),
    });
    if (!res.ok) throw new Error('Failed to update brand');
  }, []);

  const deleteOnServer = useCallback(async (id: string) => {
    const res = await fetch(`/api/brands?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) throw new Error('Failed to delete brand');
    serverIdsRef.current.delete(id);
  }, []);

  // Push the current local state up: PUT known brands, POST unknown ones,
  // DELETE server brands that no longer exist locally.
  const pushLocalState = useCallback(async () => {
    const current = useBrandStore.getState().brands;
    const localIds = new Set(current.map((b) => b.id));

    for (const serverId of Array.from(serverIdsRef.current)) {
      if (!localIds.has(serverId)) await deleteOnServer(serverId);
    }
    for (const brand of current) {
      if (serverIdsRef.current.has(brand.id)) {
        await updateOnServer(brand);
      } else if (brandHasContent(brand)) {
        await createOnServer(brand);
      }
    }
  }, [createOnServer, updateOnServer, deleteOnServer]);

  // Initial hydration, once per signed-in session.
  useEffect(() => {
    if (authLoading || !user || hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const res = await fetch('/api/brands');
        if (!res.ok) throw new Error('Failed to fetch brands');
        const data = await res.json();
        const serverBrands: BrandDNA[] = (data.brands as ServerBrand[]).map(toBrandDNA);
        serverIdsRef.current = new Set(serverBrands.map((b) => b.id));

        // Push up local-only brands the user actually worked on.
        const localOnly = useBrandStore
          .getState()
          .brands.filter((b) => !serverIdsRef.current.has(b.id) && brandHasContent(b));
        const pushed: BrandDNA[] = [];
        for (const brand of localOnly) {
          pushed.push(await createOnServer(brand));
        }

        hydrateBrands([...serverBrands, ...pushed]);
        lastPushedRef.current = JSON.stringify(useBrandStore.getState().brands);
        setLastSyncedAt(new Date());
        // Success-only: isHydrated gates both the first-run wizard (a failed
        // fetch must not show setup to an existing user) and the push loop
        // (pushing against unknown server state re-creates duplicates).
        setIsHydrated(true);
      } catch (error) {
        console.error('[useBrandHydration] Hydration error:', error);
        setSyncError('Failed to load brands from your account. Working from this device.');
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [authLoading, user, createOnServer, hydrateBrands]);

  // Debounced push on local changes, only after hydration.
  useEffect(() => {
    if (!user || !isHydrated) return;
    const snapshot = JSON.stringify(brands);
    if (snapshot === lastPushedRef.current) return;

    if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
    pushTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        await pushLocalState();
        lastPushedRef.current = JSON.stringify(useBrandStore.getState().brands);
        setLastSyncedAt(new Date());
      } catch (error) {
        console.error('[useBrandHydration] Push error:', error);
        setSyncError('Failed to save changes. Your data is saved locally.');
      } finally {
        setIsSyncing(false);
      }
    }, 2000);
  }, [brands, user, isHydrated, pushLocalState]);

  const forceSync = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await pushLocalState();
      lastPushedRef.current = JSON.stringify(useBrandStore.getState().brands);
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('[useBrandHydration] Force sync error:', error);
      setSyncError('Failed to sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [user, pushLocalState]);

  useEffect(() => {
    return () => {
      if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
    };
  }, []);

  return { isSyncing, isHydrated, lastSyncedAt, syncError, forceSync };
}

export default useBrandHydration;
