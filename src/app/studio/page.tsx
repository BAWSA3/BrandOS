import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudio } from '@/lib/studio';
import StudioView from '@/components/studio/StudioView';

// The studio home: the user's brand station and the onboarding steps that build
// it (docs/specs/ONBOARDING-BUILDING-GAME.md). Auth-gated, per request.
export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=/studio');
  if (user.accountMigrationStatus === 'legacy') redirect('/migrate-account');

  const studio = await getStudio(user);

  return (
    <StudioView
      handle={user.xUsername?.replace(/^@/, '') ?? null}
      archetype={studio.archetype}
      stage={studio.stage}
      // Steps open as each phase ships (Foundation is next).
      stepHrefs={{}}
    />
  );
}
