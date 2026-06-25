## ADDED Requirements

### Requirement: Single Drizzle schema as the source of truth
The system SHALL define every database table — the application tables (`inquiry`, `offer`, `order`, `order_offer`, and the `grade`/`shape`/`order_status` enums) and the Better Auth tables (`user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`) — in one Drizzle schema module that is the single source of truth for the SQL schema, the inferred types, and the input validators.

#### Scenario: Schema reproduces the existing tables exactly
- **WHEN** the Drizzle schema is materialized into a fresh database
- **THEN** the resulting tables, columns, data types, enums, defaults, and foreign keys are identical to the pre-migration schema, verified by a parity check that reports no difference against the live database

#### Scenario: One migration history
- **WHEN** the schema changes
- **THEN** a single `drizzle-kit` migration history records the change for both application and Better Auth tables, with no separate `@better-auth/cli migrate` or `schema.sql` bootstrap step

### Requirement: Better Auth backed by the Drizzle schema
The system SHALL configure Better Auth through its Drizzle adapter over the shared schema, so the authentication and organization tables — including the `user.platformRole` and `organization.kind` additional fields — are managed by Drizzle.

#### Scenario: Auth tables managed by Drizzle
- **WHEN** database migrations run
- **THEN** the Better Auth tables and their additional fields are created and updated by `drizzle-kit`, and Better Auth reads and writes them through the Drizzle adapter rather than its own CLI

### Requirement: Inferred types shared between client and server
The system SHALL derive row and input types from the Drizzle schema and make them importable by both server and client code without duplicating column definitions or exposing server-only code.

#### Scenario: Client imports validators without server code
- **WHEN** a client component imports an entity's input validator or inferred type
- **THEN** it resolves from the schema module without pulling in the database driver, the connection string, or any other server-only code

#### Scenario: Validators cannot drift from the schema
- **WHEN** a column is added, changed, or removed in the Drizzle schema
- **THEN** the generated input validator and the inferred row/insert types reflect the change automatically, with no separately maintained row type to update

### Requirement: Behavior and invariants preserved
The data-layer migration SHALL preserve every existing API response shape and domain invariant; it introduces no spec-level behavior change.

#### Scenario: Margin privacy preserved
- **WHEN** a buyer or seller reads offers or orders through the migrated handlers
- **THEN** they receive only the marked-up price and never the raw seller price or the margin, identical to pre-migration behavior

#### Scenario: Existing behavioral tests stay green
- **WHEN** the full test suite runs against the Drizzle-backed handlers
- **THEN** every existing behavioral test passes unchanged — org-scoped visibility, operator-sees-all, order immutability, ownership, and status lock
