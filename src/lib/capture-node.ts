'use client';

import { domToBlob } from 'modern-screenshot';

/**
 * Capture a DOM node as a PNG: a fixed-width copy rendered off-screen (so it
 * looks the same from any screen), remote images swapped for same-origin data
 * URLs via /api/image-proxy (or they export blank), typewriter carets removed.
 * domToBlob, not domToPng + fetch: the CSP blocks fetching data: URLs.
 */
export async function captureNode(node: HTMLElement, width: number, scale = 3): Promise<Blob> {
  const stage = document.createElement('div');
  stage.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;pointer-events:none;`;
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.querySelectorAll('.motion-typewriter-cursor').forEach((c) => c.remove());
  stage.appendChild(clone);
  document.body.appendChild(stage);
  try {
    const imgs = [...clone.querySelectorAll('img')].filter(
      (i) => i.src.startsWith('http') && !i.src.startsWith(window.location.origin)
    );
    await Promise.all(
      imgs.map(async (img) => {
        const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(img.src)}`);
        if (!res.ok) return;
        const blob = await res.blob();
        img.src = await new Promise<string>((r) => {
          const fr = new FileReader();
          fr.onloadend = () => r(fr.result as string);
          fr.readAsDataURL(blob);
        });
      })
    );
    await Promise.all(
      [...clone.querySelectorAll('img')].map((img) =>
        img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r)))
      )
    );
    return await domToBlob(clone, { scale, type: 'image/png' });
  } finally {
    stage.remove();
  }
}
