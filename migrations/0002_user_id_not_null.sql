-- userId is server-stamped on every create, so persisted rows always have an owner.
-- Make that a hard guarantee. (Fails if legacy orphan rows have NULL user_id — those
-- must be reassigned or deleted manually before applying.)
ALTER TABLE inquiry ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE offer   ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE "order" ALTER COLUMN user_id SET NOT NULL;
