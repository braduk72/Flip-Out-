CREATE TABLE IF NOT EXISTS fo_player_inventory_settings (
  player_id UUID PRIMARY KEY REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  card_capacity INTEGER NOT NULL DEFAULT 1000 CHECK (card_capacity > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
