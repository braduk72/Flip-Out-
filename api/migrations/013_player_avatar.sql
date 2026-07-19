-- Avatar IDs reference the application catalogue; image paths are never persisted.
ALTER TABLE fo_accounts
  ADD COLUMN IF NOT EXISTS selected_avatar_id TEXT;

