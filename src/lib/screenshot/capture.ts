/**
 * Screenshot Capture Service
 * Core capture utility using modern-screenshot (domToPng)
 */

import { domToPng } from 'modern-screenshot';
import { getMomentById, type JourneyMoment } from './moments';

export interface CapturedScreenshot {
  id: string;
  momentId: string;
  moment: JourneyMoment;
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
  sessionId: string;
}

export interface CaptureConfig {
  backgroundColor?: string;
  scale?: number;
  width?: number;
  quality?: number;
}

const DEFAULT_CONFIG: CaptureConfig = {
  backgroundColor: '#050505',
  scale: 2,
  width: 1200,
  quality: 0.95,
};

/**
 * Capture a screenshot of a DOM element
 */
export async function captureElement(
  element: HTMLElement,
  momentId: string,
  sessionId: string,
  config: CaptureConfig = {}
): Promise<CapturedScreenshot | null> {
  const moment = getMomentById(momentId);
  if (!moment) {
    console.warn(`[DemoCapture] Unknown moment: ${momentId}`);
    return null;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Wait for the specified delay to let animations complete
    if (moment.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, moment.delay));
    }

    const dataUrl = await domToPng(element, {
      backgroundColor: finalConfig.backgroundColor,
      scale: finalConfig.scale,
      width: finalConfig.width,
      quality: finalConfig.quality,
    });

    const screenshot: CapturedScreenshot = {
      id: `${sessionId}-${momentId}-${Date.now()}`,
      momentId,
      moment,
      dataUrl,
      timestamp: Date.now(),
      width: finalConfig.width! * finalConfig.scale!,
      height: Math.round((element.offsetHeight / element.offsetWidth) * finalConfig.width! * finalConfig.scale!),
      sessionId,
    };

    console.log(`[DemoCapture] Captured: ${moment.label}`);
    return screenshot;
  } catch (error) {
    console.error(`[DemoCapture] Failed to capture ${momentId}:`, error);
    return null;
  }
}

/**
 * Capture by element ID
 */
export async function captureById(
  elementId: string,
  momentId: string,
  sessionId: string,
  config?: CaptureConfig
): Promise<CapturedScreenshot | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[DemoCapture] Element not found: ${elementId}`);
    return null;
  }
  return captureElement(element as HTMLElement, momentId, sessionId, config);
}

/**
 * Capture the current viewport/body
 */
export async function captureViewport(
  momentId: string,
  sessionId: string,
  config?: CaptureConfig
): Promise<CapturedScreenshot | null> {
  // Try to find a main capture container first
  const captureTarget =
    document.getElementById('demo-capture-root') ||
    document.getElementById('brandos-dashboard-capture') ||
    document.querySelector('main') ||
    document.body;

  return captureElement(captureTarget as HTMLElement, momentId, sessionId, config);
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert data URL to Blob for file operations
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Download a screenshot as a file
 */
export function downloadScreenshot(screenshot: CapturedScreenshot, filename?: string): void {
  const link = document.createElement('a');
  link.href = screenshot.dataUrl;
  link.download = filename || `${screenshot.momentId}-${screenshot.timestamp}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
