import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ago, getHomeData, toPass } from '@/lib/home-data';
import { getLevel } from '@/lib/progress';
import TitleScreen from '@/components/title/TitleScreen';

// The signed-in home: the title screen (PRESS START -> main menu, with the
// user's photoreal station as the hero). Continue -> the dashboard.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=/home');
  if (user.accountMigrationStatus === 'legacy') redirect('/migrate-account');

  const [h, level] = await Promise.all([getHomeData(user), getLevel(user.id)]);
  return (
    <TitleScreen
      handle={h.handle}
      archetype={h.archetype ?? ''}
      stage={h.stage}
      stationNumber={h.stationNumber}
      lastSaved={h.lastScannedAt ? ago(h.lastScannedAt) : undefined}
      continueHref="/dashboard"
      rescanHref="/dashboard?rescan=1"
      stationHref={h.stationNumber ? `/station/${h.handle}` : '/dashboard'}
      score={h.score}
      pass={toPass(h)}
      level={level}
    />
  );
}
