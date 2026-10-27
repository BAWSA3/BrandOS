// BrandOS for Chrome — runs only on https://mybrandos.app/extension-auth.
// When the page can't reach the extension directly (an unpacked build without
// a fixed id), it posts the scoped extension token to its own window; this
// picks it up and passes it to the extension. Accepts only messages from this
// page itself, of the expected shape.
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.source !== window || e.origin !== 'https://mybrandos.app') return;
    var d = e.data;
    if (!d || d.type !== 'BRANDOS_EXTENSION_TOKEN') return;
    if (typeof d.token !== 'string' || !/^bx1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(d.token)) return;
    chrome.runtime.sendMessage({
      type: 'SAVE_TOKEN',
      token: d.token,
      expiresAt: typeof d.expiresAt === 'number' ? d.expiresAt : null,
      handle: typeof d.handle === 'string' ? d.handle.slice(0, 15) : null,
    });
  });
})();
