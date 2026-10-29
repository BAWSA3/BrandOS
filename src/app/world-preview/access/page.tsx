import type { Metadata } from 'next';
import type { Colorway } from '@/lib/colorways';
import AccessPreview from './AccessPreview';

// The invite-only trial screens with sample data: no sign-in, no network.
// Hidden on mybrandos.app (middleware).
//   ?state=gate | gate-in | code-error | applied | apply-error   the /access step
//   ?state=paywall-needed | paywall-ended | paywall-trial       the dashboard paywall (trial = today's)
//   ?state=invites-new | invites-mixed | invites-used           the member invite card
//   ?finish=bone|night|klein|paper                               the invite card's finish
export const metadata: Metadata = { title: 'Invite-only trial preview · BrandOS' };

const FINISHES: Colorway[] = ['bone', 'night', 'klein', 'paper'];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);
  const finish = FINISHES.find((f) => f === one('finish')) ?? 'bone';
  return <AccessPreview state={one('state') ?? 'gate'} finish={finish} />;
}
