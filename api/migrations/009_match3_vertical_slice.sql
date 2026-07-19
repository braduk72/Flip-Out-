CREATE TABLE IF NOT EXISTS fo_match3_sessions (
  session_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL CHECK (level_id BETWEEN 1 AND 20),
  seed BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','won','lost','abandoned')),
  state JSONB NOT NULL,
  base_stars_granted BOOLEAN NOT NULL DEFAULT FALSE,
  advert_stars_granted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS fo_match3_sessions_player_idx ON fo_match3_sessions(player_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS fo_match3_actions (
  action_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES fo_match3_sessions(session_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_match3_actions_session_idx ON fo_match3_actions(session_id, created_at);

CREATE TABLE IF NOT EXISTS fo_match3_progress (
  player_id UUID PRIMARY KEY REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  highest_unlocked_level INTEGER NOT NULL DEFAULT 1 CHECK (highest_unlocked_level BETWEEN 1 AND 20),
  completed_levels JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
