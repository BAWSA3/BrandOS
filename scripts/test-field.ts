/**
 * The field (Direction 02): dither core, server PNG, avatar URL allowlist.
 * Pure: no database, no network.  npm run test:field
 */
import {
  indexOpen,
  parsePhases,
  pickRecentReads,
  readLine,
  type ReadCandidate,
} from '../src/lib/landing-rules';
import { classify } from '../src/lib/classifications';
import { isLikelyCompany } from '../src/lib/account-kind';
import { inflateSync } from 'node:zlib';
import {
  BAYER8,
  SIGNAL,
  FIELD,
  clouds,
  forEachDot,
  fromPixels,
  paintField,
  threshold,
} from '../src/lib/field/dither';
import { encodePng, ditherPng } from '../src/lib/og/dither';
import { allowedAvatarUrl } from '../src/lib/field/avatar';
import { driftOffset, fieldMetrics, signalCellFor, wipeCovered } from '../src/lib/field/system';
import { asksForField, fieldSwitch } from '../src/lib/field/switch';
import {
  BOOT_JS,
  PAINT_JS,
  predrawKey,
  predrawScript,
  type PredrawConfig,
  type PredrawSignal,
} from '../src/lib/field/predraw';

let pass = 0;
let fail = 0;
function test(name: string, ok: boolean, detail = '') {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !detail ? '' : `: ${detail}`}`);
}

console.log('A. Bayer matrix');
const flat = BAYER8.flat();
test('8×8', BAYER8.length === 8 && BAYER8.every((r) => r.length === 8));
test(
  'every value 0–63 exactly once',
  [...new Set(flat)].length === 64 && Math.min(...flat) === 0 && Math.max(...flat) === 63
);
test(
  'first row matches the standard ordered-dither matrix',
  BAYER8[0].join(',') === '0,32,8,40,2,34,10,42',
  BAYER8[0].join(',')
);
test(
  'thresholds strictly inside (0, 1)',
  flat.every((_, i) => {
    const t = threshold(i % 8, Math.floor(i / 8));
    return t > 0 && t < 1;
  })
);

console.log('\nB. Determinism');
const a = clouds(11);
const b = clouds(11);
const c = clouds(12);
const pts = [0.1, 0.33, 0.5, 0.77, 0.9];
test(
  'same seed, same sky',
  pts.every((u) => pts.every((v) => a(u, v) === b(u, v)))
);
test(
  'different seed, different sky',
  pts.some((u) => pts.some((v) => a(u, v) !== c(u, v)))
);
test(
  'luma stays in [0, 1]',
  pts.every((u) => pts.every((v) => a(u, v) >= 0 && a(u, v) <= 1))
);

console.log('\nC. Threshold is monotonic');
const count = (l: number) => {
  let n = 0;
  forEachDot(
    () => l,
    200,
    120,
    5,
    () => n++
  );
  return n;
};
const cells = Math.ceil(200 / 5) * Math.ceil(120 / 5);
test('black → no dots', count(0) === 0);
test('white → every cell', count(1) === cells, `${count(1)} of ${cells}`);
test('brighter → more dots (0.2 < 0.5 < 0.8)', count(0.2) < count(0.5) && count(0.5) < count(0.8));
test('mid-grey ≈ half the cells', Math.abs(count(0.5) / cells - 0.5) < 0.05);

console.log('\nD. Painting');
const rects: { style: string; x: number; y: number; w: number; h: number }[] = [];
const surface = {
  fillStyle: '' as unknown,
  fillRect(x: number, y: number, w: number, h: number) {
    rects.push({ style: String(this.fillStyle), x, y, w, h });
  },
};
paintField(surface, () => 0.5, { width: 300, height: 200, cell: 5, grid: 100, signalCell: [1, 0] });
test(
  'Klein ground first, full size',
  rects[0]?.style === FIELD && rects[0].w === 300 && rects[0].h === 200
);
const sig = rects.filter((r) => r.style === SIGNAL);
test('exactly one coral cell', sig.length === 1);
test('coral cell at grid [1, 0]', sig[0]?.x === 100 && sig[0]?.y === 0 && sig[0]?.w === 100);
test(
  'coral painted before the dots',
  rects.indexOf(sig[0]) < rects.findIndex((r) => r.style === '#FFFFFF')
);
const lines = rects.filter((r) => r.style.startsWith('rgba(255,255,255'));
test('grid lines: 2 vertical + 1 horizontal', lines.length === 3);
rects.length = 0;
paintField(surface, () => 0.5, { width: 300, height: 200, signalCell: [1, 0] });
test('no grid → no coral cell', !rects.some((r) => r.style === SIGNAL));

console.log('\nE. Pixels');
const white = fromPixels([255, 255, 255, 255], 1, 1, 1);
const black = fromPixels([0, 0, 0, 255], 1, 1, 1);
test('white pixel → 1, black → 0', white(0.5, 0.5) === 1 && black(0.5, 0.5) === 0);
const rgb = fromPixels([255, 255, 255], 1, 1, 1, 3);
test('3-channel buffers', rgb(0.5, 0.5) === 1);

console.log('\nF. Server PNG');
const png = encodePng(new Uint8Array([0, 71, 255, 255, 255, 255, 255, 255]), 2, 1);
test('PNG signature', png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
test('IHDR size 2×1', png.readUInt32BE(16) === 2 && png.readUInt32BE(20) === 1);
const idatAt = png.indexOf(Buffer.from('IDAT'));
const idatLen = png.readUInt32BE(idatAt - 4);
const raw = inflateSync(png.subarray(idatAt + 4, idatAt + 4 + idatLen));
test(
  'pixel data round-trips',
  raw.length === 9 && raw[1] === 0 && raw[2] === 71 && raw[3] === 255 && raw[5] === 255
);
const field = ditherPng(clouds(23), {
  width: 120,
  height: 63,
  cell: 6,
  grid: 30,
  signalCell: [1, 0],
});
test('a field encodes to a PNG', field.readUInt32BE(16) === 120 && field.readUInt32BE(20) === 63);

console.log('\nG. Avatar URL allowlist (no SSRF)');
const ok = (u: string) => allowedAvatarUrl(u) !== null;
test('X image CDN over https', ok('https://pbs.twimg.com/profile_images/1/abc_normal.jpg'));
test('rejects http', !ok('http://pbs.twimg.com/profile_images/1/a.jpg'));
test('rejects other hosts', !ok('https://example.com/a.jpg'));
test(
  'rejects look-alike hosts',
  !ok('https://pbs.twimg.com.evil.example/a.jpg') && !ok('https://evilpbs.twimg.com/a.jpg')
);
test(
  'rejects credentials and ports',
  !ok('https://user:pw@pbs.twimg.com/a.jpg') && !ok('https://pbs.twimg.com:8443/a.jpg')
);
test(
  'rejects non-strings and junk',
  !ok('javascript:alert(1)') && allowedAvatarUrl(null) === null && !ok('not a url')
);

console.log('\nG. The system (Direction 03)');
const desk = fieldMetrics(1920, 1080);
test(
  'desktop matches the loop video: 7px dots, 7 columns',
  desk.cell === 7 && desk.cols === 7,
  JSON.stringify(desk)
);
const phone = fieldMetrics(390, 844);
test(
  'phone: dots never under 4px, 4 columns',
  phone.cell === 4 && phone.cols === 4,
  JSON.stringify(phone)
);
test('tablet: 5 columns', fieldMetrics(820, 1180).cols === 5);
test('rows cover the viewport', desk.rows * desk.grid >= 1080 && phone.rows * phone.grid >= 844);
test('dots cap at 8px on huge screens', fieldMetrics(5120, 2880).cell === 8);
test("signal 'none' means no coral cell", signalCellFor('none', desk) === undefined);
test(
  "signal 'auto' sits second from the right, second row",
  signalCellFor('auto', desk)?.join(',') === '5,1'
);
test(
  'signal cells are clamped to the visible grid',
  signalCellFor([99, -3], phone)?.join(',') === '3,0'
);
const d0 = driftOffset(0, 60);
const d1 = driftOffset(60, 60);
test(
  'drift starts at rest and loops with no seam',
  Math.abs(d0[0]) < 1e-9 &&
    Math.abs(d0[1]) < 1e-9 &&
    Math.abs(d1[0] - d0[0]) < 1e-9 &&
    Math.abs(d1[1] - d0[1]) < 1e-9
);
test('drift actually moves mid-loop', Math.hypot(...driftOffset(30, 60)) > 0.5);
let allOff = true;
let allOn = true;
let monotonic = true;
for (let y = 0; y < 8; y++)
  for (let x = 0; x < 24; x++) {
    if (wipeCovered(x, y, 24, 0)) allOff = false;
    if (!wipeCovered(x, y, 24, 1)) allOn = false;
    let was = false;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const now = wipeCovered(x, y, 24, p);
      if (was && !now) monotonic = false;
      was = now;
    }
  }
test('wipe: nothing covered at 0, everything at 1', allOff && allOn);
test('wipe: once a cell is covered it stays covered', monotonic);
test('wipe sweeps left to right', wipeCovered(0, 0, 24, 0.35) && !wipeCovered(23, 0, 24, 0.35));

// The launch-surfaces switch (src/lib/field/switch.ts)
console.log('\nH. The launch-surfaces switch');
test('off by default', !fieldSwitch({}));
test('env flag turns it on for everyone', fieldSwitch({ envFlag: 'true', appEnv: 'production' }));
test('?field=1 works on staging / previews', fieldSwitch({ param: '1', appEnv: 'staging' }));
test('?field=1 works locally', fieldSwitch({ param: '1' }));
test('?field=1 on production needs an admin', !fieldSwitch({ param: '1', appEnv: 'production' }));
test(
  '?field=1 on production for an admin',
  fieldSwitch({ param: '1', appEnv: 'production', isAdmin: true })
);
test(
  '?field=0 forces it off, even with the env flag',
  !fieldSwitch({ param: '0', envFlag: 'true' })
);
test(
  "admins without ?field=1 see today's page",
  !fieldSwitch({ appEnv: 'production', isAdmin: true })
);
test('array params use the first value', fieldSwitch({ param: ['1', '0'], appEnv: 'staging' }));
test(
  'asksForField only for "1"',
  asksForField('1') && !asksForField('true') && !asksForField(undefined)
);

// The landing scroll (src/lib/landing-rules.ts)
console.log('\nI. The landing scroll');
test(
  'phases parse from the scan JSON',
  JSON.stringify(parsePhases('{"define":78,"check":71,"generate":68,"scale":69}')) ===
    JSON.stringify({ define: 78, check: 71, generate: 68, scale: 69 })
);
test(
  'phases: junk, missing keys and out-of-range values are rejected',
  parsePhases('nope') === null &&
    parsePhases('{"define":78}') === null &&
    parsePhases('{"define":178,"check":1,"generate":1,"scale":1}') === null &&
    parsePhases(null) === null
);
test(
  'the Index is closed before 2 Nov (Los Angeles)',
  !indexOpen(Date.parse('2026-11-01T23:59:00-07:00'))
);
test(
  'the Index opens at midnight 2 Nov (Los Angeles)',
  indexOpen(Date.parse('2026-11-02T00:00:00-07:00'))
);

// Recent reads (the homepage before the Index opens)
const ph = { define: 70, check: 70, generate: 70, scale: 70 };
const cand = (
  handle: string,
  score: number,
  archetype: string | null,
  extra: Partial<ReadCandidate> = {}
): ReadCandidate => ({
  handle,
  score,
  archetype,
  phases: ph,
  summary: `${handle} is a creator. Second sentence.`,
  pillars: ['AI', 'Trading'],
  avatar: 'https://pbs.twimg.com/a.jpg',
  name: handle,
  readAt: '2026-10-25T00:00:00Z',
  ...extra,
});
const classOf = (a: string | null) => classify(a)?.code ?? null;
const reads = pickRecentReads(
  [
    cand('a', 90, 'SOURCE'),
    cand('b', 88, 'SOURCE'),
    cand('c', 80, 'FORESIGHT'),
    cand('d', 70, 'ARC'),
    cand('broken', 95, 'SOURCE', { phases: null }),
    cand('nopic', 94, 'ARC', { avatar: null }),
    cand('nosummary', 93, 'ARC', { summary: ' ' }),
    cand('noclass', 92, 'MYSTERY'),
    cand('A', 60, 'NULL'),
  ],
  classOf,
  3
);
test(
  'recent reads: one per class first, highest scores, complete reads only',
  reads.map((r) => r.handle).join(',') === 'a,c,d',
  reads.map((r) => r.handle).join(',')
);
test(
  'recent reads: fills with the next highest once classes run out',
  pickRecentReads([cand('a', 90, 'SOURCE'), cand('b', 88, 'SOURCE')], classOf, 3)
    .map((r) => r.handle)
    .join(',') === 'a,b'
);
test(
  'recent reads: a handle appears once (case-insensitive)',
  pickRecentReads([cand('Naval', 84, 'FORESIGHT'), cand('naval', 80, 'FORESIGHT')], classOf)
    .length === 1
);
test(
  'recent reads: company accounts are skipped',
  pickRecentReads(
    [cand('vercel', 95, 'SOURCE', { company: true }), cand('naval', 84, 'FORESIGHT')],
    classOf
  )
    .map((r) => r.handle)
    .join(',') === 'naval'
);
const person = (extra: Partial<Parameters<typeof isLikelyCompany>[0]> = {}) => ({
  handle: 'someone',
  name: 'Some One',
  bio: null,
  summary: null,
  ...extra,
});
test(
  'company: a product bio ("infrastructure for …") is a company',
  isLikelyCompany(
    person({
      handle: 'vercel',
      name: 'Vercel',
      bio: 'Agentic Infrastructure for apps and agents.',
      summary: 'Vercel has built a highly focused, technically authoritative brand.',
    })
  )
);
test(
  'company: tracked as a brand by its owner or an admin wins',
  isLikelyCompany(person({ tracked: 'brand', bio: 'i post about markets' }))
);
test(
  'company: org names and "we" bios are companies',
  isLikelyCompany(person({ handle: 'uniswap', name: 'Uniswap Labs' })) &&
    isLikelyCompany(person({ bio: 'We help creators get paid.' })) &&
    isLikelyCompany(person({ summary: 'Acme is a payments platform for small teams.' })) &&
    isLikelyCompany(person({ summary: 'Swoobz operates as a focused product brand.' })) &&
    isLikelyCompany(person({ bio: 'The stablecoin network that makes money programmable.' }))
);
test(
  'company: individual creators are kept',
  [
    person({
      handle: 'naval',
      name: 'Naval',
      bio: 'Incompressible',
      summary: 'Naval is a top-tier intellectual brand built on first-principles thinking.',
    }),
    person({ handle: 'levelsio', name: '@levelsio', bio: '💸 $86K/m 📸 $44K/m' }),
    person({
      handle: 'jbawsa',
      name: 'BAWSA',
      bio: 'building creative ai systems to scale your brand',
    }),
    person({
      handle: 'galileowilson',
      name: 'Galileo Wilson',
      bio: 'wizard behind your favorite projects | work: @whop @avax',
    }),
    person({ handle: 'collabking', name: 'Collab King', bio: 'collabs and threads' }),
    person({
      handle: 'ruthybuilds',
      name: 'Julian | Surgence Labs (a.k.a RuthyBuilds)',
      bio: 'Co-Founder @Surgence_io: Making FinTech, Crypto, AI companies go viral.',
    }),
    person({ handle: 'satwikofficial', name: 'Satwik', bio: 'creator of immaculate vibes' }),
    person({
      handle: 'solquicks',
      name: 'quicks',
      bio: 'The Fox @SatRush | Creator @domaprotocol',
    }),
    person({
      handle: 'jerrygmii',
      name: 'Jerry',
      summary: 'Jerry is a specialized trend-spotter and platform advocate in Web3.',
    }),
  ].every((a) => !isLikelyCompany(a))
);
test(
  'company: ambiguous product wording in a first-person bio stays a person',
  !isLikelyCompany(
    person({ bio: "I build infrastructure for onchain apps. my takes, not my employer's." })
  )
);
test('read line: first sentence', readLine('One thing. Two things.') === 'One thing.');
test(
  'read line: long sentences are cut at a word',
  (() => {
    const l = readLine(`${'word '.repeat(40)}end.`);
    return l.length <= 96 && l.endsWith('…') && !l.includes('wor…');
  })()
);

// The pre-drawn field (src/lib/field/predraw.ts): the inline script must draw
// exactly what FieldBackground draws, and must stand alone once serialised.
console.log('\nJ. The pre-drawn field');
type Op = string;
const recorder = () => {
  const ops: Op[] = [];
  const g = {
    fillStyle: '' as unknown,
    fillRect(x: number, y: number, w: number, h: number) {
      ops.push(`${String(g.fillStyle)} ${x} ${y} ${w} ${h}`);
    },
  };
  return { g, ops };
};
// The script's own text, evaluated on its own (no outer scope to lean on).
type Paint = (
  g: unknown,
  w: number,
  h: number,
  seed: number,
  density: number,
  signal: PredrawSignal
) => void;
const standalonePaint = new Function(`return (${PAINT_JS})`)() as Paint;
const predrawBoot = new Function(`return (${BOOT_JS})`)() as (c: PredrawConfig, p: Paint) => void;
const sizes: [number, number][] = [
  [375, 812],
  [768, 1024],
  [1440, 900],
  [1920, 1080],
];
const specs: PredrawSignal[] = ['auto', 'none', [5, 1], [9, 40]];
for (const [w, h] of sizes)
  for (const spec of specs) {
    const a = recorder();
    const m = fieldMetrics(w, h);
    paintField(a.g, clouds(11, 0.4), {
      width: w,
      height: h,
      cell: m.cell,
      grid: m.grid,
      signalCell: signalCellFor(spec, m),
    });
    const b = recorder();
    standalonePaint(b.g, w, h, 11, 0.4, spec);
    const same = a.ops.length === b.ops.length && a.ops.every((op, i) => op === b.ops[i]);
    test(
      `same drawing at ${w}×${h}, signal ${String(spec)}`,
      same,
      `${a.ops.length} vs ${b.ops.length} ops`
    );
  }
{
  const a = recorder();
  const m = fieldMetrics(1440, 900);
  paintField(a.g, clouds(29, 0.5), {
    width: 1440,
    height: 900,
    cell: m.cell,
    grid: m.grid,
    signalCell: signalCellFor('auto', m),
  });
  const b = recorder();
  standalonePaint(b.g, 1440, 900, 29, 0.5, 'auto');
  test('same drawing with another seed and density', a.ops.join('|') === b.ops.join('|'));
}
const script = predrawScript({ id: 'f', seed: 11, density: 0.4, signal: 'auto' });
test('the script is under 6 KB', script.length < 6144, `${script.length} bytes`);
test(
  'the script parses',
  (() => {
    try {
      new Function(script);
      return true;
    } catch {
      return false;
    }
  })()
);
test(
  'config is escaped for HTML',
  !predrawScript({ id: '</script>', seed: 1, density: 0.4, signal: 'none' }).includes('</script>')
);

// Boot in a fake page: draws, marks the key FieldBackground looks for, honours the gate.
const fakePage = (search: string) => {
  const canvas = {
    width: 0,
    height: 0,
    style: { visibility: 'hidden' },
    attrs: {} as Record<string, string>,
    parentNode: { style: { display: 'none' } },
    setAttribute(k: string, v: string) {
      this.attrs[k] = v;
    },
    getContext() {
      return { ...recorder().g, setTransform() {} };
    },
  };
  const g = globalThis as Record<string, unknown>;
  g.window = { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 2 };
  g.document = { getElementById: () => canvas };
  g.location = { search };
  return canvas;
};
{
  const c = fakePage('');
  predrawBoot({ id: 'f', seed: 11, density: 0.4, signal: 'auto' }, standalonePaint);
  test(
    'boot draws at the pixel ratio and marks the key',
    c.width === 2880 &&
      c.height === 1800 &&
      c.style.visibility === 'visible' &&
      c.attrs['data-field-key'] === predrawKey(1440, 900, 2, 11, 0.4, 'auto')
  );
  const gated = (search: string, env: boolean, appEnv: string) => {
    const p = fakePage(search);
    predrawBoot(
      { id: 'f', seed: 11, density: 0.4, signal: 'auto', gate: { env, appEnv } },
      standalonePaint
    );
    return p.style.visibility === 'visible' && p.parentNode.style.display === 'block';
  };
  test('gate: ?field=1 off production draws', gated('?field=1', false, 'staging'));
  test('gate: no param, flag off, does nothing', !gated('', false, 'staging'));
  test('gate: ?field=1 on production does nothing', !gated('?field=1', false, 'production'));
  test('gate: flag on draws everywhere', gated('', true, 'production'));
  test('gate: ?field=0 always does nothing', !gated('?field=0', true, 'staging'));
  const g = globalThis as Record<string, unknown>;
  delete g.window;
  delete g.document;
  delete g.location;
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
