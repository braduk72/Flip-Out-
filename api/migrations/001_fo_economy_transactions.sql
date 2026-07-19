CREATE TABLE IF NOT EXISTS fo_economy_transactions (
  transaction_id TEXT PRIMARY KEY,
  device_uuid    TEXT NOT NULL,
  source         TEXT NOT NULL,
  payload        JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fo_economy_transactions_device_idx
  ON fo_economy_transactions (device_uuid, created_at);
