CREATE TABLE IF NOT EXISTS fo_coin_ledger (
  transaction_id TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE RESTRICT,
  ledger_sequence BIGINT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount <> 0),
  transaction_type TEXT NOT NULL,
  source_reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_ledger_hash TEXT NOT NULL,
  ledger_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (account_id, ledger_sequence),
  UNIQUE (account_id, ledger_hash)
);

CREATE INDEX IF NOT EXISTS fo_coin_ledger_account_time_idx
  ON fo_coin_ledger(account_id, ledger_sequence);
CREATE UNIQUE INDEX IF NOT EXISTS fo_coin_ledger_purchase_reference_idx
  ON fo_coin_ledger(source_reference_id)
  WHERE transaction_type = 'purchase';
CREATE INDEX IF NOT EXISTS fo_coin_ledger_source_idx
  ON fo_coin_ledger(source_reference_id, transaction_type);

-- Development has no live users. Start the premium ledger from a clean authority boundary.
UPDATE fo_player_balances SET balance=0, updated_at=NOW() WHERE currency_id='coins';

CREATE OR REPLACE FUNCTION fo_coin_ledger_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'fo_coin_ledger is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fo_coin_ledger_no_update ON fo_coin_ledger;
CREATE TRIGGER fo_coin_ledger_no_update BEFORE UPDATE OR DELETE ON fo_coin_ledger
FOR EACH ROW EXECUTE FUNCTION fo_coin_ledger_immutable();
