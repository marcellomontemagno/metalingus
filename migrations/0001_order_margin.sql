-- Adds the broker's per-order markup. Stored as a decimal fraction (0.10 = 10%).
-- Existing seeded orders default to 0 (no markup).
ALTER TABLE "order" ADD COLUMN margin DECIMAL(6,4) NOT NULL DEFAULT 0;
