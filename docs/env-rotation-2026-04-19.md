# Env Rotation — Vercel April 2026 Incident

**Trigger**: [Vercel bulletin](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident) — unmarked env vars potentially exposed via compromised third-party OAuth app.

**Scope**: All 3 Vercel projects under `jeffrey-basas-projects`: `brandos`, `brandos-staging`, `verity-trainer`. Supabase topology: **BrandOS (prod) and verity-trainer share the same Supabase project**. brandos-staging has a separate Supabase project. Confirmed: **no env vars marked "Sensitive" in Vercel dashboard → all secrets treated as exposed.**

**X OAuth encryption key**: safe to rotate as simple swap — confirmed `total_x_connections = 0` in DB, no encrypted rows to migrate.

---

## Priority 1 — Supabase rotations (highest blast radius)

### 1A. BrandOS prod Supabase (shared with verity-trainer)

Supabase project ref: `gdxvijmezkwlqdnxfxpe`.

**Steps:**
1. Supabase dashboard → Project `gdxvijmezkwlqdnxfxpe` → **Settings → API**
   - Click "Reset" next to **service_role key** → copy new value
   - Click "Reset" next to **anon key** → copy new value
   - (If present) rotate **JWT secret** → Auth → JWT Settings → Rotate
2. Supabase dashboard → **Settings → Database → Database password → Generate new password** → copy new value
3. Update **both** Vercel projects (brandos + verity-trainer) simultaneously. Use the Vercel dashboard UI for speed (paste new values into existing vars), or CLI:

```bash
# From BrandOS repo dir
vercel env rm SUPABASE_SERVICE_ROLE_KEY production -y
vercel env add SUPABASE_SERVICE_ROLE_KEY production   # paste new value at prompt

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ...repeat for every SUPABASE_* + POSTGRES_* + DATABASE_URL + DIRECT_URL

# Same names must also be rotated in Preview + Development envs
vercel env rm SUPABASE_SERVICE_ROLE_KEY preview -y
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
```

Full key list for BrandOS prod Supabase (all need replacement):
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_JWT_SECRET` (only if rotated in dashboard)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_PRISMA_URL`
- `DIRECT_URL`

For verity-trainer (same Supabase, 3 env rows):
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Redeploy both Vercel projects: `vercel --prod` in each repo dir (or "Redeploy latest" in dashboard).
5. Smoke test: load one page on each app that requires DB. If 401s appear, old cached key is still in use — hard refresh or wait for edge cache.
6. Rotate local `.env.local` for dev: `vercel env pull .env.local` in each repo.

### 1B. brandos-staging Supabase (separate project)

Same flow as above against the **staging** Supabase project. Env keys list:
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

---

## Priority 2 — Third-party API keys

For each service: create new key in provider dashboard → update in Vercel → deploy → revoke old key.

| Service | Dashboard | Env var(s) | Projects |
|---|---|---|---|
| Anthropic | https://console.anthropic.com/settings/keys | `ANTHROPIC_API_KEY` | brandos, brandos-staging |
| OpenAI | https://platform.openai.com/api-keys | `OPENAI_API_KEY` | verity-trainer |
| Google Gemini | https://aistudio.google.com/apikey | `GOOGLE_GEMINI_API_KEY` | brandos, brandos-staging |
| Resend | https://resend.com/api-keys | `RESEND_API_KEY` | brandos |
| SocialData | https://socialdata.tools/ (dashboard) | `SOCIALDATA_API_KEY` | brandos, brandos-staging |
| X / Twitter | https://developer.x.com/en/portal/projects-and-apps | `X_BEARER_TOKEN` | brandos, brandos-staging |
| Stripe | https://dashboard.stripe.com/apikeys | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | brandos-staging (+ `.env` on laptop) |

**Stripe special case**: `STRIPE_WEBHOOK_SECRET` is per-endpoint. When you roll the key, you may need to recreate the webhook endpoint in Stripe, or just roll the secret on the existing one (Stripe dashboard → Developers → Webhooks → your endpoint → "Roll secret").

**Per-service update commands** (example for Anthropic, repeat pattern):
```bash
# brandos
vercel env rm ANTHROPIC_API_KEY production -y
vercel env add ANTHROPIC_API_KEY production   # paste new key

# brandos-staging (need to link to that project first, or use --scope)
cd /tmp/staging && vercel link --yes --project brandos-staging --scope jeffrey-basas-projects
vercel env rm ANTHROPIC_API_KEY production -y
vercel env add ANTHROPIC_API_KEY production
```

---

## Priority 3 — Self-generated keys (no third-party involved)

These are random values only your apps know. Generate fresh 32-byte base64url strings and update in Vercel.

**Generate:** run in any terminal (value stays in your shell, not committed):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

| Var | Project | Notes |
|---|---|---|
| `ADMIN_API_KEY` | brandos | Gates internal admin API |
| `CRON_SECRET` | brandos-staging | Validates Vercel cron callbacks |
| `X_OAUTH_ENCRYPTION_KEY` | brandos-staging | Safe simple swap — no encrypted rows exist in DB |

Rotation: `vercel env rm <NAME> <ENV> -y && vercel env add <NAME> <ENV>` for each env (Production/Preview/Development).

---

## Priority 4 — Investigate local-only keys

Discovered in `BrandOS/.env` and `.env.local` but NOT in Vercel. Confirm what each is and whether to rotate/delete:

| Key | File | Question |
|---|---|---|
| `ADMIN_KEY` | `.env` | Used anywhere? Duplicate of `ADMIN_API_KEY`? |
| `MOTION_PLUS_TOKEN` | `.env` | For Motion (the scheduling app)? Needed? |
| `ADMIN_SECRET` | `.env.local` | Real credential or placeholder? |
| `BRANDOS_API_KEY` | `.env.local` | Authenticates requests TO BrandOS? |

**Recommended**: grep codebase for each — if no usage, delete. If used, add to Vercel + rotate. `VERCEL_OIDC_TOKEN` auto-rotates, skip.

---

## Post-rotation audit checklist

Per Vercel bulletin remediation steps:

- [ ] **Activity log**: Vercel dashboard → Account → Activity Log. Review last 30 days for any unrecognized logins/API calls/env-var reads.
- [ ] **Recent deployments**: check each project's deployments list for any you didn't trigger. Particularly preview branches from unknown PRs.
- [ ] **Deployment Protection**: Settings → Deployment Protection → ensure set to **Standard** minimum on all 3 projects.
- [ ] **Deployment Protection tokens**: if any exist (Settings → Deployment Protection → Protection Bypass for Automation), rotate them.
- [ ] **Vercel access tokens**: Account → Settings → Tokens. Delete any you don't recognize or don't need. Rotate any you do need.
- [ ] **Team members + integrations**: Team settings → Members & Integrations. Remove any third-party apps you no longer use (especially AI tools — the breach root cause was a compromised OAuth integration).

---

## Order of operations (recommended sequence)

Do within a single session to minimize windows of inconsistency:

1. **Start**: generate all new third-party keys in provider dashboards (keep old ones live for now — don't revoke yet).
2. **Rotate self-generated keys** (`ADMIN_API_KEY`, `CRON_SECRET`, `X_OAUTH_ENCRYPTION_KEY`) — zero external dependency, no coordination risk.
3. **Rotate third-party API keys in Vercel** — paste new values into Vercel env (keep Supabase for last).
4. **Redeploy** `brandos`, `brandos-staging`, `verity-trainer` to pick up the new API keys.
5. **Smoke test** each app: hit an endpoint that exercises each rotated service.
6. **Revoke old third-party keys** in provider dashboards.
7. **Supabase DB password reset** — this is the one that causes a brief outage. Do last because the dependencies are clearest.
8. **Update Supabase keys in Vercel** + redeploy immediately after (target <2 min gap).
9. **Smoke test**, then **revoke old Supabase DB password** if applicable.
10. **Audit checklist** above.
11. **Pull refreshed local env**: `vercel env pull .env.local` in each repo.

---

## After rotation

- Mark all rotated env vars as **Sensitive** in Vercel dashboard (toggle per-var). This means future similar incidents won't expose them.
- Consider moving `X_OAUTH_ENCRYPTION_KEY` to AWS/GCP KMS per `docs/SECURITY-HARDENING.md` Phase 9 plan.
- Commit this doc under `docs/` as the incident record.
