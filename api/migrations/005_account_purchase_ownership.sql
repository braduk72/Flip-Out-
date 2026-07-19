ALTER TABLE fo_purchases
  ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES fo_accounts(player_id);

CREATE INDEX IF NOT EXISTS fo_purchases_player_idx
  ON fo_purchases(player_id, status, completed_at);

CREATE INDEX IF NOT EXISTS fo_purchases_legacy_device_idx
  ON fo_purchases(device_uuid, status)
  WHERE player_id IS NULL;
