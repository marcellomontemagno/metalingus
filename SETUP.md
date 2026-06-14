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