// ============================================================================
// DELETE /api/account — delete the CURRENT user's account and personal data
//
// Service-role justification (see src/lib/supabase-admin.ts contract):
// this route imports createAdminClient solely for auth.admin.deleteUser on
// the caller's OWN Supabase auth user. Authorization enforced in place:
// the session user can only ever delete themselves — the target id comes
// from getCurrentUser(), never from request input.
//
// Contract:
//   body { confirm: "DELETE MY ACCOUNT", deleteOwnedTeamWorkspaces?: boolean }
//   401 no session · 400 missing/wrong confirm phrase
//   409 user owns team workspaces and hasn't consented to cascade-delete
//   200 { deleted: true, counts }
//
// Sequence: DB transaction first (hard-deletes app data), then Supabase auth
// user, then best-effort Stripe subscription cancel. If auth deletion fails
// after the DB purge, the data is already gone (GDPR-safe) and the failure is
// audit-logged for manual cleanup.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  deleteAccountData,
  OwnedTeamWorkspacesError,
} from '@/lib/account-deletion';
import { logSecurityEvent, getClientIp } from '@/lib/audit-log';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { stripe } from '@/lib/stripe';

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

async function handleDelete(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { confirm?: string; deleteOwnedTeamWorkspaces?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // fall through — missing body fails the confirm check below
  }

  if (body.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: `Confirmation required. Send { "confirm": "${CONFIRM_PHRASE}" }.` },
      { status: 400 },
    );
  }

  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent');
  const { supabaseId, stripeSubscriptionId } = user;

  let counts;
  try {
    counts = await deleteAccountData(user.id, {
      deleteOwnedTeamWorkspaces: body.deleteOwnedTeamWorkspaces === true,
    });
  } catch (error) {
    if (error instanceof OwnedTeamWorkspacesError) {
      return NextResponse.json(
        {
          error:
            'You own team workspaces. Deleting your account will permanently delete them and all their data. Re-send with { "deleteOwnedTeamWorkspaces": true } to confirm.',
          ownedTeamWorkspaces: error.workspaces,
        },
        { status: 409 },
      );
    }
    console.error('[Account] Deletion transaction failed:', error);
    await logSecurityEvent({
      category: 'account',
      eventType: 'account_deletion_failed',
      userId: user.id,
      success: false,
      metadata: { error_code: 'db_transaction_failed' },
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: 'Account deletion failed. Nothing was deleted — please retry or contact support.' },
      { status: 500 },
    );
  }

  // App data is gone. Now the Supabase auth user (self-delete only — id from session).
  let authDeleted = true;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(supabaseId);
    if (error) throw error;
  } catch (error) {
    authDeleted = false;
    console.error('[Account] Supabase auth user deletion failed:', error);
  }

  // Best-effort: stop billing. Stripe is null when STRIPE_SECRET_KEY is unset.
  if (stripe && stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(stripeSubscriptionId);
    } catch (error) {
      console.error('[Account] Stripe subscription cancel failed:', error);
    }
  }

  // userId omitted: the User row no longer exists (FK would reject it).
  await logSecurityEvent({
    category: 'account',
    eventType: authDeleted ? 'account_deleted' : 'account_deleted_auth_orphan',
    success: authDeleted,
    metadata: { target_id: user.id, count: counts.brandScans },
    ip,
    userAgent,
  });

  return NextResponse.json({ deleted: true, counts });
}

export const DELETE = withRateLimit(handleDelete, rateLimiters.strict);
