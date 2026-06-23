-- metalingus schema -- single source of truth for the database structure.
-- Run with: pnpm db:bootstrap  (or paste into the Neon SQL editor / psql).
-- The migrations/ files are historical deltas already folded in here.

CREATE TYPE shape AS ENUM ('SQUARE', 'RECTANGULAR', 'ROUND');

CREATE TYPE grade AS ENUM ('S235JR', 'DX51');

CREATE TYPE order_status AS ENUM ('MATCHED', 'APPROVED', 'PAID', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- "user" must exist before the tables that reference it.
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    email_verified TIMESTAMPTZ,
    image TEXT
);

CREATE TABLE role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

INSERT INTO role (name) VALUES ('buyer'), ('seller'), ('broker') ON CONFLICT (name) DO NOTHING;

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
    user_id UUID NOT NULL REFERENCES "user"(id)
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
    user_id UUID NOT NULL REFERENCES "user"(id)
);

CREATE TABLE verification_token (
    identifier TEXT,
    token TEXT,
    expires TIMESTAMPTZ,
    PRIMARY KEY (identifier, token)
);

CREATE TABLE account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "user"(id),
    type TEXT,
    provider TEXT,
    provider_account_id TEXT,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT
);

CREATE TABLE user_role (
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE "order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status order_status NOT NULL DEFAULT 'MATCHED',
    inquiry_id UUID NOT NULL REFERENCES inquiry(id),
    margin DECIMAL(6,4) NOT NULL DEFAULT 0,
    notes TEXT,
    user_id UUID NOT NULL REFERENCES "user"(id)
);

CREATE TABLE order_offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offer(id),
    UNIQUE (order_id, offer_id)
);
