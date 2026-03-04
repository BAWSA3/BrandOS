import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getUserUsage } from '@/lib/usage';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getUserUsage(user.id);
    return NextResponse.json(usage);
  } catch (error) {
    console.error('[Usage API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
