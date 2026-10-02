import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ImportPageClient from './ImportPageClient';

// Auth-gated page: render per-request, never statically prerender at build.
export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signup');
  }

  if (user.accountMigrationStatus === 'legacy') {
    redirect('/migrate-account');
  }

  return <ImportPageClient />;
}
