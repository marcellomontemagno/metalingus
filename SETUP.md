# Database setup

The whole schema — Better Auth's tables (`user`, `session`, `account`, `verification`,
`organization`, `member`, `invitation`) and the app's (`inquiry`, `offer`, `order`, `order_offer`
+ enums) — is defined once in **`lib/db/schema.ts`** (Drizzle) and applied via **`drizzle-kit`**
migrations under `drizzle/`. There is no separate Better Auth CLI migrate or `schema.sql`.

## Fastest path

```bash
pnpm db:setup     # drizzle-kit migrate -> sample data -> Businesses
```

Individual commands:

| Command | Does |
|---|---|
| `pnpm db:migrate` | Apply the Drizzle migrations (creates every table) |
| `pnpm db:generate` | Generate a new migration after editing `lib/db/schema.ts` |
| `pnpm db:seed` | Load sample inquiries/offers (skips if data already exists) |
| `pnpm db:seed-orgs` | Provision a Business per seeded user and link their entities |
| `pnpm db:setup` | `db:migrate` → `db:seed` → `db:seed-orgs` |
| `pnpm db:reset` | **Destructive** — wipe the whole schema, then re-run `db:setup` |

> ⚠️ `db:reset` drops everything, **including every user** — recreate your operator (below) afterwards.

`drizzle.config.ts` loads `POSTGRES_URL` from `.env.local`; for another database, set it inline
(e.g. `POSTGRES_URL=… pnpm db:migrate`).

## Create your sign-in operator

Sign-in is invite-only, and the seeded sample users can't receive email. Make yourself a
**platform operator** (the broker — sees everything and can provision Businesses):

```bash
bun scripts/mint-operator-invite.mjs you@example.com
```

This allowlists the user, sets `platformRole = 'operator'`, and prints a one-click magic-link
sign-in URL (point its host at wherever the app runs). From the **Operator** panel you can then
provision Businesses and other operators. (`provisionOperator` / `provisionBusiness` in
`lib/provisioning.ts` back the panel and the `provision-business` CLI.)
