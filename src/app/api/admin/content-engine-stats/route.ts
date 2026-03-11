import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const ADMIN_KEY = process.env.ADMIN_API_KEY;

export async function GET(request: NextRequest) {
  // Admin auth via header
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Get all users with their generation counts and invite codes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        xUsername: true,
        name: true,
        avatar: true,
        subscriptionTier: true,
        generationsUsedThisMonth: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { generationsUsedThisMonth: 'desc' },
    });

    // Get session time per user
    const sessionAggregates = await prisma.userSession.groupBy({
      by: ['userId'],
      where: { feature: 'content-engine' },
      _sum: { durationMs: true },
      _count: true,
    });
    const sessionMap = new Map(
      sessionAggregates.map((s) => [s.userId, { totalMs: s._sum.durationMs || 0, count: s._count }])
    );

    // Get invite codes per user
    const inviteCodes = await prisma.inviteCode.findMany({
      select: {
        createdBy: true,
        usedCount: true,
        maxUses: true,
      },
    });

    // Aggregate invites by creator username
    const inviteMap = new Map<string, { sent: number; redeemed: number }>();
    for (const code of inviteCodes) {
      const existing = inviteMap.get(code.createdBy) || { sent: 0, redeemed: 0 };
      existing.sent += 1;
      existing.redeemed += code.usedCount;
      inviteMap.set(code.createdBy, existing);
    }

    // Get last session per user for "last active"
    const lastSessions = await prisma.userSession.findMany({
      where: { feature: 'content-engine' },
      orderBy: { startedAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, startedAt: true },
    });
    const lastActiveMap = new Map(lastSessions.map((s) => [s.userId, s.startedAt]));

    // Build per-user stats
    const userStats = users.map((user) => {
      const session = sessionMap.get(user.id);
      const invites = inviteMap.get(user.xUsername);
      return {
        id: user.id,
        username: user.xUsername,
        name: user.name,
        avatar: user.avatar,
        tier: user.subscriptionTier,
        generations: user.generationsUsedThisMonth,
        totalTimeMs: session?.totalMs || 0,
        sessionCount: session?.count || 0,
        invitesSent: invites?.sent || 0,
        invitesRedeemed: invites?.redeemed || 0,
        lastActive: lastActiveMap.get(user.id)?.toISOString() || user.updatedAt.toISOString(),
      };
    });

    // Aggregate totals
    const totals = {
      totalUsers: users.length,
      totalGenerations: users.reduce((sum, u) => sum + u.generationsUsedThisMonth, 0),
      totalTimeMs: sessionAggregates.reduce((sum, s) => sum + (s._sum.durationMs || 0), 0),
      totalInvitesSent: inviteCodes.length,
      totalInvitesRedeemed: inviteCodes.reduce((sum, c) => sum + c.usedCount, 0),
    };

    return NextResponse.json({ totals, users: userStats });
  } catch (err) {
    console.error('Content engine stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
