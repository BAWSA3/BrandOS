import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/audit-log';

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.accountMigrationStatus === 'completed') {
      return NextResponse.json({ status: 'already_completed' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { accountMigrationStatus: 'completed' },
    });

    await logSecurityEvent({
      category: 'auth',
      eventType: 'account_migration_completed',
      userId: user.id,
      metadata: { from_status: user.accountMigrationStatus },
    });

    return NextResponse.json({ status: 'completed' });
  } catch (error) {
    console.error('[complete-migration] Error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
