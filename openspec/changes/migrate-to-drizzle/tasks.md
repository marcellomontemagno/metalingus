## 1. Phase 1 — Scaffold + parity gate

- [ ] 1.1 Add deps: `drizzle-orm`, `drizzle-zod`, and dev `drizzle-kit`; confirm `@neondatabase/serverless` + `@electric-sql/pglite` already present
- [ ] 1.2 Add `drizzle.config.ts` (`dialect: "postgresql"`, `schema: "./lib/db/schema.ts"`, `out: "./drizzle"`, `dbCredentials.url` from `POSTGRES_URL`)
- [ ] 1.3 Generate the auth schema: `npx @better-auth/cli generate --adapter drizzle --output lib/db/auth-schema.ts`; verify `user.platformRole` + `organization.kind` additionalFields are present (add by hand if the CLI omits them — Open Question)
- [ ] 1.4 Introspect the app tables from the freshly-reset preprod (`drizzle-kit introspect`); fold `inquiry`/`offer`/`order`/`order_offer` + the `grade`/`shape`/`order_status` `pgEnum`s into `lib/db/schema.ts`, re-exporting `auth-schema.ts`; explicit snake_case column names, no global casing
- [ ] 1.5 **Parity gate**: `drizzle-kit generate` reports no diff against the live DB; `drizzle-kit push` to a scratch Neon branch + `pg_dump --schema-only` diff is empty
- [ ] 1.6 Export `$inferSelect`/`$inferInsert` per table from `schema.ts`

## 2. Phase 2 — Drizzle client (dual-run, no behavior change)

- [ ] 2.1 Add `lib/db/db.ts`: `db` via `drizzle-orm/neon-http` (app reads/writes) and `txDb` via `drizzle-orm/neon-serverless` `Pool` (transactions + Better Auth), both over `schema`
- [ ] 2.2 Lint/CI guard: `lib/db/schema.ts` imports only `drizzle-orm`/`drizzle-zod` — never `db.ts` or the connection string (keeps it client-safe)
- [ ] 2.3 Smoke test: a trivial `db.select()` runs against dev; the existing `sql` path is untouched

## 3. Phase 3 — Better Auth on the Drizzle adapter

- [ ] 3.1 Switch `lib/auth.ts` `database:` to `drizzleAdapter(txDb, { provider: "pg", schema })`; keep magicLink + organization plugins + additionalFields
- [ ] 3.2 Validate sign-in (magic link), session, org provisioning, and operator flows against dev
- [ ] 3.3 Remove the standalone `Pool`/`neonConfig` wiring from `lib/auth.ts` (now via the adapter)

## 4. Phase 4 — Handlers onto the query builder

- [ ] 4.1 inquiries (`route.ts` + `[id]/route.ts`): SELECT / INSERT…RETURNING / UPDATE / DELETE via `db`, org-scoped `where`, operator-sees-all; drop this resource's `parseRow`/`insertClause`/`setClause` use
- [ ] 4.2 offers (`route.ts` + `[id]/route.ts`): same, including the buyer marked-up-price join (`price_per_meter * (1 + margin)`) and the both-org sell-first branch
- [ ] 4.3 orders (`route.ts` + `[id]/route.ts`): create transaction on `txDb` (`txDb.transaction`: insert order + order_offers); `sanitizeOrder` margin privacy preserved
- [ ] 4.4 Delete `lib/db/parseRow`/`parseRows`/`insertClause`/`setClause` once no handler imports them; `tsc` 0, tests green

## 5. Phase 5 — Types via drizzle-zod

- [ ] 5.1 Generate input validators with `createInsertSchema(table, { … })`, porting every `lib/model/**` refinement (`coerce`, `positive`, enum, nullable/optional)
- [ ] 5.2 Repoint server validation + client form imports to the generated validators; remove the superseded hand-written `lib/model/**` Zod (retain enum value lists if still referenced)
- [ ] 5.3 Confirm a client component imports a validator without pulling in `db.ts` (the client/server share works)

## 6. Phase 6 — Retire the old layer + harness

- [ ] 6.1 Remove the old `neon()` `sql` export and any remaining raw-SQL usage
- [ ] 6.2 Replace `db:auth-migrate` + `db:bootstrap` with `drizzle-kit migrate`; update `db:setup`/`db:reset`; keep `db:seed`/`db:seed-orgs`
- [ ] 6.3 Move `test/helpers/db.ts` to `drizzle-orm/pglite` driven by `schema.ts` (drop the hand-written `user`/`organization`/`member` tables)
- [ ] 6.4 Update setup docs (README + `openspec/project.md`) for the Drizzle workflow

## 7. Verification

- [ ] 7.1 Parity: a fresh `drizzle-kit migrate` from empty reproduces the exact pre-migration schema (app + auth tables); `pg_dump --schema-only` diff empty
- [ ] 7.2 Behavior: all 36 tests green; manual smoke of sign-in, inquiries/offers/orders CRUD, operator views, and margin privacy
- [ ] 7.3 Type-sharing: client and server both consume schema-derived types/validators; no `parseRow`/`parseRows`/`insertClause`/`setClause` or hand-written row Zod remain
