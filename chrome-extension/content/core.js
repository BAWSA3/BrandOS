// BrandOS for Chrome — composer logic (no chrome.* calls, no network).
// Loaded before content.js on x.com; also loaded by the tests
// (scripts/test-extension.ts in Node, chrome-extension/test/fixture.html in a
// browser), so it only touches the DOM it is given.
(function (root) {
  'use strict';

  var MIN_CHARS = 12;
  var MAX_CHARS = 2000;
  var TEXTBOX = '[data-testid^="tweetTextarea_"][role="textbox"]';

  function chars(s) {
    return Array.from(s || '').length;
  }

  /** The draft as the member wrote it: no non-breaking spaces, no trailing spaces. */
  function normalizeDraft(s) {
    return String(s || '')
      .replace(/ /g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function draftKey(text, hasMedia) {
    return (hasMedia ? '1' : '0') + ':' + normalizeDraft(text);
  }

  /** Worth a request: long enough, not too long, and not the draft we last scored. */
  function shouldScore(text, hasMedia, lastKey) {
    var t = normalizeDraft(text);
    var n = chars(t);
    if (n < MIN_CHARS || n > MAX_CHARS) return false;
    return draftKey(t, hasMedia) !== lastKey;
  }

  function isPostBox(el) {
    var id = el.getAttribute('data-testid') || '';
    return /^tweetTextarea_\d+$/.test(id);
  }

  /**
   * X's composers in `doc`: the home timeline box, the compose modal, reply
   * boxes. Each is the nearest ancestor holding both a post box and X's
   * toolbar; a thread's boxes share one composer.
   */
  function findComposers(doc) {
    var boxes = Array.prototype.filter.call(doc.querySelectorAll(TEXTBOX), isPostBox);
    var composers = [];
    boxes.forEach(function (box) {
      var node = box.parentElement;
      for (var depth = 0; node && depth < 40; depth++, node = node.parentElement) {
        var toolbar = node.querySelector('[data-testid="toolBar"]');
        if (toolbar) {
          var existing = composers.filter(function (c) {
            return c.root === node;
          })[0];
          if (existing) existing.boxes.push(box);
          else composers.push({ root: node, toolbar: toolbar, boxes: [box] });
          return;
        }
      }
    });
    return composers;
  }

  /** The composer's draft; a thread is numbered 1/, 2/ … so it's scored as one. */
  function readDraft(composer) {
    var parts = composer.boxes
      .map(function (b) {
        return normalizeDraft(b.innerText != null ? b.innerText : b.textContent);
      })
      .filter(Boolean);
    if (parts.length <= 1) return parts[0] || '';
    return parts
      .map(function (p, i) {
        return i + 1 + '/ ' + p;
      })
      .join('\n\n');
  }

  /** An image, video or GIF attached in this composer. */
  function hasMedia(composer) {
    var a = composer.root.querySelector('[data-testid="attachments"]');
    return !!(a && a.querySelector('img, video, [data-testid="tweetPhoto"]'));
  }

  /** Where the chip goes: before the Post button's slot in the toolbar. */
  function chipAnchor(composer) {
    var tb = composer.toolbar;
    var btn = tb.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
    if (!btn) return { parent: tb, before: null };
    var node = btn;
    while (node.parentElement && node.parentElement !== tb) node = node.parentElement;
    return node.parentElement === tb ? { parent: tb, before: node } : { parent: tb, before: null };
  }

  function truncate(s, n) {
    s = String(s || '');
    return chars(s) <= n ? s : Array.from(s).slice(0, n - 1).join('').trimEnd() + '…';
  }

  /** What the chip says, for each state. */
  function chipView(state) {
    switch (state.kind) {
      case 'idle':
        return { label: 'BrandOS', detail: state.auto ? 'Keep writing' : 'Score draft', tone: 'quiet' };
      case 'short':
        return { label: 'BrandOS', detail: 'Keep writing', tone: 'quiet' };
      case 'loading':
        return { label: 'BrandOS', detail: 'Reading…', tone: 'quiet' };
      case 'scored': {
        var r = state.result;
        var top = r.fixes && r.fixes[0] ? r.fixes[0].text : r.verdict;
        return {
          label: String(r.score),
          detail: truncate(top, 46),
          tone: r.score >= 80 ? 'good' : r.score >= 60 ? 'mid' : 'low',
        };
      }
      case 'signed-out':
        return { label: 'BrandOS', detail: 'Connect to score', tone: 'action' };
      case 'pro':
        return { label: 'BrandOS', detail: 'Pro feature', tone: 'action' };
      case 'limited':
        return { label: 'BrandOS', detail: 'Paused for a bit', tone: 'quiet' };
      default:
        return { label: 'BrandOS', detail: 'Try again', tone: 'quiet' };
    }
  }

  /** "0.8–1.3× your usual views" */
  function reachLine(reach) {
    if (!reach) return '';
    var band = reach.low === reach.high ? reach.low + '×' : reach.low + '–' + reach.high + '×';
    return 'Likely ' + band + ' your usual views';
  }

  var api = {
    MIN_CHARS: MIN_CHARS,
    MAX_CHARS: MAX_CHARS,
    chars: chars,
    normalizeDraft: normalizeDraft,
    draftKey: draftKey,
    shouldScore: shouldScore,
    findComposers: findComposers,
    readDraft: readDraft,
    hasMedia: hasMedia,
    chipAnchor: chipAnchor,
    chipView: chipView,
    reachLine: reachLine,
    truncate: truncate,
  };
  root.BrandOSCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
