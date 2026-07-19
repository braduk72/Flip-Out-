ALTER TABLE fo_accounts ADD COLUMN IF NOT EXISTS account_kind TEXT NOT NULL DEFAULT 'legacy'
  CHECK (account_kind IN ('legacy', 'guest', 'protected'));

CREATE TABLE IF NOT EXISTS fo_account_identities (
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  player_id UUID NOT NULL REFERENCES fo_accounts(player_id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, provider_subject),
  UNIQUE (provider, player_id)
);
CREATE INDEX IF NOT EXISTS fo_account_identities_player_idx
  ON fo_account_identities(player_id, provider);
