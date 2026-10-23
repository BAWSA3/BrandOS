import { IBM_Plex_Mono } from 'next/font/google';

// The field's metadata voice (docs/BRAND-WORLD.md, Direction 02): IBM Plex Mono
// for metadata strips and lowercase lines. Helvetica/Inter Tight and VCR stay
// for headlines and machine labels.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const FIELD_FONTS = {
  plex: plexMono.style.fontFamily,
  /** Add to a root element to expose var(--font-plex-mono) (Tailwind: font-plex). */
  plexVariable: plexMono.variable,
};
