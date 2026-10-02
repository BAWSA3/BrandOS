#!/usr/bin/env bash
# Bring the STAGING database up to prod's schema + security baseline.
#
#   bash scripts/apply-staging-catchup.sh
#
# Pulls the brandos-staging env from Vercel into a temp file, refuses to run
# unless it points at the staging Supabase project, applies the migrations
# staging is missing (each in its own transaction; stops at the first
# failure), deletes the temp env, then runs the RLS acceptance suite.
# Safe to re-run: every migration here is idempotent.
set -euo pipefail

STAGING_REF="mfptimxnmerkqwnkypfm" # brandos-staging Supabase project
MIGRATIONS=(
  008_add_worlds.sql
  010_harden_brandscans_anon_insert.sql
  011_fix_rls_recursion.sql
  012_tos_acknowledgment.sql
  013_processed_webhooks.sql
  014_brand_workspace.sql
  015_workspace_plan_backfill.sql
  016_user_profiles_cache.sql
  017_rls_baseline_from_prod.sql
)

cd "$(dirname "$0")/.."
ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE"' EXIT

echo "Pulling brandos-staging env from Vercel..."
VERCEL_ORG_ID=team_UzPDxcD6zGqrc9mFnyzeeSjz \
VERCEL_PROJECT_ID=prj_4T2IXEzVP0Hr8y47MKEyhrC6w3Vq \
  vercel env pull "$ENV_FILE" --environment production --yes >/dev/null

DB_URL="$(grep -E '^(POSTGRES_URL_NON_POOLING|DIRECT_URL)=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')"
if [[ "$DB_URL" != *"$STAGING_REF"* ]]; then
  echo "ABORT: the pulled env does not point at the staging DB ($STAGING_REF). Nothing was applied."
  exit 1
fi
echo "Target confirmed: staging ($STAGING_REF)"
echo

for m in "${MIGRATIONS[@]}"; do
  node --env-file="$ENV_FILE" scripts/apply-migration.mjs "supabase-migrations/$m"
done

echo
echo "Running the RLS acceptance suite against staging..."
node --env-file="$ENV_FILE" scripts/rls-acceptance.mjs
