CREATE TABLE IF NOT EXISTS fo_personal_albums (
  album_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_transaction_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fo_personal_albums_player_idx
  ON fo_personal_albums(player_id, created_at);

CREATE TABLE IF NOT EXISTS fo_personal_album_cards (
  album_id UUID NOT NULL REFERENCES fo_personal_albums(album_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('normal','foil')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(album_id, item_id, variant)
);

CREATE INDEX IF NOT EXISTS fo_personal_album_cards_player_idx
  ON fo_personal_album_cards(player_id, album_id, item_id);

CREATE TABLE IF NOT EXISTS fo_personal_album_transactions (
  transaction_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  input_fingerprint TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(result) = 'object')
);

CREATE INDEX IF NOT EXISTS fo_personal_album_transactions_player_idx
  ON fo_personal_album_transactions(player_id, created_at DESC);
