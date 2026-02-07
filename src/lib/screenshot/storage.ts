/**
 * IndexedDB Storage for Demo Screenshots
 * Persists captured screenshots for export to Remotion
 */

import type { CapturedScreenshot } from './capture';

const DB_NAME = 'brandos-demo-captures';
const DB_VERSION = 1;
const STORE_NAME = 'screenshots';
const SESSIONS_STORE = 'sessions';

export interface DemoSession {
  id: string;
  startedAt: number;
  completedAt?: number;
  captureCount: number;
  username?: string;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB connection
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Screenshots store with sessionId index
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const screenshotStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        screenshotStore.createIndex('sessionId', 'sessionId', { unique: false });
        screenshotStore.createIndex('momentId', 'momentId', { unique: false });
        screenshotStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Sessions store
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
      }
    };
  });
}

/**
 * Save a screenshot to IndexedDB
 */
export async function saveScreenshot(screenshot: CapturedScreenshot): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(screenshot);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all screenshots for a session
 */
export async function getSessionScreenshots(sessionId: string): Promise<CapturedScreenshot[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sessionId');
    const request = index.getAll(sessionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const screenshots = request.result as CapturedScreenshot[];
      // Sort by timestamp
      screenshots.sort((a, b) => a.timestamp - b.timestamp);
      resolve(screenshots);
    };
  });
}

/**
 * Delete all screenshots for a session
 */
export async function deleteSessionScreenshots(sessionId: string): Promise<void> {
  const screenshots = await getSessionScreenshots(sessionId);
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let pending = screenshots.length;
    if (pending === 0) {
      resolve();
      return;
    }

    screenshots.forEach(screenshot => {
      const request = store.delete(screenshot.id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        pending--;
        if (pending === 0) resolve();
      };
    });
  });
}

/**
 * Save a demo session
 */
export async function saveSession(session: DemoSession): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.put(session);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all sessions
 */
export async function getAllSessions(): Promise<DemoSession[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readonly');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const sessions = request.result as DemoSession[];
      sessions.sort((a, b) => b.startedAt - a.startedAt);
      resolve(sessions);
    };
  });
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<DemoSession | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readonly');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.get(sessionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete a session and its screenshots
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await deleteSessionScreenshots(sessionId);

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.delete(sessionId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get total storage usage estimate
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { used: 0, quota: 0 };
}

/**
 * Clear all demo data (screenshots and sessions)
 */
export async function clearAllDemoData(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME, SESSIONS_STORE], 'readwrite');

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    transaction.objectStore(STORE_NAME).clear();
    transaction.objectStore(SESSIONS_STORE).clear();
  });
}
