## Context

The data layer is raw SQL over `@neondatabase/serverless`: `lib/db/db.ts` exports a `neon()` HTTP `sql` tagged template; the six route handlers build queries as strings and bridge camelCase↔snake_case by hand with `parseRow`/`parseRows`/`insertClause`/`setClause`. Row shapes are hand-written Zod in `lib/model/**`. The schema lives in three disconnected places — `scripts/db/schema.sql` (app tables), `@better-auth/cli migrate` (auth tables), and a hand-written replica in `test/helpers/db.ts`. Better Auth runs on its own `neon` WebSocket `Pool`.

`migrate-to-better-auth` (decision #1) explicitly deferred this: *"Drizzle-first with Better Auth's drizzle adapter (unified migrations) — deferred unless ORM adoption becomes a committed, separate initiative."* This change is that initiative. It is **behavior-preserving** — the 36 existing tests are the contract, and the freshly-reset preprod is the introspection source.

## Goals / Non-Goals

**Goals:**
- One Drizzle schema as the typed source of truth, reproducing the existing tables exactly.
- Row/input types inferred from the schema and shared client/server; delete the hand-mapping (`parseRow`/`parseRows`/`insertClause`/`setClause`) and the hand-written row Zod.
- Better Auth on the Drizzle adapter — one schema, one migration history.
- Preserve every API response shape and domain invariant; tests stay green throughout.

**Non-Goals:**
- Changing any table, column, API payload, or domain rule.
- Replacing Zustand or the store-shaped `{ inquiry: [...] }` payloads.
- Drizzle's relational-query API beyond what the handlers need; query performance tuning.

## Decisions

**1. Introspect for parity, not hand-authoring.** `drizzle-kit introspect` reverse-engineers the live (freshly-reset) database into `schema.ts` + a baseline migration, so parity is by construction. *Alternative:* hand-author + `drizzle-kit generate` then diff — more control, but risks silent drift from the real tables. *Gate:* `drizzle-kit generate` must report **no changes** against the live DB before this change is considered correct.

**2. One introspected schema, consumed by Better Auth's Drizzle adapter.** The introspect captures *all* tables — including the auth tables with `platformRole`/`kind` intact — into one schema that is both parity-exact and adapter-compatible (the adapter maps by table/column name). Phase 3 wires `database: drizzleAdapter(db, { provider: "pg", schema })` and `drizzle-kit` owns all migrations. This is the deferred alternative from `migrate-to-better-auth` #1, now committed. *Note (apply):* `@better-auth/cli generate --adapter drizzle` is not exposed by the installed CLI and proved unnecessary — introspect-everything already produced the adapter-compatible auth schema.

**3. Keep the `neon-http` / `neon-serverless` driver split.** `neon-http` for stateless handler reads/writes (low latency, no WebSocket on Vercel); `neon-serverless` `Pool` for the order-creation transaction and Better Auth (interactive transactions). Both import the same `schema`. *Alternative:* unify on the `Pool` (one instance, full transactions everywhere) — rejected for the per-request WebSocket overhead on the read paths.

**4. Split `schema.ts` (client-safe) from `db.ts` (server-only).** `lib/db/schema.ts` holds the table declarations, `$inferSelect`/`$inferInsert`, and the `drizzle-zod` validators — importable by client components. `lib/db/db.ts` holds the driver instances and the connection string. This split is the mechanism that lets types cross the client/server boundary without leaking server code.

**5. Hand-written Zod + a compile-time drift guard** (revised during apply). `drizzle-zod` here would override ~8 of 11 fields (coercion, `text` ids, the date-only format, input-vs-response optionality) — reproducing the hand-written schemas with less readability and a forced insert/select split. So the clear `lib/model/**` Zod stays, and `lib/db/schema-drift.ts` adds a type-only assertion that each model's field set equals its table's `$inferSelect` (`user` is a curated subset). Adding/removing a column without updating the model fails `tsc` — verified against a deliberate mismatch. *Trade-off:* the field list lives in two places, but drift becomes a build error, so the anti-drift guarantee holds without the churn.

**6. `numeric` stays string + Zod coercion.** Drizzle (like the neon driver today) returns `DECIMAL` as `string`; the existing `z.coerce.number()` already absorbs this, so behavior is unchanged. *Alternative:* a number-mode custom column type — deferred; a typing change with no functional benefit now.

**7. Explicit column names, no global casing.** Introspect emits explicit `snake_case` names for app columns and keeps Better Auth's quoted camelCase (`"organizationId"`, `"createdAt"`); a global `casing: "snake_case"` would wrongly rewrite the auth columns. Mixed casing handled per-column, exactly as the DB has it.

**8. Test harness on `drizzle-orm/pglite`.** The harness pushes the real `schema.ts` into in-process PGlite, replacing its hand-written `user`/`organization`/`member` tables — so prod and tests share one schema definition.

## Risks / Trade-offs

- **Generated auth schema diverges from the live tables** → use `@better-auth/cli generate` for auth tables, introspect for app tables, and require the parity gate (no `drizzle-kit generate` diff, plus a `pg_dump --schema-only` diff against a scratch push) before merging.
- **`drizzle-zod` refinement misses a validation rule** → port each `lib/model` refinement explicitly; the behavioral tests (including the 400-on-bad-input cases) gate it.
- **`numeric`-as-string surprises a consumer** → unchanged from today (neon already returns strings); coercion stays in the validators.
- **`neon-http` cannot run the interactive order transaction** → order creation uses the `Pool`-backed instance; everything else stays on http.
- **The schema split leaks server code to the client** → `schema.ts` imports only `drizzle-orm` + `drizzle-zod`; a lint/CI guard ensures it never imports `db.ts` or the connection string.

## Migration Plan

Phased; each step independently shippable and revertible; the app stays green throughout.

- **Phase 1 — Scaffold + parity gate:** add `drizzle-orm`/`drizzle-kit`/`drizzle-zod` + `drizzle.config.ts`; `@better-auth/cli generate --adapter drizzle` + introspect app tables → `schema.ts`; prove `drizzle-kit generate` reports no diff.
- **Phase 2 — Dual-run client:** add `lib/db/db.ts` (the two Drizzle instances) alongside the existing `sql`; nothing uses it yet.
- **Phase 3 — Flip Better Auth** to `drizzleAdapter`; validate sign-in + organization flows.
- **Phase 4 — Migrate handlers** one resource at a time (inquiries → offers → orders), deleting `parseRow`/clause helpers as each clears; tests green per step.
- **Phase 5 — Types:** generate `drizzle-zod` validators; repoint `lib/model/**` and the client imports.
- **Phase 6 — Retire** the old `sql` client, `db:auth-migrate`, and `db:bootstrap`; move the harness to `drizzle-orm/pglite`.

Rollback: Phases 1–2 are purely additive. From Phase 3 on, each phase is a small revertible commit, and the raw-SQL path stays live until Phase 6 removes it.

## Open Questions

- ~~Does `@better-auth/cli generate` emit the additionalFields exactly?~~ **Resolved (Phase 1):** the introspect captured `platformRole`/`kind` directly — no generate step needed.
- Keep `numeric` as string + coerce (default), or introduce a number-mode column type as a follow-up? (Defaulting to string + coerce — no behavior change.)
