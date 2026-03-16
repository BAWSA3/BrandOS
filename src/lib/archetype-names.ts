// Legacy name migration — converts any old archetype name to the current one
// This file is safe to import from client components (no fs/Node dependencies)
const LEGACY_NAME_MAP: Record<string, string> = {
  // "The X" era names
  'The Alpha': 'FORESIGHT',
  'The Builder': 'BUILD.EXE',
  'The Educator': 'SIGNAL_SAGE',
  'The Degen': 'ENTROPY',
  'The Analyst': 'FORESIGHT',
  'The Philosopher': 'FORESIGHT',
  'The Networker': 'RELAY',
  'The Contrarian': 'ENTROPY',
  'The Creator': 'BUILD.EXE',
  // "Descriptor" era names
  'Professor': 'SIGNAL_SAGE',
  'Plug': 'RELAY',
  'Chief Vibes Officer': 'FREQ',
  'Prophet': 'FORESIGHT',
  'Ship-or-Die': 'BUILD.EXE',
  'Underdog-Arc': 'ARC',
  'Degen': 'ENTROPY',
  'Anon': 'NULL',
};

/** Normalize any archetype name (legacy or current) to the current name */
export function normalizeArchetypeName(name: string): string {
  return LEGACY_NAME_MAP[name] || name;
}
