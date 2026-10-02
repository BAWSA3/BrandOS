/**
 * Account-deletion acceptance suite (Launch Bar Week 3).
 *
 * Run:  npm run test:deletion   (uses .env.local → STAGING database)
 *
 * Seeds real rows, exercises src/lib/account-deletion.ts, and asserts:
 *   A. Personal purge — user + owned workspace + scans + connections +
 *      shares + memberships hard-deleted (incl. scans run in OTHER
 *      workspaces — GDPR "user + all their scans").
 *   B. Bystanders survive — another user's workspace, membership rows for
 *      other users, and their scans are untouched.
 *   C. Owned-team-workspace gate — throws OwnedTeamWorkspacesError without
 *      consent, cascade-deletes with consent.
 *   D. Supabase auth user deletion (the route's follow-up step) works.
 *
 * All seeded rows are cleaned up in `finally` — safe to re-run.
 */
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import prisma from '../src/lib/db';
import {
  deleteAccountData,
  OwnedTeamWorkspacesError,
} from '../src/lib/account-deletion';

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const run = randomUUID().slice(0, 8);
const tag = (s: string) => `del-test-${run}-${s}`;

async function seedUser(handle: string, supabaseId: string) {
  const user = await prisma.user.create({
    data: { supabaseId, xUsername: tag(handle), email: `${tag(handle)}@example.com` },
  });
  const workspace = await prisma.workspace.create({
    data: {
      name: `${tag(handle)} workspace`,
      type: 'personal',
      ownerUserId: user.id,
      members: { create: { userId: user.id, role: 'owner' } },
    },
  });
  const connection = await prisma.platformConnection.create({
    data: {
      platform: 'x',
      platformUserId: tag(`${handle}-xid`),
      platformUsername: tag(handle),
      accessToken: 'test-token',
      scopes: '[]',
      userId: user.id,
      workspaceId: workspace.id,
      status: 'active',
    },
  });
  return { user, workspace, connection };
}

function seedScan(userId: string, workspaceId: string, connectionId: string, handle: string) {
  return prisma.brandScan.create({
    data: {
      userId,
      workspaceId,
      platformConnectionId: connectionId,
      xUsername: handle,
      score: 50,
      archetype: 'Builder',
      phaseScores: {},
      strengths: [],
      improvements: [],
    },
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // .env.local may predate the key rename — accept either name
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) throw new Error('Missing Supabase env — run via npm run test:deletion');
  const admin = createClient(url, secretKey, { auth: { persistSession: false } });

  console.log(`Account-deletion acceptance suite (run ${run})\n`);

  // ---- seed ----
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: `${tag('u1')}@example.com`,
    email_confirm: true,
  });
  if (authErr || !authUser?.user) throw new Error(`auth seed failed: ${authErr?.message}`);
  const u1AuthId = authUser.user.id;

  const cleanupUserIds: string[] = [];
  try {
    const u1 = await seedUser('u1', u1AuthId);
    const u2 = await seedUser('u2', tag('fake-auth-u2'));
    const u3 = await seedUser('u3', tag('fake-auth-u3'));
    cleanupUserIds.push(u2.user.id, u3.user.id);

    // u1's own data
    await seedScan(u1.user.id, u1.workspace.id, u1.connection.id, tag('u1'));
    await seedScan(u1.user.id, u1.workspace.id, u1.connection.id, tag('u1'));
    const share = await prisma.auditReportShare.create({
      data: {
        workspaceId: u1.workspace.id,
        createdByUserId: u1.user.id,
        token: tag('share'),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    // u1 is also a member of u2's workspace and ran a scan there
    await prisma.workspaceMember.create({
      data: { workspaceId: u2.workspace.id, userId: u1.user.id, role: 'member' },
    });
    await seedScan(u1.user.id, u2.workspace.id, u1.connection.id, tag('u1'));
    // u2's own scan in their workspace (must survive)
    const u2Scan = await seedScan(u2.user.id, u2.workspace.id, u2.connection.id, tag('u2'));

    // u3 owns a team workspace
    const teamWs = await prisma.workspace.create({
      data: {
        name: tag('team'),
        type: 'team',
        ownerUserId: u3.user.id,
        seatCount: 5,
        members: { create: { userId: u3.user.id, role: 'owner' } },
      },
    });

    // ---- A + B: delete u1 ----
    console.log('A. Personal purge (u1)');
    const counts = await deleteAccountData(u1.user.id);
    check('user row gone', !(await prisma.user.findUnique({ where: { id: u1.user.id } })));
    check('owned workspace gone', !(await prisma.workspace.findUnique({ where: { id: u1.workspace.id } })));
    check(
      'ALL their scans gone (incl. in u2 workspace)',
      (await prisma.brandScan.count({ where: { userId: u1.user.id } })) === 0,
    );
    check('connection gone', !(await prisma.platformConnection.findUnique({ where: { id: u1.connection.id } })));
    check('share gone', !(await prisma.auditReportShare.findUnique({ where: { id: share.id } })));
    check(
      'membership in u2 workspace gone',
      !(await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: u2.workspace.id, userId: u1.user.id } },
      })),
    );
    check(
      'counts accurate',
      counts.brandScans === 3 && counts.ownedWorkspaces === 1 && counts.memberships === 2 &&
        counts.shares === 1 && counts.platformConnections === 1,
      JSON.stringify(counts),
    );

    console.log('\nB. Bystanders survive');
    check('u2 workspace intact', !!(await prisma.workspace.findUnique({ where: { id: u2.workspace.id } })));
    check('u2 scan intact', !!(await prisma.brandScan.findUnique({ where: { id: u2Scan.id } })));
    check('u2 user intact', !!(await prisma.user.findUnique({ where: { id: u2.user.id } })));

    // ---- C: owned team workspace gate ----
    console.log('\nC. Owned-team-workspace consent gate (u3)');
    let threw = false;
    try {
      await deleteAccountData(u3.user.id);
    } catch (e) {
      threw = e instanceof OwnedTeamWorkspacesError;
    }
    check('throws OwnedTeamWorkspacesError without consent', threw);
    check('nothing deleted on refusal', !!(await prisma.user.findUnique({ where: { id: u3.user.id } })));
    await deleteAccountData(u3.user.id, { deleteOwnedTeamWorkspaces: true });
    check('deletes with consent', !(await prisma.user.findUnique({ where: { id: u3.user.id } })));
    check('team workspace cascade-deleted', !(await prisma.workspace.findUnique({ where: { id: teamWs.id } })));
    cleanupUserIds.splice(cleanupUserIds.indexOf(u3.user.id), 1);

    // ---- D: auth user deletion (route's follow-up step) ----
    console.log('\nD. Supabase auth user deletion');
    const { error: delErr } = await admin.auth.admin.deleteUser(u1AuthId);
    check('auth.admin.deleteUser succeeds', !delErr, delErr?.message);
    const { data: lookup } = await admin.auth.admin.getUserById(u1AuthId);
    check('auth user unretrievable', !lookup?.user);
  } finally {
    // ---- cleanup (idempotent) ----
    for (const id of cleanupUserIds) {
      await deleteAccountData(id, { deleteOwnedTeamWorkspaces: true }).catch(() => {});
    }
    await admin.auth.admin.deleteUser(u1AuthId).catch(() => {});
    await prisma.$disconnect();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
