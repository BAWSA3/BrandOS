/**
 * Pixel stickers for station-board notes. Drawn as tiny grids in code (no
 * image assets): one character per pixel, '.' is transparent, letters map to
 * the palette. Rendered by <PixelSticker> as crisp SVG rects.
 */

const PALETTE: Record<string, string> = {
  R: '#FF3B5C', // red / pink
  O: '#FF8A00', // orange
  Y: '#FFC93C', // yellow / gold
  W: '#FFFFFF', // white highlight
  K: '#1D1D1F', // ink
  B: '#0A84FF', // BrandOS blue
  G: '#34C759', // green
  P: '#FF6FB5', // petal pink
  M: '#C8A27A', // milk tea
  C: '#6B4226', // coffee
  S: '#A1A1AA', // steam / grey
  L: '#D4D4DC', // light grey
};

const GRIDS = {
  heart: [
    '..RR....RR..',
    '.RRRR..RRRR.',
    'RRWRRRRRRRRR',
    'RWRRRRRRRRRR',
    'RRRRRRRRRRRR',
    '.RRRRRRRRRR.',
    '..RRRRRRRR..',
    '...RRRRRR...',
    '....RRRR....',
    '.....RR.....',
  ],
  star: [
    '.....YY.....',
    '.....YY.....',
    '....YYYY....',
    'YYYYYYYYYYYY',
    '.YYYYYYYYYY.',
    '..YYYYYYYY..',
    '...YYYYYY...',
    '...YYYYYY...',
    '..YYY..YYY..',
    '..YY....YY..',
    '.YY......YY.',
  ],
  fire: [
    '.....R......',
    '....RR......',
    '....RRR..R..',
    '...RROR.RR..',
    '..RROOORRR..',
    '..ROOYOORR..',
    '.RROYYYORR..',
    '.ROYYYYYOR..',
    '.ROYYYYYOR..',
    '..ROYYYOR...',
    '...RRRRR....',
  ],
  bolt: [
    '......YYYY..',
    '.....YYYY...',
    '....YYYY....',
    '...YYYY.....',
    '..YYYYYYYY..',
    '.....YYYY...',
    '....YYYY....',
    '...YYY......',
    '..YY........',
  ],
  smile: [
    '...YYYYYY...',
    '..YYYYYYYY..',
    '.YYYYYYYYYY.',
    'YYYKYYYYKYYY',
    'YYYKYYYYKYYY',
    'YYYYYYYYYYYY',
    'YKYYYYYYYYKY',
    'YYKYYYYYYKYY',
    '.YYKKKKKKYY.',
    '..YYYYYYYY..',
    '...YYYYYY...',
  ],
  boba: [
    '.....KK.....',
    '......K.....',
    '..KKKKKKKK..',
    '..KMMMMMMK..',
    '..KMMMMMMK..',
    '...KMMMMK...',
    '...KMKMKK...',
    '...KKMKMK...',
    '....KKKK....',
  ],
  coffee: [
    '...S..S.....',
    '....S..S....',
    '............',
    '.KKKKKKKK...',
    '.KCCCCCCKKK.',
    '.KCCCCCCK.K.',
    '.KCCCCCCKKK.',
    '..KCCCCK....',
    '...KKKK.....',
  ],
  crown: ['Y....Y....Y.', 'YY..YYY..YY.', 'YYYYYYYYYYY.', 'YYRYYBYYRYY.', 'YYYYYYYYYYY.'],
  sparkle: [
    '.....B......',
    '.....B......',
    '....BWB.....',
    'BBBBWWWBBBB.',
    '....BWB.....',
    '.....B......',
    '.....B...B..',
    '........BWB.',
    '.........B..',
  ],
  ghost: [
    '...LLLLL....',
    '..LLLLLLL...',
    '.LLKLLLKLL..',
    '.LLKLLLKLL..',
    '.LLLLLLLLL..',
    '.LLLLLLLLL..',
    '.LLLLLLLLL..',
    '.LL.LLL.LL..',
    '.L...L...L..',
  ],
  trophy: [
    'YYYYYYYYYY..',
    'Y.YYYYYY.Y..',
    'Y.YYYYYY.Y..',
    '.YYYYYYYY...',
    '...YYYY.....',
    '....YY......',
    '....YY......',
    '..KKKKKK....',
    '..KKKKKK....',
  ],
  flower: [
    '....PP......',
    '...PPPP.....',
    '.PP.PP.PP...',
    'PPPPYYPPPP..',
    '.PP.YY.PP...',
    '...PPPP.....',
    '....PP......',
    '....GG......',
    '..GGGG......',
    '....GG......',
  ],
} as const;

export type StickerId = keyof typeof GRIDS;
export const STICKER_IDS = Object.keys(GRIDS) as StickerId[];

export function isStickerId(v: unknown): v is StickerId {
  return typeof v === 'string' && (STICKER_IDS as string[]).includes(v);
}

export function stickerRects(id: StickerId) {
  const grid = GRIDS[id];
  const rects: { x: number; y: number; fill: string }[] = [];
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== '.') rects.push({ x, y, fill: PALETTE[ch] });
    })
  );
  return { width: Math.max(...grid.map((r) => r.length)), height: grid.length, rects };
}
