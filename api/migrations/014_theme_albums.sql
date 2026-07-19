CREATE TABLE IF NOT EXISTS fo_theme_album_entries (
  transaction_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE RESTRICT,
  theme_id TEXT NOT NULL,
  card_item_id TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('normal','foil')),
  stuck_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, theme_id, card_item_id, variant)
);

CREATE INDEX IF NOT EXISTS fo_theme_album_entries_player_theme_idx
  ON fo_theme_album_entries(player_id, theme_id, variant, card_item_id);

CREATE TABLE IF NOT EXISTS fo_theme_album_collectors (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE RESTRICT,
  theme_id TEXT NOT NULL,
  collector_tier TEXT NOT NULL CHECK (collector_tier IN ('bronze','silver','gold')),
  awarded_by_transaction_id TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(player_id, theme_id, collector_tier)
);

CREATE INDEX IF NOT EXISTS fo_theme_album_collectors_player_idx
  ON fo_theme_album_collectors(player_id, awarded_at DESC);

CREATE TABLE IF NOT EXISTS fo_theme_album_transactions (
  transaction_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE RESTRICT,
  input_fingerprint TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(result) = 'object')
);

CREATE INDEX IF NOT EXISTS fo_theme_album_transactions_player_idx
  ON fo_theme_album_transactions(player_id, created_at DESC);

CREATE OR REPLACE FUNCTION fo_theme_album_entries_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'fo_theme_album_entries is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fo_theme_album_entries_no_update ON fo_theme_album_entries;
CREATE TRIGGER fo_theme_album_entries_no_update BEFORE UPDATE OR DELETE ON fo_theme_album_entries
FOR EACH ROW EXECUTE FUNCTION fo_theme_album_entries_immutable();

CREATE OR REPLACE FUNCTION fo_theme_album_collectors_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'fo_theme_album_collectors is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fo_theme_album_collectors_no_update ON fo_theme_album_collectors;
CREATE TRIGGER fo_theme_album_collectors_no_update BEFORE UPDATE OR DELETE ON fo_theme_album_collectors
FOR EACH ROW EXECUTE FUNCTION fo_theme_album_collectors_immutable();
