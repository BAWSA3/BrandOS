import type { Metadata } from 'next';
import SystemPreview from './SystemPreview';

// Direction 03 (docs/BRAND-WORLD.md): the field as the background of every
// screen, bone panels for reading, and the system's primitives in both places.
// Sample data only; nothing here is on a live page yet.
export const metadata: Metadata = { title: 'The system · BrandOS preview', robots: 'noindex' };

export default function Page() {
  return <SystemPreview />;
}
