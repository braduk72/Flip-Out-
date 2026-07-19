CREATE TABLE IF NOT EXISTS fo_matches (
  match_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  advert_continue_used BOOLEAN NOT NULL DEFAULT FALSE,
  coin_continue_used BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fo_daily_actions (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  action_type TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, local_date, action_type)
);

CREATE TABLE IF NOT EXISTS fo_advert_completions (
  completion_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_receipt_hash TEXT NOT NULL UNIQUE,
  placement TEXT NOT NULL,
  match_id TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fo_market_listings (
  listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES fo_accounts(player_id),
  item_id TEXT NOT NULL,
  quantity BIGINT NOT NULL CHECK (quantity > 0),
  price_coins BIGINT NOT NULL CHECK (price_coins > 0),
  status TEXT NOT NULL DEFAULT 'active',
  buyer_id UUID REFERENCES fo_accounts(player_id),
  gross_coins BIGINT,
  fee_coins BIGINT,
  net_coins BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS fo_market_listings_active_idx ON fo_market_listings(status, created_at DESC);

CREATE TABLE IF NOT EXISTS fo_event_progress (
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  progress BIGINT NOT NULL DEFAULT 0 CHECK (progress >= 0),
  claimed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, event_id, stage_id)
);

CREATE TABLE IF NOT EXISTS fo_choice_claims (
  entitlement_id TEXT PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fo_cloud_saves (
  player_id UUID PRIMARY KEY REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  save_version INTEGER NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fo_economy_audit (
  audit_id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES fo_accounts(player_id),
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fo_economy_audit_player_idx ON fo_economy_audit(player_id, created_at DESC);
