-- 015: Backfill Workspace.plan from User.subscriptionTier for paying
-- subscribers whose personal workspace still says FREE.
--
-- Why: Workspace.plan has exactly two write sites — ensurePersonalWorkspace
-- (hardcodes FREE) and the Stripe webhook's syncWorkspacePlan (updateMany:
-- silent no-op if the personal workspace didn't exist at event time, and
-- invoice.paid only touches the User row). A pre-Phase-1 subscriber whose
-- workspace was created lazily at login sits at subscriptionTier=PRO /
-- plan=FREE until the next subscription.updated event — and forever if their
-- subscription lacks metadata.userId. The PRO gates on /api/repurpose and
-- /api/voice-fingerprint/* read workspace.plan, so those users get 403'd on
-- features they pay for.
--
-- Mapping mirrors legacyTierToPlanTier (src/lib/plans.ts): CREATOR → FREE,
-- AGENCY → TEAM, PRO/ENTERPRISE pass through. Only ACTIVE/TRIALING sync,
-- matching the webhook's dunning semantics. Idempotent; safe to re-run.

UPDATE "Workspace" w
SET plan = CASE u."subscriptionTier"::text
    WHEN 'AGENCY' THEN 'TEAM'::plan_tier
    -- enum → enum must round-trip through text
    ELSE u."subscriptionTier"::text::plan_tier
  END,
  updated_at = now()
FROM "User" u
WHERE w.owner_user_id = u.id
  AND w.type = 'personal'
  AND w.plan = 'FREE'
  AND u."subscriptionTier" IN ('PRO', 'AGENCY', 'ENTERPRISE')
  AND u."subscriptionStatus" IN ('ACTIVE', 'TRIALING');

-- Verification (expect 0 rows after apply):
-- SELECT u.id, u."subscriptionTier", w.plan
-- FROM "User" u JOIN "Workspace" w
--   ON w.owner_user_id = u.id AND w.type = 'personal'
-- WHERE u."subscriptionTier" IN ('PRO', 'AGENCY', 'ENTERPRISE')
--   AND u."subscriptionStatus" IN ('ACTIVE', 'TRIALING')
--   AND w.plan = 'FREE';
