-- One-time player-facing nickname. player_id remains the permanent unique identity.
ALTER TABLE fo_accounts
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE fo_accounts
  DROP CONSTRAINT IF EXISTS fo_accounts_display_name_format;

ALTER TABLE fo_accounts
  ADD CONSTRAINT fo_accounts_display_name_format
  CHECK (display_name IS NULL OR display_name ~ '^[A-Za-z0-9]{3,12}$');

