import { Archivo_Black, DM_Serif_Display, Fraunces, Instrument_Serif, Inter_Tight, JetBrains_Mono, Space_Grotesk, Syne } from 'next/font/google';
import type { FontKey } from '@/lib/brand-cards';

// The type options a brand card can show. Loaded once, used by font key.
const grotesk = Inter_Tight({ subsets: ['latin'], weight: ['500', '800'] });
const space = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'] });
const serif = Fraunces({ subsets: ['latin'], weight: ['400', '700'] });
const didone = DM_Serif_Display({ subsets: ['latin'], weight: '400' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'] });
const heavy = Archivo_Black({ subsets: ['latin'], weight: '400' });
const syne = Syne({ subsets: ['latin'], weight: ['700', '800'] });

export const CARD_FONTS: Record<FontKey, { family: string; label: string }> = {
  grotesk: { family: grotesk.style.fontFamily, label: 'Inter Tight' },
  space: { family: space.style.fontFamily, label: 'Space Grotesk' },
  serif: { family: serif.style.fontFamily, label: 'Fraunces' },
  didone: { family: didone.style.fontFamily, label: 'DM Serif' },
  instrument: { family: instrument.style.fontFamily, label: 'Instrument Serif' },
  mono: { family: mono.style.fontFamily, label: 'JetBrains Mono' },
  heavy: { family: heavy.style.fontFamily, label: 'Archivo Black' },
  syne: { family: syne.style.fontFamily, label: 'Syne' },
};
