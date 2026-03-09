// chrome.storage.local cache helpers with 24h TTL

import { CACHE_TTL_MS, MAX_CACHED_ENTRIES } from './constants.js';

const CACHE_KEY_PREFIX = 'score:';
const CACHE_INDEX_KEY = 'brandos_cache_index';

/**
 * Get a cached score for a username
 * @returns {Promise<object|null>} Cached score data or null if expired/missing
 */
export async function getCachedScore(username) {
  const key = CACHE_KEY_PREFIX + username.toLowerCase();
  const result = await chrome.storage.local.get(key);
  const entry = result[key];

  if (!entry) return null;

  // Check TTL
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    await chrome.storage.local.remove(key);
    return null;
  }

  return entry.data;
}

/**
 * Store a score in cache
 */
export async function setCachedScore(username, data) {
  const key = CACHE_KEY_PREFIX + username.toLowerCase();
  const entry = { data, cachedAt: Date.now() };

  await chrome.storage.local.set({ [key]: entry });

  // Maintain cache index for eviction
  await updateCacheIndex(username.toLowerCase());
}

/**
 * Get multiple cached scores at once
 * @returns {Promise<Record<string, object|null>>}
 */
export async function getCachedScoresBatch(usernames) {
  const keys = usernames.map(u => CACHE_KEY_PREFIX + u.toLowerCase());
  const results = await chrome.storage.local.get(keys);
  const output = {};

  for (const username of usernames) {
    const key = CACHE_KEY_PREFIX + username.toLowerCase();
    const entry = results[key];
    if (entry && (Date.now() - entry.cachedAt) <= CACHE_TTL_MS) {
      output[username.toLowerCase()] = entry.data;
    } else {
      output[username.toLowerCase()] = null;
    }
  }

  return output;
}

/**
 * Track cached usernames for eviction when over limit
 */
async function updateCacheIndex(username) {
  const result = await chrome.storage.local.get(CACHE_INDEX_KEY);
  let index = result[CACHE_INDEX_KEY] || [];

  // Remove if already exists (will re-add at end)
  index = index.filter(u => u !== username);
  index.push(username);

  // Evict oldest entries if over limit
  if (index.length > MAX_CACHED_ENTRIES) {
    const toEvict = index.splice(0, index.length - MAX_CACHED_ENTRIES);
    const keysToRemove = toEvict.map(u => CACHE_KEY_PREFIX + u);
    await chrome.storage.local.remove(keysToRemove);
  }

  await chrome.storage.local.set({ [CACHE_INDEX_KEY]: index });
}

/**
 * Clear all cached scores
 */
export async function clearCache() {
  const result = await chrome.storage.local.get(CACHE_INDEX_KEY);
  const index = result[CACHE_INDEX_KEY] || [];
  const keysToRemove = index.map(u => CACHE_KEY_PREFIX + u);
  keysToRemove.push(CACHE_INDEX_KEY);
  await chrome.storage.local.remove(keysToRemove);
}
