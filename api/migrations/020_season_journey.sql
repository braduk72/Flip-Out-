CREATE TABLE IF NOT EXISTS fo_seasons (
  season_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  score_per_level INTEGER NOT NULL CHECK (score_per_level > 0),
  tickets_per_level INTEGER NOT NULL CHECK (tickets_per_level > 0),
  collector_item_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS fo_seasons_single_active_idx ON fo_seasons(active) WHERE active;

CREATE TABLE IF NOT EXISTS fo_season_progress (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES fo_seasons(season_id) ON DELETE CASCADE,
  season_score BIGINT NOT NULL DEFAULT 0 CHECK (season_score >= 0),
  journey_level INTEGER NOT NULL DEFAULT 0 CHECK (journey_level >= 0),
  season_tickets BIGINT NOT NULL DEFAULT 0 CHECK (season_tickets >= 0),
  post_100_supply_claims INTEGER NOT NULL DEFAULT 0 CHECK (post_100_supply_claims >= 0),
  collector_awarded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, season_id)
);
CREATE INDEX IF NOT EXISTS fo_season_progress_season_idx ON fo_season_progress(season_id, journey_level DESC);

CREATE TABLE IF NOT EXISTS fo_season_score_events (
  event_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES fo_seasons(season_id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  score_amount INTEGER NOT NULL CHECK (score_amount > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_season_score_events_player_idx ON fo_season_score_events(player_id, season_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_season_ticket_transactions (
  transaction_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES fo_seasons(season_id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount <> 0),
  source TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_season_ticket_transactions_player_idx ON fo_season_ticket_transactions(player_id, season_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS fo_season_ticket_reference_unique ON fo_season_ticket_transactions(player_id, season_id, source, reference_id);

CREATE TABLE IF NOT EXISTS fo_season_reward_claims (
  claim_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES fo_seasons(season_id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  ticket_cost BIGINT NOT NULL CHECK (ticket_cost >= 0),
  reward JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_season_reward_claims_player_idx ON fo_season_reward_claims(player_id, season_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_season_missions (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES fo_seasons(season_id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly')),
  event_type TEXT NOT NULL,
  target BIGINT NOT NULL CHECK (target > 0),
  progress BIGINT NOT NULL DEFAULT 0 CHECK (progress >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','complete','claimed','rerolled')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (player_id, season_id, mission_id, period_start)
);
CREATE INDEX IF NOT EXISTS fo_season_missions_player_idx ON fo_season_missions(player_id, season_id, status);

CREATE TABLE IF NOT EXISTS fo_mission_reroll_usage (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  free_rerolls_used INTEGER NOT NULL DEFAULT 0 CHECK (free_rerolls_used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, local_date)
);

CREATE TABLE IF NOT EXISTS fo_mission_reroll_transactions (
  transaction_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES fo_seasons(season_id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('free','token','coins')),
  local_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fo_season_archive (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES fo_seasons(season_id) ON DELETE CASCADE,
  collector_item_id TEXT NOT NULL,
  proof_level INTEGER NOT NULL CHECK (proof_level >= 100),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, season_id)
);

INSERT INTO fo_seasons(season_id,name,starts_at,ends_at,active,score_per_level,tickets_per_level,collector_item_id,metadata)
VALUES(
  'season:2026-preview',
  'Preview Season',
  '2026-07-01T00:00:00.000Z',
  '2026-12-31T23:59:59.999Z',
  TRUE,
  1000,
  1,
  'season:2026-preview:collector-card',
  '{"track":"free-only","premiumTrack":false,"currency":"Season Score","spendCurrency":"Season Tickets"}'::jsonb
)
ON CONFLICT (season_id) DO UPDATE SET
  name=EXCLUDED.name,
  starts_at=EXCLUDED.starts_at,
  ends_at=EXCLUDED.ends_at,
  active=EXCLUDED.active,
  score_per_level=EXCLUDED.score_per_level,
  tickets_per_level=EXCLUDED.tickets_per_level,
  collector_item_id=EXCLUDED.collector_item_id,
  metadata=EXCLUDED.metadata;
