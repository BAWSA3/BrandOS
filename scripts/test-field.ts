/**
 * The field (Direction 02): dither core, server PNG, avatar URL allowlist.
 * Pure: no database, no network.  npm run test:field
 */
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

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
