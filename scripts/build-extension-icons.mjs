// Renders the BrandOS for Chrome icons (Klein square, white B) into
// chrome-extension/icons. The 128px store icon keeps Chrome's 16px safe margin.
// Run: node scripts/build-extension-icons.mjs
import sharp from 'sharp';

const KLEIN = '#0047FF';
const svg = (size, pad) => {
  const inner = size - pad * 2;
  const r = Math.round(inner * 0.18);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" fill="${KLEIN}"/>
  <text x="50%" y="50%" dy="0.36em" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-weight="700" font-size="${Math.round(inner * 0.68)}" fill="#ffffff">B</text>
</svg>`);
};

for (const [size, pad] of [
  [16, 0],
  [32, 1],
  [48, 2],
  [128, 16],
]) {
  await sharp(svg(size, pad)).png().toFile(`chrome-extension/icons/icon${size}.png`);
  console.log(`icon${size}.png`);
}
