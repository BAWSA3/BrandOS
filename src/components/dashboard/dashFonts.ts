import { Inter_Tight, Space_Mono } from 'next/font/google';

// The dashboard's type roles (chosen 2026-10-09 from the font review):
//   labels + data  VCR OSD Mono (local @font-face in globals.css)
//   big numbers    Inter Tight
//   Brand Pass     Space Mono
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['400', '500', '600'] });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

export const DASH_FONTS = {
  mono: "'VCR OSD Mono', monospace",
  big: interTight.style.fontFamily,
  pass: spaceMono.style.fontFamily,
};
