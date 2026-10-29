import type { Metadata } from 'next';
import ComposerPreview from './ComposerPreview';

// The live composer (docs/LIVE-COMPOSER-SPEC.md) with sample data: no sign-in,
// no network. Hidden on mybrandos.app (middleware).
//   ?v=a|b|c        reveal variant (a milestones · b ambient · c one moment)
//   ?demo=1         scripted playback at human speed (loops; for recording)
//   ?state=empty|voice|typing|hook|marked|final|thin|error|smm   still frames
//   ?chrome=0       hide the variant switcher (clean frame for filming)
export const metadata: Metadata = { title: 'Live composer preview · BrandOS' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);
  const v = one('v');
  return (
    <ComposerPreview
      variant={v === 'b' || v === 'c' ? v : 'a'}
      demo={one('demo') === '1'}
      state={one('state') ?? 'final'}
      chrome={one('chrome') !== '0'}
    />
  );
}
