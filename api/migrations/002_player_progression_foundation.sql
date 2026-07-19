CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS fo_accounts (
  player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  state_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fo_player_sessions (
  session_hash TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_player_sessions_player_idx ON fo_player_sessions(player_id, expires_at);

CREATE TABLE IF NOT EXISTS fo_player_devices (
  device_uuid TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_player_devices_player_idx ON fo_player_devices(player_id);

CREATE TABLE IF NOT EXISTS fo_player_balances (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  currency_id TEXT NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, currency_id)
);

CREATE TABLE IF NOT EXISTS fo_player_inventory (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity BIGINT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  bound_quantity BIGINT NOT NULL DEFAULT 0 CHECK (bound_quantity >= 0 AND bound_quantity <= quantity),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, item_id)
);

CREATE TABLE IF NOT EXISTS fo_player_transactions (
  transaction_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  item_id TEXT,
  currency_id TEXT,
  amount BIGINT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((item_id IS NULL) <> (currency_id IS NULL))
);
CREATE INDEX IF NOT EXISTS fo_player_transactions_player_idx ON fo_player_transactions(player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_player_claims (
  claim_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fo_economy_transactions ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES fo_accounts(player_id);
CREATE INDEX IF NOT EXISTS fo_economy_transactions_player_idx ON fo_economy_transactions(player_id, created_at DESC);
