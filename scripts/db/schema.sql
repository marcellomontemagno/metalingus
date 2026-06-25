-- metalingus app schema. Better Auth owns user/session/account/verification
-- (created by `better-auth migrate`); this file creates only the app's own tables
-- and FKs to Better Auth's text `user(id)`. Run AFTER the migrate: pnpm db:bootstrap

CREATE TYPE shape AS ENUM ('SQUARE', 'RECTANGULAR', 'ROUND');

CREATE TYPE grade AS ENUM ('S235JR', 'DX51');

CREATE TYPE order_status AS ENUM ('MATCHED', 'APPROVED', 'PAID', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

CREATE TABLE inquiry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bars_requested INT NOT NULL,
    latest_delivery_date DATE,
    grade grade NOT NULL,
    shape shape NOT NULL,
    width DECIMAL(8,2) NOT NULL,
    height DECIMAL(8,2) NOT NULL,
    thickness DECIMAL(6,2) NOT NULL,
    notes TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    organization_id TEXT REFERENCES organization(id)
);

CREATE TABLE offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bars_available INT NOT NULL,
    grade grade NOT NULL,
    shape shape NOT NULL,
    width DECIMAL(8,2) NOT NULL,
    height DECIMAL(8,2) NOT NULL,
    thickness DECIMAL(6,2) NOT NULL,
    bars_per_bundle INT NOT NULL,
    weight_per_meter DECIMAL(8,4) NOT NULL,
    price_per_meter DECIMAL(10,4) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    notes TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    organization_id TEXT REFERENCES organization(id)
);

CREATE TABLE "order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status order_status NOT NULL DEFAULT 'MATCHED',
    inquiry_id UUID NOT NULL REFERENCES inquiry(id),
    margin DECIMAL(6,4) NOT NULL DEFAULT 0,
    notes TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    organization_id TEXT REFERENCES organization(id)
);

CREATE TABLE order_offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offer(id),
    UNIQUE (order_id, offer_id)
);
