// BrandOS for Chrome — background service worker.
// Holds the member's scoped extension token (chrome.storage.local) and makes
// the one network call the extension makes: POST mybrandos.app/api/extension/score.
'use strict';

var API = 'https://mybrandos.app';
var TOKEN_RE = /^bx1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function saveToken(msg) {
  if (!msg || typeof msg.token !== 'string' || !TOKEN_RE.test(msg.token)) return Promise.resolve(false);
  return chrome.storage.local
    .set({
      brandos_token: msg.token,
      brandos_expires: typeof msg.expiresAt === 'number' ? msg.expiresAt : null,
      brandos_handle: typeof msg.handle === 'string' ? msg.handle.slice(0, 15) : null,
    })
    .then(function () {
      return true;
    });
}

function fromConnectPage(url) {
  return typeof url === 'string' && url.indexOf(API + '/extension-auth') === 0;
}

async function scoreDraft(msg) {
  var stored = await chrome.storage.local.get(['brandos_token', 'brandos_expires']);
  var token = stored.brandos_token;
  if (!token || (stored.brandos_expires && stored.brandos_expires < Date.now()))
    return { ok: false, status: 401 };
  try {
    var res = await fetch(API + '/api/extension/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        text: String(msg.text || '').slice(0, 2000),
        hasMedia: msg.hasMedia === true,
        tzOffsetMin: typeof msg.tzOffsetMin === 'number' ? msg.tzOffsetMin : 0,
      }),
    });
    if (res.status === 401) await chrome.storage.local.remove(['brandos_token', 'brandos_expires']);
    var json = await res.json().catch(function () {
      return {};
    });
    return res.ok ? { ok: true, result: json } : { ok: false, status: res.status, error: json.error };
  } catch (e) {
    return { ok: false, status: 0 };
  }
}

// from our own content scripts and popup
chrome.runtime.onMessage.addListener(function (msg, sender, reply) {
  if (!msg || sender.id !== chrome.runtime.id) return false;
  if (msg.type === 'SCORE_DRAFT') {
    scoreDraft(msg).then(reply);
    return true;
  }
  if (msg.type === 'SAVE_TOKEN') {
    if (!fromConnectPage(sender.url)) return false;
    saveToken(msg).then(function (ok) {
      reply({ ok: ok });
    });
    return true;
  }
  if (msg.type === 'GET_STATUS') {
    chrome.storage.local.get(['brandos_token', 'brandos_expires', 'brandos_handle']).then(function (s) {
      var live = !!s.brandos_token && !(s.brandos_expires && s.brandos_expires < Date.now());
      reply({ connected: live, handle: live ? s.brandos_handle || null : null });
    });
    return true;
  }
  if (msg.type === 'SIGN_OUT') {
    chrome.storage.local.remove(['brandos_token', 'brandos_expires', 'brandos_handle']).then(function () {
      reply({ ok: true });
    });
    return true;
  }
  return false;
});

// from mybrandos.app/extension-auth (externally_connectable, published build)
chrome.runtime.onMessageExternal.addListener(function (msg, sender, reply) {
  if (!msg || msg.type !== 'BRANDOS_EXTENSION_TOKEN' || !fromConnectPage(sender.url)) return false;
  saveToken(msg).then(function (ok) {
    reply({ ok: ok });
  });
  return true;
});
