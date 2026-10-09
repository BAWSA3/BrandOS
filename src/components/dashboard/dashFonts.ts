import {
  Chakra_Petch,
  Courier_Prime,
  Geist,
  Geist_Mono,
  Instrument_Sans,
  Inter_Tight,
  JetBrains_Mono,
  Kode_Mono,
  Share_Tech_Mono,
  Sometype_Mono,
  Space_Mono,
} from 'next/font/google';

// Font candidates for the dashboard's three type roles (design review, see
// /world-preview/fonts). Pick by key; the dashboard reads them via CSS vars.

const shareTech = Share_Tech_Mono({ subsets: ['latin'], weight: '400' });
const kode = Kode_Mono({ subsets: ['latin'], weight: ['400', '600'] });
const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['400', '500', '600'] });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });
const sometype = Sometype_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'] });
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['400', '500', '600'] });
const geist = Geist({ subsets: ['latin'], weight: ['400', '500', '600'] });
const instrument = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });
const courier = Courier_Prime({ subsets: ['latin'], weight: ['400', '700'] });

export interface FontOption {
  key: string;
  label: string;
  family: string;
}

const opt = (key: string, label: string, family: string): FontOption => ({ key, label, family });

/** Labels, ticker, data (ref 1's squared mono). */
export const MONO_FONTS: FontOption[] = [
  opt('vcr', 'VCR OSD Mono (current)', "'VCR OSD Mono', monospace"),
  opt('share', 'Share Tech Mono', shareTech.style.fontFamily),
  opt('kode', 'Kode Mono', kode.style.fontFamily),
  opt('chakra', 'Chakra Petch', chakra.style.fontFamily),
  opt('space', 'Space Mono', spaceMono.style.fontFamily),
  opt('sometype', 'Sometype Mono', sometype.style.fontFamily),
  opt('geistmono', 'Geist Mono', geistMono.style.fontFamily),
];

/** Big numbers and headings (ref 2's tight grotesk); mono options too, like ref 1's numerals. */
export const BIG_FONTS: FontOption[] = [
  opt('inter', 'Inter Tight (current)', interTight.style.fontFamily),
  opt('geist', 'Geist', geist.style.fontFamily),
  opt('instrument', 'Instrument Sans', instrument.style.fontFamily),
  opt('share', 'Share Tech Mono', shareTech.style.fontFamily),
  opt('kode', 'Kode Mono', kode.style.fontFamily),
  opt('chakra', 'Chakra Petch', chakra.style.fontFamily),
];

/** Brand Pass typewriter (ref 3). */
export const PASS_FONTS: FontOption[] = [
  opt('jetbrains', 'JetBrains Mono (current)', jetbrains.style.fontFamily),
  opt('courier', 'Courier Prime', courier.style.fontFamily),
  opt('space', 'Space Mono', spaceMono.style.fontFamily),
];

export function pick(list: FontOption[], key: string | null | undefined): FontOption {
  return list.find((f) => f.key === key) ?? list[0];
}
