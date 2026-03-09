// BrandOS Chrome Extension — Background Service Worker

import { getCachedScore, setCachedScore, clearCache } from '../utils/cache.js';
import { MSG, FETCH_THROTTLE_MS } from '../utils/constants.js';

// ─── State ───────────────────────────────────────────────────────────────────
// NOTE: Service worker can be killed after 5min idle. All persistent state
// lives in chrome.storage.local. These Maps are ephemeral optimizations.

const inFlightRequests = new Map(); // username -> Promise (dedup)
let lastRequestTime = 0;

// ─── API URL Helper ──────────────────────────────────────────────────────────

async function getApiUrl() {
  const result = await chrome.storage.local.get('brandos_api_url');
  return result.brandos_api_url || 'http://localhost:3000';
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────

async function getAuthTokens() {
  const result = await chrome.storage.local.get(['brandos_access_token', 'brandos_refresh_token']);
  return {
    accessToken: result.brandos_access_token || null,
    refreshToken: result.brandos_refresh_token || null,
  };
}

async function saveAuthTokens(accessToken, refreshToken) {
  await chrome.storage.local.set({
    brandos_access_token: accessToken,
    brandos_refresh_token: refreshToken,
  });
}

async function clearAuthTokens() {
  await chrome.storage.local.remove(['brandos_access_token', 'brandos_refresh_token', 'brandos_user']);
}

async function validateToken() {
  const { accessToken } = await getAuthTokens();
  if (!accessToken) return null;

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/api/extension/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
      await clearAuthTokens();
      return null;
    }

    const data = await response.json();
    if (data.valid && data.user) {
      await chrome.storage.local.set({ brandos_user: data.user });
      return data.user;
    }

    await clearAuthTokens();
    return null;
  } catch {
    return null;
  }
}

// ─── Score Fetching ──────────────────────────────────────────────────────────

async function fetchScore(username) {
  // Dedup: if already fetching this username, return existing promise
  if (inFlightRequests.has(username)) {
    return inFlightRequests.get(username);
  }

  const promise = (async () => {
    // Check cache first
    const cached = await getCachedScore(username);
    if (cached) return cached;

    // Throttle
    const now = Date.now();
    const wait = FETCH_THROTTLE_MS - (now - lastRequestTime);
    if (wait > 0) {
      await new Promise(r => setTimeout(r, wait));
    }
    lastRequestTime = Date.now();

    // Fetch from API
    const { accessToken } = await getAuthTokens();
    if (!accessToken) {
      return { error: 'not_authenticated' };
    }

    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/api/extension/score?username=${encodeURIComponent(username)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (response.status === 401) {
      await clearAuthTokens();
      return { error: 'not_authenticated' };
    }

    if (response.status === 429) {
      return { error: 'rate_limited' };
    }

    if (!response.ok) {
      return { error: 'fetch_failed' };
    }

    const data = await response.json();
    await setCachedScore(username, data);
    return data;
  })();

  inFlightRequests.set(username, promise);
  try {
    return await promise;
  } finally {
    inFlightRequests.delete(username);
  }
}

// ─── Message Handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

// Handle messages from externally_connectable (the BrandOS web app)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_TOKENS' || message.type === 'BRANDOS_AUTH_TOKENS') {
    saveAuthTokens(message.accessToken, message.refreshToken).then(() => {
      validateToken().then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case MSG.GET_SCORE: {
      const result = await fetchScore(message.username);
      return { type: MSG.SCORE_RESULT, username: message.username, data: result };
    }

    case MSG.GET_SCORES_BATCH: {
      const results = {};
      const promises = message.usernames.map(async (username) => {
        results[username] = await fetchScore(username);
      });
      await Promise.all(promises);
      return { type: MSG.SCORE_RESULT, batch: true, data: results };
    }

    case MSG.CHECK_AUTH: {
      const user = await validateToken();
      return { authenticated: !!user, user };
    }

    case MSG.LOGIN: {
      const apiUrl = await getApiUrl();
      // Open the extension auth page in a new tab
      chrome.tabs.create({ url: `${apiUrl}/extension-auth` });
      return { ok: true };
    }

    case MSG.LOGOUT: {
      await clearAuthTokens();
      await clearCache();
      return { ok: true };
    }

    default:
      return { error: 'unknown_message_type' };
  }
}

// ─── Install/Update ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default API URL
    chrome.storage.local.set({ brandos_api_url: 'http://localhost:3000' });
  }
});
