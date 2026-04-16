import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import MigrateAccountClient from './MigrateAccountClient';

/**
 * /migrate-account
 *
 * Shown to legacy X-OAuth users who need to add a primary credential
 * (email+password, Google, or Apple) before accessing the dashboard.
 *
 * Hard cutoff: no grace period. Next login = must migrate. Dashboard
 * access is blocked until accountMigrationStatus = 'completed'.
 *
 * See: docs/PHASE-1-SCHEMA.md (Impl-2)
 */
export default async function MigrateAccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  if (user.accountMigrationStatus === 'completed') {
    redirect('/dashboard');
  }

  return (
    <MigrateAccountClient
      userId={user.id}
      xUsername={user.xUsername}
      currentEmail={user.email}
      name={user.name}
    />
  );
}
