CREATE TABLE IF NOT EXISTS fo_recycler_recipes (
  recipe_id TEXT PRIMARY KEY,
  rarity TEXT NOT NULL CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  batch_size INTEGER NOT NULL CHECK (batch_size > 1),
  reward JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config_version INTEGER NOT NULL DEFAULT 1 CHECK (config_version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(reward) = 'object')
);

-- Provisional development recipe. Its value is deliberately data-driven so it can
-- be balanced without changing the recycling transaction code.
INSERT INTO fo_recycler_recipes(recipe_id,rarity,batch_size,reward,enabled,config_version)
VALUES('common-stars-v1','common',5,'{"currencyId":"stars","amount":5}'::jsonb,TRUE,1)
ON CONFLICT(recipe_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS fo_recycler_transactions (
  transaction_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES fo_recycler_recipes(recipe_id),
  input_fingerprint TEXT NOT NULL,
  cards_consumed INTEGER NOT NULL CHECK (cards_consumed > 0),
  batches INTEGER NOT NULL CHECK (batches > 0),
  reward JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(reward) = 'object')
);
CREATE INDEX IF NOT EXISTS fo_recycler_transactions_player_idx
  ON fo_recycler_transactions(player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_recycler_transaction_items (
  transaction_id TEXT NOT NULL REFERENCES fo_recycler_transactions(transaction_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY(transaction_id,item_id)
);
CREATE INDEX IF NOT EXISTS fo_recycler_transaction_items_item_idx
  ON fo_recycler_transaction_items(item_id, transaction_id);
