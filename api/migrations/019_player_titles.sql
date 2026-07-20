-- Player Titles are cosmetics selected on the account profile.
-- Title item ownership can expand later; display names remain non-unique.
ALTER TABLE fo_accounts
  ADD COLUMN IF NOT EXISTS selected_title_prefix_id TEXT,
  ADD COLUMN IF NOT EXISTS selected_title_suffix_id TEXT;

ALTER TABLE fo_accounts
  DROP CONSTRAINT IF EXISTS fo_accounts_title_prefix_format;

ALTER TABLE fo_accounts
  ADD CONSTRAINT fo_accounts_title_prefix_format
  CHECK (selected_title_prefix_id IS NULL OR selected_title_prefix_id ~ '^title:prefix:[a-z0-9-]+$');

ALTER TABLE fo_accounts
  DROP CONSTRAINT IF EXISTS fo_accounts_title_suffix_format;

ALTER TABLE fo_accounts
  ADD CONSTRAINT fo_accounts_title_suffix_format
  CHECK (selected_title_suffix_id IS NULL OR selected_title_suffix_id ~ '^title:suffix:[a-z0-9-]+$');

