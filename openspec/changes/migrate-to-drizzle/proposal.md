## Why

The data layer is hand-rolled raw SQL over `@neondatabase/serverless`: `insertClause`/`setClause`/`parseRow` bridge camelCase↔snake_case by hand, row shapes are hand-written Zod that can silently drift from the actual columns, and the schema lives in three disconnected places — `scripts/db/schema.sql`, the Better Auth CLI migrate, and the test harness's hand-written tables. Adopting Drizzle makes the schema a single typed source of truth that generates the SQL, the row/insert types, and the Zod validators — removing the hand-mapping and the drift while keeping the exact same database. (This deliberately reverses the `migrate-to-better-auth` non-goal "adopting Drizzle … the raw-SQL data layer stays," now that the auth migration has landed.)

## What Changes

- Adopt **Drizzle ORM** as the data-access layer over Neon, keeping the existing driver split: `neon-http` for stateless handler reads/writes, `neon-serverless` (WebSocket `Pool`) for the order-creation transaction and Better Auth.
- Define the **whole schema once** in Drizzle (`lib/db/schema.ts`) — app tables (`inquiry`/`offer`/`order`/`order_offer` + the `grade`/`shape`/`order_status` enums) and Better Auth tables (`user`/`session`/`account`/`verification`/`organization`/`member`/`invitation` with the `platformRole`/`kind` additionalFields) — built by **introspecting the live schema** so it reproduces today's tables exactly.
- Wire **Better Auth to the Drizzle adapter** (`drizzleAdapter(db, { provider: "pg" })`) so all tables share one schema and one migration history; retire `@better-auth/cli migrate` + `db:bootstrap` in favor of `drizzle-kit`.
- **Share types across client and server** by splitting `lib/db/schema.ts` (declarations + `$inferSelect`/`$inferInsert` + `drizzle-zod` validators — client-importable) from `lib/db/db.ts` (the driver — server-only). `drizzle-zod` generates the input schemas (refined to keep the existing coercion/positive rules), replacing the hand-written `lib/model/**` Zod.
- **Delete the hand-mapping**: `parseRow`/`parseRows`/`insertClause`/`setClause` are removed — Drizzle does camel↔snake.
- Port all six entity route handlers from raw SQL to the Drizzle query builder, preserving every response shape and access rule (operator-sees-all, org-scoped visibility, the buyer marked-up-price join, `sanitizeOrder` margin privacy).
- Move the **test harness** onto `drizzle-orm/pglite` driven by the same schema, replacing its hand-written `user`/`organization`/`member` tables.
- **Non-breaking by design**: the database schema, the API response shapes, and every domain invariant are unchanged — this is an internal data-layer swap, not a behavior change.

## Capabilities

### New Capabilities
- `data-layer`: the Drizzle persistence contract — one Drizzle schema as the single typed source of truth that reproduces the existing tables exactly; row and input types inferred from that schema and shared between client and server; Better Auth backed by the same schema via its Drizzle adapter; and all domain invariants (margin privacy, order immutability, ownership/visibility scoping, status lock) preserved through the migration.

### Modified Capabilities
<!-- None. This is a behavior-preserving refactor: no spec-level requirement changes to authentication, access-control, or organizations. The existing 36 tests are the behavioral contract and must stay green. -->

## Impact

- **Code**: new `lib/db/schema.ts` (+ generated `auth-schema.ts`), `lib/db/db.ts` (the two Drizzle instances), `drizzle.config.ts`; the six handlers (`app/api/{inquiries,offers,orders}/{route,[id]/route}.ts`) rewritten on the query builder; `lib/auth.ts` switches `database:` to `drizzleAdapter`; `lib/db/parseRow*`/`insertClause`/`setClause` and the hand-written `lib/model/**` Zod removed or derived.
- **Database**: no schema change — the Drizzle schema is introspected to match the current tables; migration history moves to `drizzle-kit`, parity-gated against the live DB.
- **Dependencies**: add `drizzle-orm`, `drizzle-kit`, `drizzle-zod`; reuse `@neondatabase/serverless`; the test harness uses `drizzle-orm/pglite` over the existing `@electric-sql/pglite`.
- **Tooling**: `drizzle-kit generate`/`migrate` replace `db:auth-migrate` + `db:bootstrap`; `db:reset`/`db:seed`/`db:seed-orgs` retained.
- **Tests**: the harness is re-pointed at `drizzle-orm/pglite` with the real schema (single source); the 36 existing tests stay green as the parity/behavior gate.
- **Non-goals**: changing any table, column, API response, or domain rule; replacing Zustand or the store-shaped payloads; adopting Drizzle's relational-query API beyond what the handlers need; touching the matching/pricing domain.
