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

---

### Manual User Invitation
To allow a new user to sign in (since public signup is disabled), run:
```sql
INSERT INTO "user" (email) VALUES ('user@example.com');
```