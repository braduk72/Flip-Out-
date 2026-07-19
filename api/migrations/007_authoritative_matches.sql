ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS rules_version TEXT NOT NULL DEFAULT 'memory-v1';
ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'vs';
ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'Medium';
ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS deck_id TEXT;
ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS sequence BIGINT NOT NULL DEFAULT 0;
ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');
ALTER TABLE fo_matches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS fo_match_events (
  event_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES fo_matches(match_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  sequence BIGINT NOT NULL CHECK (sequence > 0),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  resulting_state_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, sequence)
);
CREATE INDEX IF NOT EXISTS fo_match_events_player_idx ON fo_match_events(player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_match_progress_events (
  progress_event_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES fo_matches(match_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  value BIGINT NOT NULL CHECK (value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
