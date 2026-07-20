ALTER TABLE fo_recycler_recipes
  ADD COLUMN IF NOT EXISTS selection_type TEXT NOT NULL DEFAULT 'duplicates-by-rarity';

-- The old duplicate-card Recycler recipe is superseded by the Shredder.
UPDATE fo_recycler_recipes
SET enabled=FALSE,
    updated_at=NOW()
WHERE recipe_id='common-stars-v1';

INSERT INTO fo_recycler_recipes(recipe_id,rarity,batch_size,reward,enabled,config_version,selection_type)
VALUES
  ('shredder-normal-cards-v1','common',5,'{"currencyId":"coins","amount":10}'::jsonb,TRUE,1,'normal-card-any'),
  ('shredder-foil-card-v1','common',1,'{"currencyId":"coins","amount":25}'::jsonb,TRUE,1,'foil-card-any')
ON CONFLICT(recipe_id) DO UPDATE
SET reward=EXCLUDED.reward,
    batch_size=EXCLUDED.batch_size,
    enabled=TRUE,
    selection_type=EXCLUDED.selection_type,
    config_version=GREATEST(fo_recycler_recipes.config_version, EXCLUDED.config_version),
    updated_at=NOW();
