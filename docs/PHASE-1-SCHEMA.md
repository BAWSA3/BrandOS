# Phase 1 Schema Sketch

**Status:** Pre-implementation reference
**Scope:** New tables + RLS for the BrandOS account model (Users, Workspaces, ConnectedXAccounts, BrandScans).
**Companion:** `SECURITY-HARDENING.md` Phase 1
**Created:** 2026-04-13

This doc is the source-of-truth for the schema before migrations are written. Anything that conflicts with this should be raised before code lands.

---

## Mental model

```
auth.users (Supabase Auth)
   │
   │ 1:1
   ▼
User (BrandOS profile data)
   │
   ├──── owns ──── Workspace (personal, auto-created on signup)
   │                 │
   │                 ├──── has ──── ConnectedXAccount (1 for FREE, up to 3 for PRO/MAX)
   │                 │
   │                 └──── has ──── BrandScan (owned by user, scoped to personal workspace)
   │
   └──── member of ──── Workspace (Team type, may be many)
                         │
                         ├──── has ──── ConnectedXAccount (3 per seat aggregated, pooled)
                         │
                         └──── has ──── BrandScan (owned by workspace, persists if member leaves)
```

Key invariant: every `BrandScan` has both a `user_id` (who ran it) AND a `workspace_id` (where it lives). RLS uses workspace_id for Team scans (so scans persist past membership) and user_id for personal scans.

---

## Enums

```sql
CREATE TYPE plan_tier AS ENUM ('FREE', 'PRO', 'MAX', 'TEAM', 'ENTERPRISE');

CREATE TYPE workspace_type AS ENUM ('personal', 'team');

CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE connected_account_status AS ENUM ('active', 'dormant');

CREATE TYPE scan_visibility AS ENUM ('private', 'card_public');

CREATE TYPE scan_status AS ENUM ('active', 'dormant', 'archived');
```

---

## Tables

### `User` (extension of `auth.users`)

```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE "User" (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_role_idx ON "User"(role) WHERE role = 'admin';
```

`role` gates the `/admin/security` dashboard. Post-migration, set Jeffrey's row to `admin` manually.

Notes:
- `auth.users` is Supabase's auth table. Email/password, Google, Apple all create rows there.
- We mirror minimal fields here for app queries that don't need to JOIN to `auth.users`.
- `ON DELETE CASCADE` from `auth.users` triggers the deletion chain when a user deletes via Supabase Auth.

---

### `Workspace`

```sql
CREATE TABLE "Workspace" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type workspace_type NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  plan plan_tier NOT NULL DEFAULT 'FREE',
  seat_count integer NOT NULL DEFAULT 1 CHECK (seat_count >= 1),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT personal_must_have_one_seat
    CHECK (type != 'personal' OR seat_count = 1),
  CONSTRAINT team_min_5_seats
    CHECK (type != 'team' OR seat_count >= 5)
);

CREATE INDEX workspace_owner_idx ON "Workspace"(owner_user_id);
CREATE UNIQUE INDEX one_personal_per_user
  ON "Workspace"(owner_user_id) WHERE type = 'personal';
```

Notes:
- `ON DELETE RESTRICT` on `owner_user_id` — prevents orphaned workspaces. Account deletion flow must transfer ownership or cascade-delete the workspace explicitly.
- One personal workspace per user, enforced via partial unique index.
- Team workspaces require min 5 seats per business rule.
- Stripe IDs live on the workspace because billing is per-workspace (Typefully model).

---

### `WorkspaceMember`

```sql
CREATE TABLE "WorkspaceMember" (
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  invited_by_user_id uuid REFERENCES "User"(id),
  joined_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX wsmember_user_idx ON "WorkspaceMember"(user_id);
```

Notes:
- Personal workspaces get an automatic `WorkspaceMember` row with role `owner` for the owner. Same row covers personal-workspace permissions.
- Team workspace owners are also `WorkspaceMember` rows with role `owner`.
- Cascade delete on both sides — leaving a workspace cleanly drops the membership.

---

### `ConnectedXAccount`

```sql
CREATE TABLE "ConnectedXAccount" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  x_user_id text NOT NULL,
  x_username text NOT NULL,
  oauth_token_encrypted text NOT NULL,
  oauth_secret_encrypted text NOT NULL,
  status connected_account_status NOT NULL DEFAULT 'active',
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,

  CONSTRAINT unique_x_per_workspace UNIQUE (workspace_id, x_user_id)
);

CREATE INDEX cxa_user_idx ON "ConnectedXAccount"(user_id);
CREATE INDEX cxa_workspace_active_idx
  ON "ConnectedXAccount"(workspace_id) WHERE status = 'active';
```

Notes:
- Both `user_id` (who connected) and `workspace_id` (where it counts toward the cap). Personal workspace = personal pool; Team workspace = aggregated pool.
- Same X handle CAN be connected to multiple workspaces (e.g., personal + a Team workspace they're in). Unique constraint is per-workspace, not global.
- OAuth tokens encrypted at rest. Use Supabase Vault or app-level encryption with a key in env (`X_OAUTH_ENCRYPTION_KEY`).
- `status = 'dormant'` when the user disconnects. We retain the row so historical scans can be linked back. Reconnecting the same X handle flips status to `active`.

---

### `PlanLimit` (locked Q3, 2026-04-13)

```sql
CREATE TABLE "PlanLimit" (
  plan plan_tier PRIMARY KEY,
  -- Capacity (per-seat for TEAM, per-user/workspace for others)
  scans_per_day integer NOT NULL,
  x_accounts_per_seat integer NOT NULL,
  -- Feature flags
  multi_platform_enabled boolean NOT NULL DEFAULT false,
  competitor_watchlist_enabled boolean NOT NULL DEFAULT false,
  scheduled_rescans_enabled boolean NOT NULL DEFAULT false,
  priority_queue_enabled boolean NOT NULL DEFAULT false,
  -- Analysis depth knobs (Pro vs Max differentiation)
  max_flagged_tweets integer NOT NULL DEFAULT 3,
  audit_summary_max_chars integer NOT NULL DEFAULT 800,
  max_strengths integer NOT NULL DEFAULT 3,
  max_improvements integer NOT NULL DEFAULT 3
);

-- Seed (locked values — tune post-launch via SQL update, no deploy)
INSERT INTO "PlanLimit" VALUES
  -- plan,         scans/day, x/seat, multi, watch, resched, prio, flagged, summChars, strengths, improvements
  ('FREE',         1,         1,      false, false, false,   false, 3,       800,       3,         3),
  ('PRO',          20,        3,      true,  true,  true,    false, 5,       1200,      5,         5),
  ('MAX',          100,       5,      true,  true,  true,    true,  10,      2000,      7,         7),
  ('TEAM',         20,        3,      true,  true,  true,    false, 5,       1200,      5,         5),  -- per seat
  ('ENTERPRISE',   9999,      999,    true,  true,  true,    true,  20,      4000,      10,        10);
```

**Application interpretation rules:**
- For `TEAM` rows, `scans_per_day` and `x_accounts_per_seat` are **per seat**, multiplied by `Workspace.seat_count` to compute the workspace pool. Example: 10-seat Team workspace gets 200 scans/day and 30 X account slots. Unfilled seats still contribute (you get what you paid for).
- For `FREE`, `PRO`, `MAX`, `ENTERPRISE` rows, `scans_per_day` is per-user / per-personal-workspace.
- Analysis depth knobs apply per-scan and are passed into the LLM prompt at scan time. Higher caps mean longer outputs and more LLM cost — Max is priced to absorb this.
- All numbers tunable via SQL update without deploy.

**Audit credits intentionally absent:** audit reports stay à la carte (DNA Report, Score Boost Audit, Archetype Deep Dive, Intelligence Report — see `src/lib/plans.ts`). No bundling, no subscriber perks, no credit pool.

**Same-handle cache rule (locked Q3.16):** every scan handler must check for an existing `BrandScan` row on the same `connected_x_account_id` within the last 24h *before* counting the scan against the daily cap or invoking the LLM. Cached result is returned with a `cached: true` flag in the response. New helper: `src/lib/scan-cache.ts` `getCachedScan(connectedXAccountId)`.

---

### `BrandScan` (rewritten)

```sql
ALTER TABLE "BrandScans" RENAME TO "BrandScans_orphaned";  -- quarantine old data

CREATE TABLE "BrandScan" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  connected_x_account_id uuid NOT NULL REFERENCES "ConnectedXAccount"(id) ON DELETE RESTRICT,
  x_username text NOT NULL,            -- denormalized for queries; also persists if account disconnects

  -- analysis output (validated by Zod schema in app layer per Phase 4)
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  archetype text NOT NULL,
  phase_scores jsonb NOT NULL,
  strengths jsonb NOT NULL,
  improvements jsonb NOT NULL,
  insights jsonb,

  visibility scan_visibility NOT NULL DEFAULT 'private',
  status scan_status NOT NULL DEFAULT 'active',
  scanned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bscan_user_idx ON "BrandScan"(user_id);
CREATE INDEX bscan_workspace_idx ON "BrandScan"(workspace_id);
CREATE INDEX bscan_xaccount_idx ON "BrandScan"(connected_x_account_id);
CREATE INDEX bscan_card_public_idx
  ON "BrandScan"(x_username) WHERE visibility = 'card_public' AND status = 'active';
```

Notes:
- `ON DELETE RESTRICT` on `user_id` and `connected_x_account_id` — deletion must explicitly handle the cascade. Personal-account deletion runs an app-level hard-delete of personal scans first; Team workspace scans are never user-cascaded.
- `ON DELETE CASCADE` on `workspace_id` — when a workspace is deleted (owner-initiated, after transfer prompt declined), all its scans go with it.
- `BrandScans_orphaned` table is read-only during the 60-day grace period, then dropped via `scripts/purge-orphaned-scans.ts`.

---

### `brand_scans_public_card` view (for shareable card)

```sql
CREATE VIEW brand_scans_public_card AS
SELECT
  id,
  x_username,
  score,
  archetype,
  phase_scores,
  strengths,
  improvements,
  scanned_at
FROM "BrandScan"
WHERE visibility = 'card_public' AND status = 'active';

-- Allow anon to read this view only
GRANT SELECT ON brand_scans_public_card TO anon;

-- Lock down the base table to authenticated only via RLS (below)
REVOKE ALL ON "BrandScan" FROM anon;
```

---

## RLS policies

### `Workspace`

```sql
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_select_member ON "Workspace"
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT workspace_id FROM "WorkspaceMember" WHERE user_id = auth.uid()
  ));

CREATE POLICY workspace_update_admin ON "Workspace"
  FOR UPDATE TO authenticated
  USING (id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY workspace_delete_owner ON "Workspace"
  FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());
```

### `WorkspaceMember`

```sql
ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY wsmember_select_self_or_workspace ON "WorkspaceMember"
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember" WHERE user_id = auth.uid()
    )
  );

CREATE POLICY wsmember_insert_admin ON "WorkspaceMember"
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY wsmember_delete_admin_or_self ON "WorkspaceMember"
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()                       -- can leave a workspace
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

### `ConnectedXAccount`

```sql
ALTER TABLE "ConnectedXAccount" ENABLE ROW LEVEL SECURITY;

CREATE POLICY cxa_select_workspace ON "ConnectedXAccount"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember" WHERE user_id = auth.uid()
  ));

CREATE POLICY cxa_insert_self ON "ConnectedXAccount"
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember" WHERE user_id = auth.uid()
    )
  );

CREATE POLICY cxa_update_self ON "ConnectedXAccount"
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY cxa_delete_self_or_admin ON "ConnectedXAccount"
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

### `BrandScan`

```sql
ALTER TABLE "BrandScan" ENABLE ROW LEVEL SECURITY;

CREATE POLICY bscan_select_workspace_member ON "BrandScan"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember" WHERE user_id = auth.uid()
  ));

CREATE POLICY bscan_insert_via_own_xaccount ON "BrandScan"
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND connected_x_account_id IN (
      SELECT id FROM "ConnectedXAccount"
      WHERE user_id = auth.uid()
        AND workspace_id = "BrandScan".workspace_id
        AND status = 'active'
    )
  );

CREATE POLICY bscan_update_owner_or_admin ON "BrandScan"
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY bscan_delete_owner_or_admin ON "BrandScan"
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

---

## Application-layer invariants (NOT enforced by SQL)

These belong in `src/lib/auth.ts` and `src/lib/plans.ts`:

1. **X account cap enforcement**:
   - Personal workspace: `count(active ConnectedXAccount where workspace_id = personal) <= plan_limits.x_accounts_per_seat`
   - Team workspace: `count(active ConnectedXAccount where workspace_id = team) <= seat_count * plan_limits.x_accounts_per_seat`
2. **Daily scan cap**: count today's `BrandScan.scanned_at` rows against `plan_limits.scans_per_day` for the active workspace.
3. **Plan-feature gates** (multi-platform, competitor watchlist, scheduled rescans): check `plan_limits` flags before allowing the feature.
4. **Account deletion choreography**:
   - Hard-delete user's personal `BrandScan` rows
   - For each Team workspace they own: prompt for transfer; if declined, delete the workspace (cascades to members + scans)
   - For each Team workspace they're a member of: delete the `WorkspaceMember` row only
   - Then call `supabase.auth.admin.deleteUser(userId)` which cascades to `User`
5. **Reconnect-X-handle-after-disconnect**: if a `ConnectedXAccount` row exists in `dormant` status with the same `(workspace_id, x_user_id)`, update it to `active` rather than inserting a new row. Preserves the link to historical scans.

---

---

## Audit log table (resolved Q2, 2026-04-13)

```sql
CREATE TYPE audit_event_category AS ENUM (
  'auth',           -- login, logout, password reset, email change, account deletion
  'scan',           -- scan creation, rate-limit hit, plan-cap hit
  'payment',        -- checkout, webhook, subscription change, refund, chargeback
  'security',       -- RLS violation, output validation failure, injection match, CORS, BotID
  'account'         -- workspace create/delete, member changes, X account connect/disconnect, role change
);

CREATE TABLE "SecurityAuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category audit_event_category NOT NULL,
  event_type text NOT NULL,                  -- e.g. 'login_success', 'rls_violation', 'webhook_signature_failed'
  user_id uuid REFERENCES "User"(id) ON DELETE SET NULL,         -- nullable: unauthenticated events
  workspace_id uuid REFERENCES "Workspace"(id) ON DELETE SET NULL, -- nullable: account-scope events
  success boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,                  -- meta-signals only, no PII
  ip_hash text,                              -- sha256(ip + per-day salt), null when no IP
  user_agent_family text,                    -- 'chrome', 'safari', 'curl', etc. — never raw UA string
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sal_user_created_idx ON "SecurityAuditLog"(user_id, created_at DESC);
CREATE INDEX sal_workspace_created_idx ON "SecurityAuditLog"(workspace_id, created_at DESC);
CREATE INDEX sal_category_created_idx ON "SecurityAuditLog"(category, created_at DESC);
CREATE INDEX sal_purge_idx ON "SecurityAuditLog"(created_at);
```

**PII rule** enforced at the application layer in `src/lib/audit-log.ts`:
- `metadata` JSON fields whitelist only: `event_id`, `pattern_id`, `count`, `error_code`, `target_id` (FKs), `tier`, `role`. No `bio`, `tweet_text`, `email_body`, `oauth_token`.
- `ip_hash` rotates daily (per-day salt), so logs older than 24h cannot be cross-referenced to identify a viewer
- `user_agent_family` parses the UA into a single token and discards the rest

**RLS** on `SecurityAuditLog`:

```sql
ALTER TABLE "SecurityAuditLog" ENABLE ROW LEVEL SECURITY;

-- Admins read everything
CREATE POLICY sal_admin_read ON "SecurityAuditLog"
  FOR SELECT TO authenticated
  USING ((SELECT role FROM "User" WHERE id = auth.uid()) = 'admin');

-- Users read their own events only, last 30 days
CREATE POLICY sal_self_read ON "SecurityAuditLog"
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND created_at > now() - interval '30 days'
  );

-- Inserts: service role only (handlers + webhooks write via SUPABASE_SERVICE_ROLE_KEY)
-- No INSERT policy for authenticated → blocked by default
```

**Retention cron** at `/api/cron/purge-audit-log` (runs daily):

```sql
DELETE FROM "SecurityAuditLog"
WHERE
  (category IN ('auth', 'scan', 'account') AND created_at < now() - interval '90 days')
  OR
  (category IN ('payment', 'security') AND created_at < now() - interval '1 year');
```

Add to `vercel.json` crons.

**Personal activity log on settings page** is just a query against this same table:

```sql
SELECT category, event_type, success, metadata, created_at
FROM "SecurityAuditLog"
WHERE user_id = auth.uid()
  AND created_at > now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 100;
```

The RLS `sal_self_read` policy enforces the 30-day window automatically.

---

## Audit-report sharing (resolved Q1, 2026-04-13)

Paid audit reports are shared via signed URL with expiration. Add a new table:

```sql
CREATE TABLE "AuditReportShare" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_report_id uuid NOT NULL REFERENCES "AuditReport"(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  token text NOT NULL UNIQUE,                         -- 32-byte random, base64url
  expires_at timestamptz NOT NULL,                    -- default now() + interval '30 days'
  revoked_at timestamptz,                             -- null = active
  view_count integer NOT NULL DEFAULT 0,
  unique_viewer_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ars_token_idx ON "AuditReportShare"(token);
CREATE INDEX ars_active_idx ON "AuditReportShare"(audit_report_id) WHERE revoked_at IS NULL;
```

Companion: `AuditReportShareView` table for unique-viewer-IP tracking (hashed IPs only, no raw IPs stored, no geolocation).

```sql
CREATE TABLE "AuditReportShareView" (
  share_id uuid NOT NULL REFERENCES "AuditReportShare"(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,                              -- sha256(ip + per-share salt)
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  view_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (share_id, ip_hash)
);
```

Public route `/share/audit/[token]` reads the share, validates `expires_at > now() AND revoked_at IS NULL`, increments counters, returns the report view. No auth required for the recipient. The route uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for the public read (the token IS the auth).

**Owner controls** on dashboard:
- Generate new share link (auto-expires existing if desired)
- Extend expiration on existing share
- Revoke (sets `revoked_at = now()`)
- View stats (open count, unique viewers)

---

## Free card opt-out (resolved Q1, 2026-04-13)

Already covered by `BrandScan.visibility = 'card_public' | 'private'`. Default is `card_public`. Owner toggles to `private` from dashboard → the public view (`brand_scans_public_card`) immediately stops returning the row → `/card/[username]` returns 404 for non-owners. Owner-authenticated requests bypass the view and read the base table (RLS allows owner read regardless of visibility).

Application logic:
- Default `visibility = 'card_public'` on insert
- Settings toggle on dashboard updates `visibility`
- The public view filter (`WHERE visibility = 'card_public'`) handles the rest — no app-side gating needed for non-owners

---

## Resolved implementation decisions (2026-04-13)

### Impl-1: OAuth token encryption — app-level with libsodium

- **Library:** `libsodium-wrappers` `secretbox` (XSalsa20-Poly1305). Battle-tested, no foot-guns.
- **Master key:** stored in Vercel env as `X_OAUTH_ENCRYPTION_KEY`, marked `sensitive: true`. 32 bytes, base64-encoded.
- **Pattern (envelope encryption):** each `ConnectedXAccount` row stores `oauth_token_ciphertext`, `oauth_secret_ciphertext`, and `key_id` so we can rotate the master key without re-encrypting all rows immediately. Background job re-encrypts in batches.
- **New helper:** `src/lib/crypto.ts` exports `encryptOauthToken(plaintext)` and `decryptOauthToken(ciphertext, keyId)`.
- **Schema change to `ConnectedXAccount`:** rename `oauth_token_encrypted` → `oauth_token_ciphertext`, same for secret. Add `key_id text NOT NULL DEFAULT 'v1'`.
- **KMS migration deferred to Phase 9** (post-launch). Ticket: migrate `X_OAUTH_ENCRYPTION_KEY` to AWS or GCP KMS within 30 days of first paying customer.

### Impl-2: Existing X-OAuth user migration — soft-block, hard cutoff

- **Flow:** on next login by an existing X-OAuth user, intercept post-OAuth callback. Show migration screen: "BrandOS now uses email or social login. Add a primary credential to keep your account secure." User picks email+password OR Google OR Apple. Their X login moves to `ConnectedXAccount` with status `active`.
- **Email handling:** if Supabase X OAuth returned an email at original signup, pre-fill it. If missing, **require email entry + verification (magic link)** as part of the migration. Account is locked from full access until verified.
- **Hard cutoff:** no grace period. Next login = must migrate. Cleaner state, fewer edge cases.
- **Implementation:** new `src/app/migrate-account/page.tsx` + middleware check in `src/middleware.ts` that redirects pre-cutover users with no primary credential to this page.
- **Communication:** include this in the reclaim email send (`docs/RECLAIM-EMAIL.md`) so existing users aren't surprised. Also surface a banner inside the dashboard for X-OAuth users in the days leading up to the cutover.

### Impl-3: Stripe customer timing — payment-at-creation for Team, 14-day trial

- **Personal workspace:** created on signup, no Stripe customer until upgrade. At upgrade, create Stripe customer + subscription, store `stripe_customer_id` and `stripe_subscription_id` on `Workspace`.
- **Team workspace:** payment method required at creation. Atomic flow:
  1. User submits team workspace form (name, seat count, payment method via Stripe Elements)
  2. Server creates Stripe customer
  3. Server creates Stripe subscription with `trial_period_days: 14`
  4. On success, insert `Workspace` row with `plan = 'TEAM'`, seat count, both Stripe IDs
  5. Insert `WorkspaceMember` row for owner
  6. If any step fails, transaction rolls back and Stripe customer is voided
- **14-day trial:** card upfront, charge deferred 14 days. Standard SaaS pattern. User can cancel before day 14 with no charge.
- **Trial-end webhook:** `customer.subscription.trial_will_end` (3 days before) triggers a reminder email; `customer.subscription.updated` after trial-end transitions the workspace to active billing.

### Impl-4: Webhook RLS bypass — service-role client + ESLint guardrail

- **New helper:** `src/lib/supabase-admin.ts` exports `createAdminClient()` that uses `SUPABASE_SERVICE_ROLE_KEY`. Bypasses RLS entirely.
- **Allowed import paths** (enforced by ESLint rule):
  - `src/app/api/cron/**`
  - `src/app/api/stripe/webhook/**`
  - `src/app/api/admin/**` (admin-only routes, role-gated separately)
- **Banned everywhere else**, especially React components and user-facing API handlers without explicit role checks.
- **ESLint rule:** add to `.eslintrc` (or equivalent in flat config) using `no-restricted-imports` with a custom message pointing to this doc.
- **Code review checklist update:** any PR that adds a new file under the allowed paths must include a justification comment at the top of the file explaining why service-role is required.

### Impl-5: Audit credits column — REMOVED (resolved by Q3)

Audit reports are à la carte. `PlanLimit.audit_credits_per_month` removed from schema. See `PlanLimit` table definition above for the locked column set.
