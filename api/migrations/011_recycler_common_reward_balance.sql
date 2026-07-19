-- Reduce the provisional common duplicate floor to exactly one Star per batch.
UPDATE fo_recycler_recipes
SET reward='{"currencyId":"stars","amount":1}'::jsonb,
    config_version=config_version+1,
    updated_at=NOW()
WHERE recipe_id='common-stars-v1';
