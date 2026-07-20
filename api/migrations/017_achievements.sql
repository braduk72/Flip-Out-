CREATE TABLE IF NOT EXISTS fo_achievement_events (
  event_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, event_type, event_key)
);

CREATE INDEX IF NOT EXISTS fo_achievement_events_player_idx
  ON fo_achievement_events(player_id, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_achievement_unlocks (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  input_fingerprint TEXT NOT NULL,
  rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(player_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS fo_achievement_unlocks_player_idx
  ON fo_achievement_unlocks(player_id, unlocked_at DESC);
