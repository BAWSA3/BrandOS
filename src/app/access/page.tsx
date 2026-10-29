import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { hasPro } from '@/lib/billing';
import { CODE_TRIAL } from '@/lib/early-access-rules';
import { safeNextPath } from '@/lib/safe-input';
import AccessGate from '@/components/access/AccessGate';

export const metadata: Metadata = {
  title: 'Get a code · BrandOS',
  description: 'BrandOS is invite-only. A code gets you 30 days of everything, no card.',
};

/**
 * "You've seen your read. Now get a code." The step between a public read and
 * the product in the invite-only trial (NEXT_PUBLIC_CODE_TRIAL): enter a code,
 * or apply for one; members sign in from here too. With the trial off it's
 * just the sign-in page.
 */
export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next, '/dashboard');
  if (!CODE_TRIAL) redirect(`/signup?next=${encodeURIComponent(next)}`);
  const user = await getCurrentUser();
  // already in: nothing to get
  if (user && hasPro(user)) redirect(next);
  return <AccessGate next={next} signedIn={!!user} />;
}
