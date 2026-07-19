CREATE TABLE IF NOT EXISTS fo_reward_claims (
  claim_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL,
  context_id TEXT,
  reward_table_id TEXT,
  reward JSONB NOT NULL,
  local_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_reward_claims_player_idx ON fo_reward_claims(player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_player_streaks (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  best_count INTEGER NOT NULL DEFAULT 0 CHECK (best_count >= 0),
  last_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, streak_type)
);

CREATE TABLE IF NOT EXISTS fo_challenge_definitions (
  challenge_id TEXT PRIMARY KEY,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly','event')),
  event_type TEXT NOT NULL,
  target BIGINT NOT NULL CHECK (target > 0),
  reward JSONB NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS fo_challenge_progress (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES fo_challenge_definitions(challenge_id),
  progress BIGINT NOT NULL DEFAULT 0 CHECK (progress >= 0),
  claim_id TEXT UNIQUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS fo_lockbox_openings (
  opening_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  box_item_id TEXT NOT NULL,
  key_item_id TEXT NOT NULL,
  reward_table_id TEXT NOT NULL,
  reward JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fo_market_listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE fo_market_listings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS fo_rate_limits (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (player_id, action, window_start)
);
