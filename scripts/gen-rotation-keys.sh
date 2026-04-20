#!/usr/bin/env bash
# Generates fresh 32-byte base64url keys for the 3 self-generated env vars
# rotated as part of the 2026-04 Vercel incident response.
#
# Values print to YOUR terminal only — not written to disk, not committed,
# not pushed anywhere. Copy each one into the Vercel dashboard under the
# correct project + environment + Sensitive flag.
#
# Usage:
#   bash scripts/gen-rotation-keys.sh

set -euo pipefail

gen() {
  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
}

cat <<'EOF'
════════════════════════════════════════════════════════════════════
VERCEL ENV ROTATION — self-generated keys
════════════════════════════════════════════════════════════════════
Paste each value below into the Vercel dashboard:
  https://vercel.com/jeffrey-basas-projects

For each: open the project → Settings → Environment Variables → find
the variable → Edit → paste new value → toggle "Sensitive" ON → Save.

Then remember to:
  1. Redeploy the project (Deployments → Redeploy latest).
  2. Run `vercel env pull .env.local` locally to refresh dev.
════════════════════════════════════════════════════════════════════

EOF

echo "PROJECT: brandos"
echo "────────────────"
printf "  ADMIN_API_KEY  = %s\n\n" "$(gen)"

echo "PROJECT: brandos-staging"
echo "────────────────────────"
printf "  CRON_SECRET             = %s\n"   "$(gen)"
printf "  X_OAUTH_ENCRYPTION_KEY  = %s\n\n" "$(gen)"

cat <<'EOF'
════════════════════════════════════════════════════════════════════
ADMIN_SECRET (local .env.local only — not in Vercel)
────────────────────────────────────────────────────
Used by src/app/api/v1/keys/route.ts. Replace the value in
BrandOS/.env.local then restart your dev server.

EOF
printf "  ADMIN_SECRET = %s\n\n" "$(gen)"

cat <<'EOF'
════════════════════════════════════════════════════════════════════
When all 4 keys are replaced:
  ✓ Redeploy brandos (for ADMIN_API_KEY)
  ✓ Redeploy brandos-staging (for CRON_SECRET + X_OAUTH_ENCRYPTION_KEY)
  ✓ Restart dev server (for ADMIN_SECRET)
════════════════════════════════════════════════════════════════════
EOF
