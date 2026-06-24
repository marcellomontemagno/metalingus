-- Sample data for local dev (run after pnpm db:bootstrap). Users now live in
-- Better Auth's table, so we supply its required columns (text id, name,
-- emailVerified, createdAt, updatedAt). The db:seed guard prevents re-runs.

INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Sample Buyer', 'buyer@example.com', true, now(), now());
INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Sample Seller', 'seller@example.com', true, now(), now());

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM "user" u, role r
WHERE u.email = 'buyer@example.com' AND r.name = 'buyer';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id FROM "user" u, role r
WHERE u.email = 'seller@example.com' AND r.name = 'seller';

-- Inquiries (owned by the buyer)
INSERT INTO inquiry (bars_requested, latest_delivery_date, grade, shape, width, height, thickness, notes, user_id)
SELECT 100, (CURRENT_DATE + make_interval(days => 30))::date, 'S235JR', 'SQUARE', 50, 50, 5, 'Warehouse mezzanine - structural', id FROM "user" WHERE email = 'buyer@example.com';
INSERT INTO inquiry (bars_requested, latest_delivery_date, grade, shape, width, height, thickness, notes, user_id)
SELECT 200, (CURRENT_DATE + make_interval(days => 45))::date, 'DX51', 'RECTANGULAR', 80, 40, 4, 'Galvanized frame batch', id FROM "user" WHERE email = 'buyer@example.com';
INSERT INTO inquiry (bars_requested, latest_delivery_date, grade, shape, width, height, thickness, notes, user_id)
SELECT 150, NULL, 'S235JR', 'ROUND', 30, 30, 3, 'CHS for handrails', id FROM "user" WHERE email = 'buyer@example.com';

-- Offers (owned by the seller)
INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id)
SELECT 120, 'S235JR', 'SQUARE', 50, 50, 5, 25, 6.97, 11.50, 'EUR', 'Mill stock, prompt', id FROM "user" WHERE email = 'seller@example.com';
INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id)
SELECT 60, 'S235JR', 'SQUARE', 50, 50, 5, 20, 6.97, 13.20, 'EUR', 'Limited remainder', id FROM "user" WHERE email = 'seller@example.com';
INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id)
SELECT 200, 'S235JR', 'SQUARE', 50, 50, 6, 25, 8.13, 10.90, 'EUR', 'Heavier wall (6mm)', id FROM "user" WHERE email = 'seller@example.com';
INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id)
SELECT 250, 'DX51', 'RECTANGULAR', 80, 40, 4, 20, 6.71, 17.80, 'EUR', 'Galvanized', id FROM "user" WHERE email = 'seller@example.com';
INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id)
SELECT 180, 'DX51', 'RECTANGULAR', 80, 40, 4, 15, 6.71, 17.10, 'EUR', 'Spot deal', id FROM "user" WHERE email = 'seller@example.com';
INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id)
SELECT 200, 'S235JR', 'ROUND', 30, 30, 3, 50, 2.00, 8.40, 'EUR', 'CHS prompt', id FROM "user" WHERE email = 'seller@example.com';
INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id)
SELECT 90, 'DX51', 'SQUARE', 60, 60, 5, 10, 8.54, 19.50, 'EUR', 'Surplus, no current demand', id FROM "user" WHERE email = 'seller@example.com';
