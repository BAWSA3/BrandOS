// BrandOS for Chrome — the scoring chip in X's composer.
// A small chip sits next to X's Post button. As you write (or when you click,
// if "score as I type" is off), the draft is sent to BrandOS and scored
// against your brand: score + the top fix on the chip, the rest on click.
// Only the composer's text (and whether media is attached) is ever sent, and
// only once it's 12+ characters and you've paused for a moment.
(function () {
  'use strict';
  var core = window.BrandOSCore;
  if (!core || window.__brandosComposer) return;
  window.__brandosComposer = true;

  var DEBOUNCE_MS = 1500;
  var KLEIN = '#0047FF';
  var mounted = new WeakMap(); // composer root -> chip controller
  var auto = true;

  chrome.storage.sync.get({ autoScore: true }, function (v) {
    auto = v.autoScore !== false;
  });
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'sync' && changes.autoScore) auto = changes.autoScore.newValue !== false;
  });

  // ── the panel (one, shared; fixed-position so X's overflow can't clip it) ──
  var panelHost = document.createElement('div');
  panelHost.style.cssText = 'position:fixed;z-index:2147483646;top:0;left:0;display:none;';
  var panelRoot = panelHost.attachShadow({ mode: 'closed' });
  panelRoot.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    '.p{width:320px;max-width:calc(100vw - 24px);background:#fff;color:#0F1419;border:1px solid #EFF3F4;border-radius:16px;box-shadow:0 8px 28px rgba(15,20,25,.18);padding:14px 16px;font:15px/20px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
    '.top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}' +
    '.n{font-size:36px;line-height:1;font-weight:700;color:' + KLEIN + ';letter-spacing:-.03em}' +
    '.of{font-size:13px;color:#536471;margin-left:4px}' +
    '.v{font:10px/14px ui-monospace,"JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#536471;text-align:right}' +
    '.r{margin-top:8px;font-size:14px}' +
    'ol{margin:10px 0 0;padding:0;list-style:none}' +
    'li{display:flex;gap:8px;margin-top:6px;font-size:14px;line-height:19px}' +
    'li b{color:' + KLEIN + ';font-weight:600}' +
    '.m{font:9px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#536471;margin-left:4px}' +
    '.s{margin-top:10px;font-size:13px;line-height:18px;color:#536471}' +
    '.f{margin-top:12px;display:flex;justify-content:space-between;font-size:12px;color:#536471}' +
    '.f a{color:' + KLEIN + ';font-weight:600;text-decoration:none}' +
    '</style><div class="p" role="dialog" aria-label="BrandOS draft score"></div>';
  var panel = panelRoot.querySelector('.p');
  document.documentElement.appendChild(panelHost);
  var openFor = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showPanel(ctrl) {
    var r = ctrl.state.result;
    if (!r) return;
    var fixes = (r.fixes || [])
      .map(function (f, i) {
        return (
          '<li><b>' + (i + 1) + '.</b><span>' + esc(f.text) +
          (f.source === 'data' ? '<span class="m">measured</span>' : '') + '</span></li>'
        );
      })
      .join('');
    panel.innerHTML =
      '<div class="top"><div><span class="n">' + esc(r.score) + '</span><span class="of">/100</span></div>' +
      '<div class="v">' + esc(r.verdict) + '<br>' + esc(r.format) +
      (r.formatLift != null ? ' · ' + esc(r.formatLift) + '× avg' : '') + '</div></div>' +
      (r.reach ? '<div class="r">' + esc(core.reachLine(r.reach)) + '</div>' : '') +
      (fixes ? '<ol>' + fixes + '</ol>' : '') +
      (r.voice ? '<div class="s">Voice: ' + esc(r.voice) + '</div>' : '') +
      '<div class="f"><span>From your last ' + esc(r.basedOn) + ' posts</span>' +
      '<a href="https://mybrandos.app/dashboard" target="_blank" rel="noopener">BrandOS →</a></div>';
    var box = ctrl.host.getBoundingClientRect();
    panelHost.style.display = 'block';
    var w = Math.min(320, window.innerWidth - 24);
    var left = Math.max(12, Math.min(box.right - w, window.innerWidth - w - 12));
    var h = panel.getBoundingClientRect().height;
    var top = box.top - h - 8 >= 8 ? box.top - h - 8 : box.bottom + 8;
    panelHost.style.left = left + 'px';
    panelHost.style.top = top + 'px';
    openFor = ctrl;
  }

  function hidePanel() {
    panelHost.style.display = 'none';
    openFor = null;
  }
  document.addEventListener('mousedown', function (e) {
    if (openFor && !e.composedPath().includes(panelHost) && !e.composedPath().includes(openFor.host))
      hidePanel();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hidePanel();
  });
  window.addEventListener('scroll', hidePanel, true);

  // ── one chip per composer ──
  function mount(composer) {
    var host = document.createElement('span');
    host.setAttribute('data-brandos-chip', '');
    host.style.cssText = 'display:inline-flex;align-items:center;margin:0 8px;flex:0 0 auto;';
    var shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      'button{display:inline-flex;align-items:center;gap:6px;max-width:220px;height:30px;padding:0 10px;border-radius:999px;border:1px solid #CFD9DE;background:#fff;color:#0F1419;cursor:pointer;font:13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;white-space:nowrap}' +
      'button:hover{border-color:' + KLEIN + '}' +
      'button:focus-visible{outline:2px solid ' + KLEIN + ';outline-offset:2px}' +
      '.l{font-weight:700;color:' + KLEIN + ';font-variant-numeric:tabular-nums}' +
      '.d{overflow:hidden;text-overflow:ellipsis;color:#536471}' +
      '.good .l{color:' + KLEIN + '}.mid .l{color:#B7791F}.low .l{color:#C53030}' +
      '.action{border-color:' + KLEIN + '}.action .d{color:' + KLEIN + '}' +
      '</style><button type="button" aria-live="polite"><span class="l"></span><span class="d"></span></button>';
    var button = shadow.querySelector('button');
    var ctrl = { host: host, composer: composer, state: { kind: 'idle', auto: auto }, lastKey: null, timer: 0, seq: 0 };

    function render() {
      var v = core.chipView(Object.assign({ auto: auto }, ctrl.state));
      button.className = v.tone;
      button.querySelector('.l').textContent = v.label;
      button.querySelector('.d').textContent = v.detail;
      button.title =
        ctrl.state.kind === 'scored'
          ? 'BrandOS draft score: ' + ctrl.state.result.score + '/100. Click for the fixes.'
          : 'BrandOS: score this draft against your brand';
    }

    function score(force) {
      var text = core.readDraft(ctrl.composer);
      var media = core.hasMedia(ctrl.composer);
      if (core.chars(core.normalizeDraft(text)) < core.MIN_CHARS) {
        ctrl.state = { kind: 'short' };
        ctrl.lastKey = null;
        return render();
      }
      if (!force && !core.shouldScore(text, media, ctrl.lastKey)) return;
      var key = core.draftKey(text, media);
      var seq = ++ctrl.seq;
      ctrl.state = { kind: 'loading' };
      render();
      chrome.runtime.sendMessage(
        { type: 'SCORE_DRAFT', text: core.normalizeDraft(text), hasMedia: media, tzOffsetMin: -new Date().getTimezoneOffset() },
        function (res) {
          if (seq !== ctrl.seq) return; // a newer draft is being scored
          if (chrome.runtime.lastError || !res) ctrl.state = { kind: 'error' };
          else if (res.ok) {
            ctrl.state = { kind: 'scored', result: res.result };
            ctrl.lastKey = key;
          } else if (res.status === 401) ctrl.state = { kind: 'signed-out' };
          else if (res.status === 402) ctrl.state = { kind: 'pro' };
          else if (res.status === 429) ctrl.state = { kind: 'limited' };
          else ctrl.state = { kind: 'error' };
          render();
          if (openFor === ctrl && ctrl.state.kind === 'scored') showPanel(ctrl);
        }
      );
    }

    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var k = ctrl.state.kind;
      if (k === 'signed-out') return void window.open('https://mybrandos.app/extension-auth', '_blank', 'noopener');
      if (k === 'pro') return void window.open('https://mybrandos.app/pricing', '_blank', 'noopener');
      if (k === 'scored') return openFor === ctrl ? hidePanel() : showPanel(ctrl);
      score(true);
    });

    function onEdit() {
      if (ctrl.state.kind === 'scored' && openFor === ctrl) hidePanel();
      clearTimeout(ctrl.timer);
      if (!auto) {
        var text = core.readDraft(ctrl.composer);
        if (core.draftKey(text, core.hasMedia(ctrl.composer)) !== ctrl.lastKey) {
          ctrl.state = { kind: 'idle' };
          render();
        }
        return;
      }
      ctrl.timer = setTimeout(function () {
        score(false);
      }, DEBOUNCE_MS);
    }
    composer.root.addEventListener('input', onEdit, true);
    composer.root.addEventListener('paste', onEdit, true);

    var a = core.chipAnchor(composer);
    a.parent.insertBefore(host, a.before);
    render();
    return ctrl;
  }

  function scan() {
    core.findComposers(document).forEach(function (c) {
      var ctrl = mounted.get(c.root);
      if (ctrl && ctrl.host.isConnected) {
        ctrl.composer = c; // X re-renders boxes (threads add boxes)
        return;
      }
      mounted.set(c.root, mount(c));
    });
  }

  var pending = 0;
  new MutationObserver(function () {
    if (pending) return;
    pending = setTimeout(function () {
      pending = 0;
      scan();
    }, 300);
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
