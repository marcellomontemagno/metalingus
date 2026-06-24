## Context

Auth today is next-auth v5: magic-link via Resend, JWT sessions, a custom SQL adapter whose omitted `createUser` enforces invite-only, and `getAuthContext()` resolving `{ user, roles }` from the session email plus `user_role`. Roles (`buyer`/`seller`/`broker`) are global and additive; inquiries/offers/orders are owned by `user_id`. Data access is raw SQL over the `neon()` HTTP driver, with a pglite test harness that mocks `@/auth` and `getAuthContext`.

The product needs **Businesses operated by multiple users** (shared resources, member roles, invitations). Better Auth's organization plugin provides members, invitations, teams, and org-scoped roles first-class. Auth funnels through two seams — server `getAuthContext()` (11 call sites) and client `useAuthContext()` — which makes the migration tractable if those contracts are preserved.

## Goals / Non-Goals

**Goals:**
- Replace next-auth with Better Auth, keeping magic-link/Resend and invite-only.
- Add Businesses (organizations): members, invitations, member roles, optional teams.
- Re-home roles: `buyer`/`seller` → Business type; `broker` → platform role; `owner`/`admin`/`member` → member roles.
- Move entity ownership user → organization; make visibility org-scoped (broker still sees all); preserve margin privacy and order-immutability.
- Preserve the `getAuthContext` / `useAuthContext` seams so the blast radius and test churn stay small.

**Non-Goals:**
- Adopting Drizzle or any ORM (the raw-SQL layer stays; Better Auth uses the neon Pool).
- Billing/plans; 2FA/passkeys (available later as Better Auth plugins).
- Changing the matching/pricing domain beyond scoping ownership to organizations.

## Decisions

**1. Better Auth first — not Drizzle first.** Better Auth runs directly on the `@neondatabase/serverless` `Pool` and manages its own tables; it needs no ORM. Drizzle-first would force rewriting every route handler's raw SQL and the test adapter — a large change orthogonal to the auth/org goal. *Alternative:* Drizzle-first with Better Auth's drizzle adapter (unified migrations) — deferred unless ORM adoption becomes a committed, separate initiative. *Trade-off:* schema management splits (Better Auth CLI for auth tables; `scripts/db/schema.sql` for app tables).

**2. `broker` is a platform role, not org-scoped.** The broker is the marketplace operator standing outside both buyer and seller Businesses. *Options:* (a) Better Auth `admin` plugin global role, (b) a `user.platformRole` field, (c) a dedicated "platform" organization. *Decision:* model at the user/platform level (admin plugin or a user field). (c) is uniform but forces brokers artificially into the org model. Final pick in Phase 0.

**3. `buyer`/`seller` is a Business *type*, not a member role.** Member roles (`owner`/`admin`/`member`) describe *who* in a business may act; the buyer/seller capability describes *what* the business does. Model type as an organization field (`kind: buyer | seller | both`), assigned at provisioning (platform-controlled, not self-serve).

**4. Database-backed sessions (Better Auth default), not JWT.** Enables server-side revocation and an active-organization claim; middleware uses the cookie cache (`compact`) for optimistic redirects. *Trade-off:* a `session` table and DB lookups, mitigated by the cookie cache.

**5. Neon serverless `Pool` for Better Auth.** The app keeps `neon()` HTTP for its own queries; Better Auth uses the WebSocket `Pool` from the *same* package — no new DB dependency. To be confirmed in the Phase 0 spike; fallback is a Kysely neon dialect.

**6. Preserve the `getAuthContext` seam.** Evolve its return to `{ user, organization, member: { role }, platformRole }`; route handlers adapt their checks but the import/seam holds. `useAuthContext` evolves the same shape, still seeded server-side via `SetAuthContext`. Tests keep mocking the seam, so the pglite suite barely changes.

**7. Entity ownership: `organization_id` + `created_by`.** Visibility filters change from `user_id` to `organization_id`; the broker bypass is unchanged; order creation stays broker-only.

## Risks / Trade-offs

- **Data migration** (next-auth `user`/`account`/`verification_token` → Better Auth schema) → one-time backfill: map users, create a Business per existing user (type from former roles), set creator as `owner`, backfill entity `organization_id`, flag brokers at the platform level.
- **Neon WebSocket `Pool` under Better Auth in the serverless runtime** → de-risk with the Phase 0 spike; fallback to a Kysely neon dialect.
- **JWT → DB session cutover logs everyone out** → one-time re-auth via a fresh magic link; communicate before cutover.
- **Invite-only with magic link could auto-provision unknown emails** → disable open sign-up; gate account creation behind invitation acceptance (confirm exact Better Auth option/hook in Phase 0).
- **Spec drift**: `inquiries`/`offers`/`orders` specs still describe per-user visibility → reconcile their scenarios to org-scoped in Phase 3 (or a follow-up change).
- **Schema fragmentation** (Better Auth CLI vs `scripts/db/schema.sql`) → accept and document; revisit if Drizzle is adopted.

## Migration Plan

Phased, each shippable; next-auth stays removable until Phase 1 is validated in staging.

- **Phase 0 — Spike & decide**: confirm Better Auth on the neon `Pool`; finalize broker's home and the org-type field; dry-run the data migration.
- **Phase 1 — Provider swap (like-for-like)**: Better Auth + `magicLink`/Resend, DB sessions, middleware, invite-only; re-implement `getAuthContext()` keeping the existing `{ user, roles }` shape via a temporary role mapping so the app is otherwise unchanged. Existing tests stay green. Cutover invalidates sessions (re-login).
- **Phase 2 — Organizations**: organization plugin, members, invitations (Resend), member roles, active-org switcher; provision a Business per existing user (backfill).
- **Phase 3 — Re-home the domain**: add `organization_id`/`created_by` and backfill; org-type and platform-role; switch handler visibility/ownership to org-scoped; evolve the `getAuthContext`/`useAuthContext` shape; reconcile entity specs + tests; drop `role`/`user_role`.

Rollback: Phase 1 is the riskiest (provider swap) — keep next-auth removable until validated. Phases 2–3 are additive + backfill; keep `organization_id` nullable until cutover so they're reversible.

## Open Questions

- broker's home: `admin` plugin vs `user.platformRole` field vs a platform org — decide in Phase 0.
- Can a Business be both buyer and seller, and can one user operate multiple Businesses? (Assumed yes; confirm with product.)
- Do `inquiries`/`offers`/`orders` specs get their visibility modified in this change or a follow-up?
- Teams: build now or defer? (Spec carries a light requirement; implementation may defer.)
- Exact Better Auth mechanism for "no auto-provision on magic-link" (`disableSignUp` vs a before-hook).
