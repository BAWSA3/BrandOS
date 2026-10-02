-- 013: Stripe webhook idempotency (Launch Bar Week 3)
-- One row per processed Stripe event id. A replayed/duplicate delivery finds
-- the PK taken and no-ops. Rows older than 7 days are purged opportunistically
-- by the webhook handler (Stripe never retries beyond ~3 days).

CREATE TABLE IF NOT EXISTS "ProcessedWebhook" (
  id            TEXT PRIMARY KEY,           -- Stripe event id (evt_...)
  event_type    TEXT NOT NULL,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_processed_at
  ON "ProcessedWebhook" (processed_at);

-- Service-role only: RLS on with NO policies denies anon + authenticated.
ALTER TABLE "ProcessedWebhook" ENABLE ROW LEVEL SECURITY;
