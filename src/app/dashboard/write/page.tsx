import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasPro } from '@/lib/billing';
import { getColorway } from '@/lib/user-preferences';
import CopywriterChat from '@/components/dashboard/CopywriterChat';

// /dashboard/write — the copywriter chat (X posts, threads, emails, ads) in
// the creator's own voice. Pro (open access counts); free accounts land on
// the dashboard, which shows the paywall.
export const dynamic = 'force-dynamic';

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=/dashboard/write');
  if (!hasPro(user)) redirect('/dashboard');
  const handle = (
    user.platformConnections.find((pc) => pc.platform === 'x')?.platformUsername ??
    user.xUsername ??
    ''
  ).replace(/^@/, '');
  const colorway = await getColorway(user.id);
  return <CopywriterChat handle={handle || null} colorway={colorway} />;
}
