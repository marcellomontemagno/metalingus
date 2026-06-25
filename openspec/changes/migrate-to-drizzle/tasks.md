## 1. Phase 1 — Scaffold + parity gate

- [x] 1.1 Add deps: `drizzle-orm`, `drizzle-zod`, and dev `drizzle-kit`; confirm `@neondatabase/serverless` + `@electric-sql/pglite` already present
- [x] 1.2 Add `drizzle.config.ts` (`dialect: "postgresql"`, `schema: "./lib/db/schema.ts"`, `out: "./drizzle"`, `dbCredentials.url` from `POSTGRES_URL`)
- [x] 1.3 Auth tables came from the introspect with `platformRole`/`kind` intact; `better-auth generate --adapter drizzle` is not exposed by the installed CLI and proved unnecessary (the introspected schema is adapter-compatible)
- [x] 1.4 Introspected all tables from the dev DB (`drizzle-kit introspect`) — `inquiry`/`offer`/`order`/`order_offer` + the 3 `pgEnum`s + the auth tables; promoted `drizzle/schema.ts`→`lib/db/schema.ts` (+ `relations.ts`); explicit snake_case app columns, bare camelCase auth columns, no global casing
- [x] 1.5 **Parity gate**: `drizzle-kit generate` reports "No schema changes"; baseline DDL matches `scripts/db/schema.sql` exactly (the airtight `pg_dump --schema-only` diff against a scratch push is task 7.1)
- [x] 1.6 Export `$inferSelect`/`$inferInsert` per table from `schema.ts`

## 2. Phase 2 — Drizzle client (dual-run, no behavior change)

- [x] 2.1 `lib/db/db.ts`: `db` via `drizzle-orm/neon-http` (app reads/writes) and `txDb` via `drizzle-orm/neon-serverless` `Pool` (transactions + Better Auth), both over `schema`; legacy `sql` kept for the dual-run
- [x] 2.2 Client-safe guard: `test/schema-client-safe.test.ts` asserts `schema.ts` imports no `./db`, `process.env`, or driver (keeps inferred types/zod client-importable)
- [x] 2.3 Smoke: `db.select()` over neon-http returned dev rows with camelCase inference (`barsRequested`); existing `sql` path untouched; 37 tests green

## 3. Phase 3 — Better Auth on the Drizzle adapter

- [x] 3.1 Switched `lib/auth.ts` `database:` to `drizzleAdapter(txDb, { provider: "pg", schema: dbSchema })`; magicLink + organization plugins + additionalFields unchanged
- [x] 3.2 Validated the adapter against dev: `createOrganization` wrote org+member through the adapter and Drizzle read them back (owner role correct), then cleaned up — same adapter path the magic-link sign-in/session use
- [x] 3.3 Removed the standalone `Pool`/`neonConfig`/`ws` wiring from `lib/auth.ts` (now via `txDb`)

## 4. Phase 4 — Handlers onto the query builder

- [x] 4.1 inquiries (`route.ts` + `[id]/route.ts`) on the query builder; reads coerce via the model schema, inserts stringify numerics (`numeric` stays string per Decision 6); org-scoped `where` + operator-sees-all preserved
- [x] 4.2 offers (`route.ts` + `[id]/route.ts`): the buyer marked-up-price join via `selectDistinct` + a raw `sql` price expression; the both-org sell-first branch preserved
- [x] 4.3 orders (`route.ts` + `[id]/route.ts`): create transaction on `txDb.transaction`; Map-union GET; the MATCHED-lock PATCH; `sanitizeOrder`/`sanitizeOrders` margin privacy preserved
- [x] 4.4 Also ported `getAuthContext` off `sql`+`parseRow`; deleted `parseRow`/`parseRows`/`insertClause`/`setClause`; `lib/db` is now just `db`/`schema`/`relations`; tsc 0, 37 tests green. (Harness gained a `drizzle-orm/pglite` `db` — task 6.3 partially pulled forward; `sql` stays for provisioning + scripts until Phase 6.1)

## 5. Phase 5 — Types via drizzle-zod

- [x] 5.1 Evaluated `drizzle-zod` — it would override ~8/11 fields (coercion / `text` ids / date / input-vs-response optionality), net-equal to the hand-written Zod; kept the readable `lib/model/**` Zod instead (**Decision 5 revised** — drift guard over generated validators)
- [x] 5.2 Added `lib/db/schema-drift.ts`: a type-only compile-time guard asserting each model's field set == its table's `$inferSelect` (`user` = curated subset); a column add/remove without a matching model edit fails `tsc` — verified it rejects a deliberate mismatch
- [x] 5.3 Client/server type-sharing already proven: the `schema.ts`/`db.ts` split + `test/schema-client-safe.test.ts` (Phase 2) keep types/validators client-importable without pulling in the driver

## 6. Phase 6 — Retire the old layer + harness

- [x] 6.1 Ported the last `sql` consumers (`lib/provisioning.ts`, operator panel, `AppShell`) to `db`; removed the `sql` export from `lib/db/db.ts`. The app is fully on Drizzle (the `scripts/db/*` keep their own `neon()` client); tsc 0, 37 tests green
- [x] 6.2 Swapped `db:auth-migrate` + `db:bootstrap` → `db:migrate` (`drizzle-kit migrate`) + `db:generate`; `db:setup` = migrate + seed + seed-orgs; `drizzle.config.ts` self-loads `.env.local` (inline override still wins); removed `bootstrap.mjs` + `schema.sql`; uncommented the baseline `0000` so it's apply-able to fresh DBs. tsc 0, 37 green — end-to-end `db:reset` on a live DB is the 7.1 verification
- [x] 6.3 Harness builds pglite from the (uncommented) Drizzle baseline migration, split per statement, instead of hand-written tables + `schema.sql` — single schema source. Surfaced + fixed a real fidelity gap: `organization`/`member` `createdAt` is `NOT NULL` no-default (better-auth sets it), which the hand-written tables had masked. 37 tests green
- [ ] 6.4 Update setup docs (README + `openspec/project.md`) for the Drizzle workflow

## 7. Verification

- [ ] 7.1 Parity: a fresh `drizzle-kit migrate` from empty reproduces the exact pre-migration schema (app + auth tables); `pg_dump --schema-only` diff empty
- [ ] 7.2 Behavior: all 36 tests green; manual smoke of sign-in, inquiries/offers/orders CRUD, operator views, and margin privacy
- [ ] 7.3 Type-sharing: client and server both consume schema-derived types/validators; no `parseRow`/`parseRows`/`insertClause`/`setClause` or hand-written row Zod remain
