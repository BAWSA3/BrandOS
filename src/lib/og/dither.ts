import { deflateSync } from 'node:zlib';
import { clouds, fromPixels, paintField, type FieldOptions, type Luma } from '@/lib/field/dither';

/**
 * The field for share images (next/og can't run a canvas): the same dither core
 * painted into an RGBA buffer and encoded as a PNG, to embed as an <img> in an
 * ImageResponse. Server-only. No new dependencies: a tiny PNG encoder on zlib.
 */

function parseColor(c: unknown): [number, number, number, number] {
  const s = String(c);
  const hex = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }
  const rgba = /^rgba?\(([^)]+)\)$/.exec(s);
  if (rgba) {
    const [r, g, b, a = '1'] = rgba[1].split(',').map((x) => x.trim());
    return [Number(r), Number(g), Number(b), Math.round(Number(a) * 255)];
  }
  return [0, 0, 0, 255];
}

/** A raster that satisfies the field's Surface (fillStyle + fillRect, alpha blended). */
class Raster {
  data: Uint8Array;
  fillStyle: unknown = '#000000';
  constructor(
    readonly width: number,
    readonly height: number
  ) {
    this.data = new Uint8Array(width * height * 4);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    const [r, g, b, a] = parseColor(this.fillStyle);
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.width, Math.round(x + w));
    const y1 = Math.min(this.height, Math.round(y + h));
    const k = a / 255;
    for (let yy = y0; yy < y1; yy++)
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * this.width + xx) * 4;
        const d = this.data;
        d[i] = Math.round(r * k + d[i] * (1 - k));
        d[i + 1] = Math.round(g * k + d[i + 1] * (1 - k));
        d[i + 2] = Math.round(b * k + d[i + 2] * (1 - k));
        d[i + 3] = 255;
      }
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Encodes an RGBA buffer as a PNG. Exported for tests. */
export function encodePng(rgba: Uint8Array, width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(
      raw,
      y * (width * 4 + 1) + 1
    );
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** A dithered field as a PNG buffer. */
export function ditherPng(luma: Luma, o: FieldOptions): Buffer {
  const r = new Raster(o.width, o.height);
  paintField(r, luma, o);
  return encodePng(r.data, o.width, o.height);
}

export const pngDataUrl = (png: Buffer) => `data:image/png;base64,${png.toString('base64')}`;

/** A clouds field (the default world surface) as a data URL for next/og. */
export function cloudsDataUrl(o: FieldOptions & { seed?: number; density?: number }) {
  return pngDataUrl(ditherPng(clouds(o.seed, o.density), o));
}

/**
 * A dithered portrait from image bytes (e.g. an X avatar), or null if it can't be
 * decoded. Uses sharp when the runtime has it (Next ships it); callers fall back
 * to initials on null.
 */
export async function portraitDataUrl(
  image: ArrayBuffer | Buffer,
  o: FieldOptions & { contrast?: number }
): Promise<string | null> {
  try {
    const sharp = (await import('sharp')).default;
    const sw = 160;
    const sh = Math.max(1, Math.round((160 * o.height) / o.width));
    const { data } = await sharp(Buffer.from(image as ArrayBuffer))
      .resize(sw, sh, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return pngDataUrl(ditherPng(fromPixels(data, sw, sh, o.contrast ?? 1.35, 3), o));
  } catch {
    return null;
  }
}
