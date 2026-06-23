# Database setup

The schema and sample data live as SQL under `scripts/db/`:

- `scripts/db/schema.sql` — tables, enum types, and the role rows (single source of truth)
- `scripts/db/seed.sql` — a sample buyer and seller with inquiries and offers

The `migrations/` files are historical deltas already folded into `schema.sql`; don't replay
them on a fresh database.

## Fastest path

```bash
pnpm db:setup     # runs schema.sql, then seed.sql, against POSTGRES_URL
```

Individual commands:

| Command | Does |
|---|---|
| `pnpm db:bootstrap` | Create the schema (safe to re-run; existing objects are skipped) |
| `pnpm db:seed` | Load sample inquiries/offers (skips if data already exists) |
| `pnpm db:setup` | `db:bootstrap` then `db:seed` |
| `pnpm db:reset` | **Destructive** — drop everything, then bootstrap + seed |

> ⚠️ `db:reset` drops all tables, **including every user** — you'll need to recreate your
> sign-in user (below) afterwards.

## Manual path (no Node)

Paste `scripts/db/schema.sql`, then `scripts/db/seed.sql`, into the Neon SQL editor (or `psql`).

## Create your sign-in user

Sign-in is invite-only, and the seeded sample users can't log in. Create yourself a user and
grant all roles. Change the email, then run the whole block:

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

This grants every role, including `broker`, so you see the full picture.
