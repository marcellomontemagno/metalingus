# Database setup

Better Auth owns the `user`, `session`, `account`, and `verification` tables (created by its
migrate). The app's own tables and sample data live under `scripts/db/`:

- `scripts/db/schema.sql` — app tables (`role`, `user_role`, `inquiry`, `offer`, `order`,
  `order_offer`) and enum types, FK'd to Better Auth's text `user(id)`
- `scripts/db/seed.sql` — a sample buyer and seller with inquiries and offers

The `migrations/` files are legacy deltas from before the Better Auth migration; ignore them on a
fresh database.

## Fastest path

```bash
pnpm db:setup     # Better Auth migrate -> app schema -> sample data
```

Individual commands:

| Command | Does |
|---|---|
| `pnpm db:auth-migrate` | Create/refresh the Better Auth tables (`user`/`session`/`account`/`verification`) |
| `pnpm db:bootstrap` | Create the app tables (safe to re-run; existing objects are skipped) |
| `pnpm db:seed` | Load sample inquiries/offers (skips if data already exists) |
| `pnpm db:setup` | `db:auth-migrate` → `db:bootstrap` → `db:seed` |
| `pnpm db:reset` | **Destructive** — wipe the whole schema, then re-run `db:setup` |

> ⚠️ `db:reset` drops everything, **including every user** — recreate your sign-in user (below) afterwards.

## Manual path (no Node scripts)

Run `pnpm db:auth-migrate` for the Better Auth tables (it's a CLI, not plain SQL), then paste
`scripts/db/schema.sql` and `scripts/db/seed.sql` into the Neon SQL editor (or `psql`).

## Create your sign-in user

Sign-in is invite-only, and the seeded sample users can't receive email. Create yourself a user
(in Better Auth's `user` table) and grant all roles. Change the name/email, then run the block:

```sql
WITH new_user AS (
    INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, 'Your Name', 'user@example.com', true, now(), now())
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id
)
INSERT INTO user_role (user_id, role_id)
SELECT new_user.id, role.id
FROM new_user, role
ON CONFLICT (user_id, role_id) DO NOTHING;
```

This grants every role, including `broker`, so you see the full picture.
