'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { domToBlob } from 'modern-screenshot';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

/**
 * Save a card element as a PNG the way phones expect.
 *
 * Websites can't write to Photos directly; the closest is the system share
 * sheet (iOS: "Save Image" -> Photos; Android: save to Gallery). iOS only opens
 * it while the tap's user activation is live, so the PNG is pre-rendered
 * (call `prepare` when the card's art loads) and the tap shares the cached file
 * immediately. Cancel resets quietly; a blocked share or no file-share support
 * (most desktops) falls back to a normal download.
 *
 * Captures are clean stills: nodes marked `data-station-fx` are left out and
 * `.station-bob` animations are frozen at rest.
 *
 * `cacheKey` identifies one rendering of the card (e.g. mode); change
 * `resetKey` when the card's content changes to drop stale renders.
 */
export function useCardImageSave(
  cardRef: RefObject<HTMLElement | null>,
  fileName: string,
  cacheKey: string,
  resetKey: string
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const cache = useRef<Record<string, Blob>>({});

  useEffect(() => {
    cache.current = {};
  }, [resetKey]);

  const render = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    return domToBlob(cardRef.current, {
      scale: 2,
      type: 'image/png',
      filter: (node) => !(node instanceof Element && node.hasAttribute('data-station-fx')),
      onCloneEachNode: (cloned) => {
        if (cloned instanceof HTMLElement && cloned.classList.contains('station-bob')) {
          cloned.style.animation = 'none';
          cloned.style.transform = 'none';
        }
      },
    });
  }, [cardRef]);

  const prepare = useCallback(async () => {
    if (cache.current[cacheKey]) return;
    try {
      // Capture only after the pixel fonts are ready, or the cached image
      // would bake in the fallback font.
      await document.fonts?.ready;
      const blob = await render();
      if (blob) cache.current[cacheKey] = blob;
    } catch {
      // non-fatal: the tap will render on demand
    }
  }, [cacheKey, render]);

  const save = useCallback(async () => {
    const downloadFallback = (blob: Blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };

    setStatus('saving');
    try {
      const blob = cache.current[cacheKey] ?? (await render());
      if (!blob) throw new Error('render failed');
      cache.current[cacheKey] = blob;
      const file = new File([blob], fileName, { type: 'image/png' });
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          if ((err as DOMException)?.name === 'AbortError') {
            setStatus('idle');
            return;
          }
          downloadFallback(blob);
        }
      } else {
        downloadFallback(blob);
      }
      setStatus('saved');
    } catch (err) {
      console.error('[card save] failed:', err);
      setStatus('failed');
    }
    setTimeout(() => setStatus('idle'), 2000);
  }, [cacheKey, fileName, render]);

  return { status, prepare, save };
}
