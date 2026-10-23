import { normalizeArchetypeName } from '@/lib/archetype-names';

/**
 * The institution's classification system (docs/BRAND-WORLD.md): the eight
 * archetypes as numbered classes, written like a catalogue entry,
 * `CLASS 03 · BUILD.EXE`. Legacy names in old reads go through
 * normalizeArchetypeName; anything that still isn't one of the eight is
 * "Unclassified". Pure (tested in test:index).
 */

export const CLASSES = [
  { number: 1, code: 'SOURCE', definition: 'Knowledge authority' },
  { number: 2, code: 'FORESIGHT', definition: 'Shapes the narrative' },
  { number: 3, code: 'BUILD.EXE', definition: 'Builder. Shipper. Doer' },
  { number: 4, code: 'ARC', definition: 'Rising star. Growth story' },
  { number: 5, code: 'RELAY', definition: 'Super connector' },
  { number: 6, code: 'FREQ', definition: 'Entertainer. Community builder' },
  { number: 7, code: 'ENTROPY', definition: 'Risk-taker. Cult builder' },
  { number: 8, code: 'NULL', definition: 'Ideas over identity' },
] as const;

export type Classification = (typeof CLASSES)[number];

/** The class for an archetype name (any casing, legacy names included), or null. */
export function classify(archetype: string | null | undefined): Classification | null {
  if (!archetype) return null;
  const clean = archetype.replace(/[^\x20-\x7E]/g, '').trim();
  const name = normalizeArchetypeName(clean).toUpperCase();
  return CLASSES.find((c) => c.code === name) ?? null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "CLASS 03 · BUILD.EXE". `sep` is "/" for text set in VCR OSD Mono, which
 * has no "·" glyph; "·" is fine in Inter / Helvetica.
 */
export function classLabel(archetype: string | null | undefined, sep: '·' | '/' = '·'): string {
  const c = classify(archetype);
  return c ? `CLASS ${pad(c.number)} ${sep} ${c.code}` : 'UNCLASSIFIED';
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "23 OCT 2026": the record's date format (UTC, so it's the same everywhere). */
export function recordDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
