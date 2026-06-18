CREATE TYPE shape AS ENUM (
    'SQUARE',
    'RECTANGULAR',
    'ROUND'
);

CREATE TYPE grade AS ENUM (
    'S235JR',
    'DX51'
);

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
    user_id UUID REFERENCES "user"(id)
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
    user_id UUID REFERENCES "user"(id)
);

CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    email_verified TIMESTAMPTZ,
    image TEXT
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

CREATE TABLE role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

INSERT INTO role (name) VALUES ('buyer'), ('seller');

CREATE TABLE user_role (
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TYPE order_status AS ENUM (
    'MATCHED',
    'APPROVED',
    'PAID',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED'
);

-- "order" is a reserved word; always quote it.
CREATE TABLE "order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status order_status NOT NULL DEFAULT 'MATCHED',
    inquiry_id UUID NOT NULL REFERENCES inquiry(id),
    notes TEXT,
    user_id UUID REFERENCES "user"(id)   -- the broker who created the order
);

CREATE TABLE order_offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offer(id),
    UNIQUE (order_id, offer_id)
);

INSERT INTO role (name) VALUES ('broker');

### Manual User Setup
Since public signup is disabled, create a user manually and grant them both
roles (`buyer` and `seller`) in one go. Change the email in the single place
marked below, then run the whole block:

```sql
WITH new_user AS (
    INSERT INTO "user" (email)
    VALUES ('user@example.com')
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
)
INSERT INTO user_role (user_id, role_id)
SELECT new_user.id, role.id
FROM new_user, role
ON CONFLICT (user_id, role_id) DO NOTHING;
```

The block above grants the user every role, including `broker`.

### Seed a test order

Order creation is not yet exposed in the UI (it lands in the transactional-write
iteration), so seed one manually to exercise the read-only orders screen. This links the
first inquiry to the two cheapest offers:

```sql
WITH new_order AS (
    INSERT INTO "order" (status, inquiry_id, user_id)
    SELECT 'MATCHED', i.id, u.id
    FROM inquiry i
    CROSS JOIN (SELECT id FROM "user" WHERE email = 'user@example.com') u
    ORDER BY i.id
    LIMIT 1
    RETURNING id
)
INSERT INTO order_offer (order_id, offer_id)
SELECT new_order.id, o.id
FROM new_order, (SELECT id FROM offer ORDER BY price_per_meter LIMIT 2) o
ON CONFLICT (order_id, offer_id) DO NOTHING;
```