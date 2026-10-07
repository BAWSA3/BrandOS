import { stickerRects, type StickerId } from '@/lib/pixel-stickers';

/** A pixel sticker as crisp SVG rects (see src/lib/pixel-stickers.ts). */
export default function PixelSticker({ id, size = 28 }: { id: StickerId; size?: number }) {
  const { width, height, rects } = stickerRects(id);
  return (
    <svg
      width={size}
      height={(size * height) / width}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={1} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}
