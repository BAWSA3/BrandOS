import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import CalendarPageClient from './CalendarPageClient';

// Auth-gated page: render per-request, never statically prerender at build.
export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signup');
  }

  if (user.accountMigrationStatus === 'legacy') {
    redirect('/migrate-account');
  }

  return <CalendarPageClient />;
}
