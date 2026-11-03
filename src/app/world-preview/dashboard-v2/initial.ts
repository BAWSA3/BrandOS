import { isColorway, type Colorway } from '@/lib/colorways';
import type { Screen } from './sample';

// URL → first state of the mockup (shared by the server page and the client shell).

export const SCREENS: Screen[] = [
  'today',
  'playbook',
  'canvas',
  'write',
  'framework',
  'standing',
  'press',
];

export type Initial = { s: Screen; c: Colorway; first: boolean; k: boolean; chrome: boolean };

export function parseInitial(p: Record<string, string | undefined>): Initial {
  return {
    s: SCREENS.includes(p.s as Screen) ? (p.s as Screen) : 'today',
    c: isColorway(p.c) ? p.c : 'bone',
    first: p.first === '1',
    k: p.k === '1',
    chrome: p.chrome !== '0',
  };
}
