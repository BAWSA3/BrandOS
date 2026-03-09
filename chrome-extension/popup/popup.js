// BrandOS Extension — Popup Logic

import { MSG } from '../utils/constants.js';

const $ = (sel) => document.querySelector(sel);

// Views
const viewLogin = $('#view-login');
const viewMain = $('#view-main');

// Elements
const btnLogin = $('#btn-login');
const btnLogout = $('#btn-logout');
const btnClearCache = $('#btn-clear-cache');
const userAvatar = $('#user-avatar');
const userName = $('#user-name');
const userHandle = $('#user-handle');
const statCached = $('#stat-cached');
const toggleBadges = $('#toggle-badges');
const inputApiUrl = $('#input-api-url');

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  // Load settings
  const stored = await chrome.storage.local.get(['brandos_badges_enabled', 'brandos_api_url']);
  toggleBadges.checked = stored.brandos_badges_enabled !== false;
  inputApiUrl.value = stored.brandos_api_url || 'http://localhost:3000';

  // Count cached entries
  const allStorage = await chrome.storage.local.get(null);
  const cachedCount = Object.keys(allStorage).filter(k => k.startsWith('score:')).length;
  statCached.textContent = cachedCount;

  // Check auth
  chrome.runtime.sendMessage({ type: MSG.CHECK_AUTH }, (response) => {
    if (chrome.runtime.lastError) {
      showView('login');
      return;
    }

    if (response?.authenticated && response.user) {
      showUser(response.user);
      showView('main');
    } else {
      showView('login');
    }
  });
}

function showView(name) {
  viewLogin.classList.toggle('hidden', name !== 'login');
  viewMain.classList.toggle('hidden', name !== 'main');
}

function showUser(user) {
  if (user.avatar) {
    userAvatar.src = user.avatar;
    userAvatar.style.display = 'block';
  } else {
    userAvatar.style.display = 'none';
  }
  userName.textContent = user.name || user.xUsername || '';
  userHandle.textContent = user.xUsername ? `@${user.xUsername}` : '';
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

btnLogin.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: MSG.LOGIN });
  window.close();
});

btnLogout.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: MSG.LOGOUT }, () => {
    showView('login');
  });
});

btnClearCache.addEventListener('click', async () => {
  // Clear score cache entries
  const allStorage = await chrome.storage.local.get(null);
  const cacheKeys = Object.keys(allStorage).filter(k => k.startsWith('score:'));
  cacheKeys.push('brandos_cache_index');
  await chrome.storage.local.remove(cacheKeys);
  statCached.textContent = '0';
  btnClearCache.textContent = 'Cleared!';
  setTimeout(() => { btnClearCache.textContent = 'Clear Cache'; }, 1500);
});

toggleBadges.addEventListener('change', () => {
  chrome.storage.local.set({ brandos_badges_enabled: toggleBadges.checked });
});

inputApiUrl.addEventListener('change', () => {
  const url = inputApiUrl.value.replace(/\/+$/, '');
  chrome.storage.local.set({ brandos_api_url: url });
});

// ─── Start ───────────────────────────────────────────────────────────────────

init();
