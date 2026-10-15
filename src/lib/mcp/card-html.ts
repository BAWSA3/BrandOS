/**
 * The BrandOS card: an MCP App view (ui://brandos/card.html) that Claude and
 * ChatGPT render inline in the chat for analyze_profile / analyze_post, so the
 * full breakdown always shows in BrandOS's own design instead of being
 * re-worded by the model.
 *
 * Self-contained HTML (no network: fonts + wordmark embedded, inline CSS/JS) speaking the
 * MCP Apps postMessage protocol (JSON-RPC 2.0 with the host):
 *   View -> Host  ui/initialize, ui/notifications/initialized,
 *                 ui/notifications/size-changed, ui/open-link
 *   Host -> View  ui/notifications/tool-result (structuredContent = CardData),
 *                 ui/notifications/host-context-changed (theme), ui/resource-teardown
 * All text is set with textContent (scan text is model output: never HTML).
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const CARD_URI = 'ui://brandos/card.html';

let built: Promise<string> | null = null;

/**
 * The card HTML with the brand fonts (Inter Tight, VCR OSD Mono) and the hero
 * wordmark embedded as data URIs: the view runs sandboxed with no network, so
 * nothing can load from mybrandos.app. Built once per server instance.
 */
export function cardHtml(): Promise<string> {
  built ??= (async () => {
    const [inter, vcr, day, night, white] = await Promise.all([
      readFile(join(process.cwd(), 'public', 'fonts', 'InterTight-latin.woff2')),
      readFile(join(process.cwd(), 'public', 'fonts', 'VCR_OSD_MONO_1.001.ttf')),
      readFile(join(process.cwd(), 'public', 'brand', 'wordmark-day-480.png')),
      readFile(join(process.cwd(), 'public', 'brand', 'wordmark-night-480.png')),
      readFile(join(process.cwd(), 'public', 'brand', 'wordmark-white-480.png')),
    ]);
    const faces =
      `@font-face { font-family: "Inter Tight"; font-weight: 100 900; font-display: block; src: url(data:font/woff2;base64,${inter.toString('base64')}) format("woff2"); }` +
      `@font-face { font-family: "VCR OSD Mono"; font-weight: 400; font-display: block; src: url(data:font/ttf;base64,${vcr.toString('base64')}) format("truetype"); }`;
    return CARD_HTML.replace('__FONT_FACES__', faces)
      .replace('__WORDMARK_DAY__', `data:image/png;base64,${day.toString('base64')}`)
      .replace('__WORDMARK_NIGHT__', `data:image/png;base64,${night.toString('base64')}`)
      .replace('__WORDMARK_WHITE__', `data:image/png;base64,${white.toString('base64')}`);
  })().catch((e) => {
    built = null;
    console.error('[mcp] card assets failed, serving without them:', e);
    return CARD_HTML.replace('__FONT_FACES__', '').replace(/__WORDMARK_(DAY|NIGHT)__/g, '');
  });
  return built;
}

export const CARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BrandOS</title>
<style>
  __FONT_FACES__
  :root {
    --bg: #F2EFE8; --panel: #FFFFFF; --ink: #0E0E0E; --muted: #6B6862; --rule: rgba(14,14,14,0.12);
    --track: rgba(14,14,14,0.08); --blue: #0047FF; --on-blue: #FFFFFF;
    --mono: "VCR OSD Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --big: "Inter Tight", "Helvetica Neue", Helvetica, Arial, sans-serif;
  }
  :root[data-theme="dark"] {
    --bg: #0B0D10; --panel: #12151A; --ink: #F2EFE8; --muted: #9A978F; --rule: rgba(242,239,232,0.14);
    --track: rgba(242,239,232,0.10); --blue: #3D6BFF;
  }
  /* The creator's skin (Settings → Dashboard) wins over the host theme; Bone follows the host. */
  :root[data-skin="night"] {
    --bg: #0B0D10; --panel: #12151A; --ink: #F2EFE8; --muted: #9A978F; --rule: rgba(242,239,232,0.14);
    --track: rgba(242,239,232,0.10); --blue: #3D6BFF; --on-blue: #FFFFFF;
  }
  :root[data-skin="klein"] {
    --bg: #0047FF; --panel: #0047FF; --ink: #FFFFFF; --muted: rgba(255,255,255,0.75); --rule: rgba(255,255,255,0.3);
    --track: rgba(255,255,255,0.22); --blue: #FFFFFF; --on-blue: #0047FF;
  }
  :root[data-skin="paper"] {
    --bg: #FFFFFF; --panel: #FFFFFF; --ink: #0A0A0A; --muted: #6B6B6B; --rule: rgba(14,14,14,0.16);
    --track: rgba(14,14,14,0.07); --blue: #0047FF; --on-blue: #FFFFFF;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: transparent; }
  body { font-family: var(--big); color: var(--ink); -webkit-font-smoothing: antialiased; }
  .card { background: var(--bg); border: 1px solid var(--rule); border-radius: 12px; padding: 20px; overflow: hidden; }
  .micro { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .brand { color: var(--blue); }
  .wm { height: 18px; width: auto; display: block; }
  .wm.night { display: none; }
  :root[data-theme="dark"] .wm.day { display: none; }
  :root[data-theme="dark"] .wm.night { display: block; }
  .wm.white { display: none; }
  :root[data-skin] .wm { display: none; }
  :root[data-skin="night"] .wm.night, :root[data-skin="paper"] .wm.day, :root[data-skin="klein"] .wm.white { display: block; }
  .who { display: flex; align-items: center; gap: 10px; }
  .chip { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
          padding: 4px 8px; border: 1px solid var(--blue); color: var(--blue); border-radius: 3px; white-space: nowrap; }
  .chip.fill { background: var(--blue); color: var(--on-blue); }
  .chip.ink { border-color: var(--ink); background: var(--ink); color: var(--bg); }
  .hero { display: grid; grid-template-columns: auto 1fr; gap: 20px; align-items: end; margin-top: 16px; }
  .score { font-size: 84px; line-height: 0.82; font-weight: 500; letter-spacing: -0.04em; color: var(--blue); }
  .score small { font-size: 16px; letter-spacing: 0; color: var(--muted); margin-left: 4px; }
  .arch { font-size: 22px; line-height: 1.1; font-weight: 500; letter-spacing: -0.01em; }
  .tag { margin-top: 4px; color: var(--muted); font-size: 14px; }
  .summary { margin-top: 16px; font-size: 14px; line-height: 1.55; }
  .section { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--rule); }
  .phases { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-top: 10px; }
  .phase .row { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
  .phase .row b { font-weight: 400; color: var(--ink); }
  .bar { height: 3px; background: var(--track); border-radius: 2px; margin-top: 6px; overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--ink); border-radius: 2px; }
  .phase.weak .row b, .phase.weak .row span { color: var(--blue); }
  .phase.weak .bar i { background: var(--blue); }
  .pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .pill { font-size: 12px; padding: 4px 9px; border: 1px solid var(--rule); border-radius: 999px; }
  .tabs { display: flex; gap: 4px; margin-top: 10px; border-bottom: 1px solid var(--rule); }
  .tab { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
         background: none; border: 0; padding: 8px 8px 9px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .tab[aria-selected="true"] { color: var(--blue); border-bottom-color: var(--blue); }
  .list { list-style: none; margin-top: 12px; }
  .list li { display: grid; grid-template-columns: 22px 1fr; gap: 6px; font-size: 14px; line-height: 1.5; padding: 4px 0; }
  .list li span:first-child { font-family: var(--mono); font-size: 11px; color: var(--blue); padding-top: 3px; }
  .quote { margin-top: 14px; font-size: 18px; line-height: 1.35; font-weight: 500; letter-spacing: -0.01em; }
  .why { margin-top: 10px; font-size: 14px; line-height: 1.55; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .meta .pill { color: var(--muted); }
  .next { border-left: 2px solid var(--blue); padding-left: 12px; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
  .btn { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer;
         padding: 10px 14px; border-radius: 4px; border: 1px solid var(--rule); background: transparent; color: var(--ink); }
  .btn.primary { background: var(--blue); border-color: var(--blue); color: var(--on-blue); }
  .btn:hover { border-color: var(--blue); }
  .foot { margin-top: 14px; }
  .empty { padding: 28px 4px; text-align: center; }
  @media (max-width: 420px) { .score { font-size: 64px; } .phases { grid-template-columns: 1fr; } .card { padding: 16px; } }
</style>
</head>
<body>
<div class="card" id="root"><div class="empty micro">BrandOS · reading…</div></div>
<script>
(function () {
  var root = document.getElementById('root');
  var WORDMARK = { day: '__WORDMARK_DAY__', night: '__WORDMARK_NIGHT__', white: '__WORDMARK_WHITE__' };
  var nextId = 1;
  var pending = {};

  function send(msg) { window.parent.postMessage(msg, '*'); }
  function request(method, params) {
    var id = nextId++;
    send({ jsonrpc: '2.0', id: id, method: method, params: params || {} });
    return new Promise(function (resolve) { pending[id] = resolve; });
  }
  function notify(method, params) { send({ jsonrpc: '2.0', method: method, params: params || {} }); }
  function setTheme(ctx) {
    var t = ctx && ctx.theme;
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  }
  function openLink(url) {
    if (typeof url === 'string' && /^https:\\/\\//.test(url)) request('ui/open-link', { url: url });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }
  function list(items, numbered, mark) {
    var ul = el('ul', 'list');
    (items || []).slice(0, 3).forEach(function (t, i) {
      var li = el('li');
      li.appendChild(el('span', '', numbered ? String(i + 1).padStart(2, '0') : mark));
      li.appendChild(el('span', '', t));
      ul.appendChild(li);
    });
    return ul;
  }
  function header(d, chip) {
    var top = el('div', 'top');
    var left = el('div', 'who');
    ['day', 'night', 'white'].forEach(function (m) {
      var img = el('img', 'wm ' + m);
      img.src = WORDMARK[m];
      img.alt = 'BrandOS';
      left.appendChild(img);
    });
    left.appendChild(el('span', 'micro', d.own ? 'Your brand' : '@' + d.handle));
    top.appendChild(left);
    if (chip) top.appendChild(chip);
    return top;
  }
  function actions(d) {
    var a = el('div', 'actions');
    var dash = el('button', 'btn primary', d.own ? 'Open my dashboard ↗' : 'Full brand read ↗');
    dash.onclick = function () { openLink(d.dashboardUrl); };
    a.appendChild(dash);
    if (d.postUrl) {
      var p = el('button', 'btn', 'View post on X ↗');
      p.onclick = function () { openLink(d.postUrl); };
      a.appendChild(p);
    }
    return a;
  }
  function foot(d) { return d.allowance ? el('div', 'micro foot', d.allowance) : null; }

  function renderProfile(d) {
    var c = document.createDocumentFragment();
    c.appendChild(header(d, d.influence ? el('span', 'chip', d.influence) : null));
    var hero = el('div', 'hero');
    var s = el('div', 'score', d.score);
    s.appendChild(el('small', '', '/100'));
    hero.appendChild(s);
    var a = el('div');
    if (d.archetype) a.appendChild(el('div', 'arch', d.archetype.name));
    if (d.archetype && d.archetype.tagline) a.appendChild(el('div', 'tag', d.archetype.tagline));
    hero.appendChild(a);
    c.appendChild(hero);
    if (d.summary) c.appendChild(el('p', 'summary', d.summary));

    if (d.phases) {
      var sec = el('div', 'section');
      sec.appendChild(el('div', 'micro', 'Brand phases'));
      var g = el('div', 'phases');
      var keys = [['define', 'Define'], ['check', 'Check'], ['generate', 'Generate'], ['scale', 'Scale']];
      var weakest = keys.reduce(function (w, k) { return d.phases[k[0]] < d.phases[w[0]] ? k : w; });
      keys.forEach(function (k) {
        var v = Math.max(0, Math.min(100, Number(d.phases[k[0]]) || 0));
        var p = el('div', 'phase' + (k === weakest ? ' weak' : ''));
        var row = el('div', 'row');
        row.appendChild(el('span', '', k[1] + (k === weakest ? ' · weakest' : '')));
        row.appendChild(el('b', '', v));
        p.appendChild(row);
        var bar = el('div', 'bar'); var fill = el('i'); fill.style.width = v + '%';
        bar.appendChild(fill); p.appendChild(bar);
        g.appendChild(p);
      });
      sec.appendChild(g);
      c.appendChild(sec);
    }
    if (d.pillars && d.pillars.length) {
      var ps = el('div', 'section');
      ps.appendChild(el('div', 'micro', 'Content pillars'));
      var pills = el('div', 'pills');
      d.pillars.slice(0, 4).forEach(function (t) { pills.appendChild(el('span', 'pill', t)); });
      ps.appendChild(pills);
      c.appendChild(ps);
    }
    var groups = [
      ['Working', d.strengths, false, '✓'],
      ['Holding back', d.improvements, false, '~'],
      ['Next moves', d.nextMoves, true, '→'],
    ].filter(function (g) { return g[1] && g[1].length; });
    if (groups.length) {
      var ts = el('div', 'section');
      var tabs = el('div', 'tabs'); tabs.setAttribute('role', 'tablist');
      var body = el('div');
      function show(i) {
        Array.prototype.forEach.call(tabs.children, function (b, j) { b.setAttribute('aria-selected', String(i === j)); });
        body.replaceChildren(list(groups[i][1], groups[i][2], groups[i][3]));
        resize();
      }
      groups.forEach(function (g, i) {
        var b = el('button', 'tab', g[0]); b.setAttribute('role', 'tab');
        b.onclick = function () { show(i); };
        tabs.appendChild(b);
      });
      ts.appendChild(tabs); ts.appendChild(body);
      c.appendChild(ts);
      show(groups.length > 2 ? 2 : 0);
    }
    c.appendChild(actions(d));
    var f = foot(d); if (f) c.appendChild(f);
    return c;
  }

  function renderPost(d) {
    var c = document.createDocumentFragment();
    var verdict = el('span', 'chip ' + (d.fit >= 80 ? 'fill' : 'ink'), d.verdict + ' · ' + d.fit);
    c.appendChild(header(d, verdict));
    var hero = el('div', 'hero');
    var s = el('div', 'score', d.fit); s.appendChild(el('small', '', 'fit'));
    hero.appendChild(s);
    var a = el('div');
    a.appendChild(el('div', 'arch', d.verdict));
    if (d.performance) a.appendChild(el('div', 'tag', d.performance));
    hero.appendChild(a);
    c.appendChild(hero);
    if (d.excerpt) c.appendChild(el('p', 'quote', '“' + d.excerpt + '”'));
    if (d.why) c.appendChild(el('p', 'why', d.why));
    var meta = el('div', 'meta');
    [d.voice && 'Voice: ' + d.voice, d.format && 'Format: ' + d.format].filter(Boolean)
      .forEach(function (t) { meta.appendChild(el('span', 'pill', t)); });
    if (meta.children.length) c.appendChild(meta);
    if (d.hook) {
      var h = el('div', 'section');
      h.appendChild(el('div', 'micro', 'Hook'));
      h.appendChild(el('p', 'why', d.hook));
      c.appendChild(h);
    }
    if ((d.fits && d.fits.length) || (d.misses && d.misses.length)) {
      var fm = el('div', 'section');
      if (d.fits && d.fits.length) { fm.appendChild(el('div', 'micro', 'What fit')); fm.appendChild(list(d.fits, false, '✓')); }
      if (d.misses && d.misses.length) {
        var m = el('div', 'micro', 'What drifted'); m.style.marginTop = '10px';
        fm.appendChild(m); fm.appendChild(list(d.misses, false, '~'));
      }
      c.appendChild(fm);
    }
    if (d.sharpen && d.sharpen.length) {
      var n = el('div', 'section');
      var inner = el('div', 'next');
      var lbl = el('div', 'micro', 'Next time'); lbl.style.color = 'var(--blue)';
      inner.appendChild(lbl); inner.appendChild(list(d.sharpen, true));
      n.appendChild(inner); c.appendChild(n);
    }
    if (d.brand) {
      var b = el('div', 'micro foot', (d.own ? 'Your brand' : '@' + d.handle + "'s brand") + ': ' + d.brand);
      c.appendChild(b);
    }
    c.appendChild(actions(d));
    var f = foot(d); if (f) c.appendChild(f);
    return c;
  }

  function render(data) {
    if (!data || (data.kind !== 'profile' && data.kind !== 'post')) return;
    if (data.skin === 'night' || data.skin === 'klein' || data.skin === 'paper') {
      document.documentElement.setAttribute('data-skin', data.skin);
    } else {
      document.documentElement.removeAttribute('data-skin');
    }
    root.replaceChildren(data.kind === 'profile' ? renderProfile(data) : renderPost(data));
    resize();
  }

  var lastH = 0;
  function resize() {
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (h && h !== lastH) { lastH = h; notify('ui/notifications/size-changed', { height: h }); }
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(document.body);

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var m = e.data;
    if (!m || m.jsonrpc !== '2.0') return;
    if (m.id != null && pending[m.id] && !m.method) {
      var cb = pending[m.id]; delete pending[m.id]; cb(m.result); return;
    }
    if (m.method === 'ui/notifications/tool-result') render(m.params && m.params.structuredContent);
    else if (m.method === 'ui/notifications/host-context-changed') setTheme(m.params);
    else if (m.method === 'ui/resource-teardown' && m.id != null) send({ jsonrpc: '2.0', id: m.id, result: {} });
  });

  request('ui/initialize', {
    appInfo: { name: 'brandos-card', version: '1.0.0' },
    appCapabilities: {},
    protocolVersion: '2026-01-26',
  }).then(function (r) {
    setTheme(r && r.hostContext);
    notify('ui/notifications/initialized', {});
    resize();
  });
})();
</script>
</body>
</html>`;
