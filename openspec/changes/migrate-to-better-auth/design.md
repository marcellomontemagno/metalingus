## Context

Auth today is next-auth v5: magic-link via Resend, JWT sessions, a custom SQL adapter whose omitted `createUser` enforces invite-only, and `getAuthContext()` resolving `{ user, roles }` from the session email plus `user_role`. Roles (`buyer`/`seller`/`broker`) are global and additive; inquiries/offers/orders are owned by `user_id`. Data access is raw SQL over the `neon()` HTTP driver, with a pglite test harness that mocks `@/auth` and `getAuthContext`.

The product needs **Businesses operated by multiple users** (shared resources, member roles, invitations). Better Auth's organization plugin provides members, invitations, teams, and org-scoped roles first-class. Auth funnels through two seams — server `getAuthContext()` (11 call sites) and client `useAuthContext()` — which makes the migration tractable if those contracts are preserved.

## Goals / Non-Goals

**Goals:**
- Replace next-auth with Better Auth, keeping magic-link/Resend and invite-only.
- Add Businesses (organizations): members, invitations, member roles, optional teams.
- Re-home roles: `buyer`/`seller` → Business type; `broker` → platform role; `owner`/`admin`/`member` → member roles.
- Move entity ownership user → organization; make visibility org-scoped (broker still sees all); preserve margin privacy and order-immutability.
- **Preserve as much of what's built as possible** — migrate the provider and the structure, not the app: keep the `getAuthContext`/`useAuthContext` and `sanitizeOrder` seams, the raw-SQL data layer, and the pglite test harness, so blast radius and test churn stay small.

**Non-Goals:**
- Adopting Drizzle or any ORM (the raw-SQL layer stays; Better Auth uses the neon Pool).
- Billing/plans; 2FA/passkeys (available later as Better Auth plugins).
- Changing the matching/pricing domain beyond scoping ownership to organizations.

## Decisions

**1. Better Auth first — not Drizzle first.** Better Auth runs directly on the `@neondatabase/serverless` `Pool` and manages its own tables; it needs no ORM. Drizzle-first would force rewriting every route handler's raw SQL and the test adapter — a large change orthogonal to the auth/org goal. *Alternative:* Drizzle-first with Better Auth's drizzle adapter (unified migrations) — deferred unless ORM adoption becomes a committed, separate initiative. *Trade-off:* schema management splits (Better Auth CLI for auth tables; `scripts/db/schema.sql` for app tables).

**2. `broker` is a platform role, modeled as a `platformRole` field on the user.** The broker is the marketplace operator standing outside both buyer and seller Businesses. *Decision (Phase-3 revision, ratified):* a lean `platformRole` user field (`operator`), read through the `access()` seam — chosen over the Better Auth `admin` plugin because the plugin's permission system would sit unused today (the three authorization dimensions are hand-rolled, and data-scoping/business-type are not member permissions) while its impersonate/ban/admin-API + tables are pure weight. Permission-driven field visibility (`order:viewMargin`, Future Directions) is enforced in the `sanitizeOrder` seam and can adopt Better Auth's access-control statements *then*, without the plugin now. *Rejected:* the admin plugin (unused machinery today); a dedicated "platform" organization (forces brokers artificially into a Business). Phase 1 keeps `broker` in the temporary role mapping.

**3. `buyer`/`seller` is a Business *type*, not a member role.** Member roles (`owner`/`admin`/`member`) describe *who* in a business may act; the buyer/seller capability describes *what* the business does. Model type as an organization field (`kind: buyer | seller | both`) — platform-set today (matching the current invite-only provisioning); self-serve at onboarding in the target model.

**4. Database-backed sessions (Better Auth default), not JWT.** Enables server-side revocation and an active-organization claim; middleware uses the cookie cache (`compact`) for optimistic redirects. *Trade-off:* a `session` table and DB lookups, mitigated by the cookie cache.

**5. Neon serverless `Pool` for Better Auth.** The app keeps `neon()` HTTP for its own queries; Better Auth uses the WebSocket `Pool` from the *same* package — no new DB dependency. To be confirmed in the Phase 0 spike; fallback is a Kysely neon dialect.

**6. Preserve the `getAuthContext` seam.** Evolve its return to `{ user, organization, member: { role }, platformRole }`; route handlers adapt their checks but the import/seam holds. `useAuthContext` evolves the same shape, still seeded server-side via `SetAuthContext`. Tests keep mocking the seam, so the pglite suite barely changes.

**7. Entity ownership: `organization_id` + `created_by`.** Visibility filters change from `user_id` to `organization_id`; the broker bypass is unchanged; order creation stays broker-only.

## Risks / Trade-offs

- **Data migration — none (greenfield).** No real users yet, so we rebuild the schema and re-seed sample data on Better Auth instead of backfilling, and the JWT→session cutover is a non-event. (The backfill path — users→Businesses, entities→org — is only needed once real users exist before a cutover.)
- **Neon WebSocket `Pool` under Better Auth in the serverless runtime** → de-risk with the Phase 0 spike; fallback to a Kysely neon dialect.
- **JWT → DB session cutover** → moot while greenfield (no live sessions); becomes a one-time re-auth via magic link once there are real users.
- **Invite-only with magic link could auto-provision unknown emails** → disable open sign-up; gate account creation behind invitation acceptance (confirm exact Better Auth option/hook in Phase 0).
- **Spec drift**: `inquiries`/`offers`/`orders` specs still describe per-user visibility → reconcile their scenarios to org-scoped in Phase 3 (or a follow-up change).
- **Schema fragmentation** (Better Auth CLI vs `scripts/db/schema.sql`) → accept and document; revisit if Drizzle is adopted.

## Migration Plan

**This pass covers Phase 1 only**; Phases 2–3 follow as later changes. Phased, each shippable; next-auth stays removable until Phase 1 is validated.

- **Phase 0 — Spike & decide**: confirm Better Auth on the neon `Pool`; rebuild the schema and re-seed sample data on Better Auth (broker = admin plugin and greenfield are already decided).
- **Phase 1 — Provider swap (like-for-like)**: Better Auth + `magicLink`/Resend, DB sessions, middleware, invite-only; re-implement `getAuthContext()` keeping the existing `{ user, roles }` shape via a temporary role mapping so the app is otherwise unchanged. Existing tests stay green; greenfield means no session cutover to manage.
- **Phase 2 — Organizations**: organization plugin, members, invitations (Resend), member roles, active-org switcher; provision Businesses fresh (greenfield). Teams deferred.
- **Phase 3 — Re-home the domain**: add `organization_id`/`created_by` and backfill; org-type and platform-role; switch handler visibility/ownership to org-scoped; evolve the `getAuthContext`/`useAuthContext` shape; reconcile entity specs + tests; drop `role`/`user_role`.

Rollback: Phase 1 is the riskiest (provider swap) — keep next-auth removable until validated. Phases 2–3 are additive + backfill; keep `organization_id` nullable until cutover so they're reversible.

## Open Questions

- Do `inquiries`/`offers`/`orders` specs get their visibility modified in this change or a follow-up?
- Exact Better Auth mechanism for "no auto-provision on magic-link" (`disableSignUp` vs a before-hook).

## Future Directions

The migration deliberately separates four concerns that are conflated today — **authentication** (Better Auth core), **membership** (org invitations), **authorization** (business type · member role · platform role), and **field redaction** (the `sanitizeOrder` seam). Keeping them apart makes one evolution cheap without building it now:

- **Permission-driven field visibility.** Margin privacy stays enforced in a single serialization seam (`sanitizeOrder` plus the audience-shaped offer query); only the *decision* moves — from a hardcoded `isBroker` to a capability check such as `ctx.can("order:viewMargin")`, resolved by `getAuthContext` against Better Auth's access-control statements. Margin visibility lives on the **platform-role** dimension (broker today; a future "auditor" role could be granted the same capability without touching the redaction code). Relationship/state-dependent rules (e.g. a seller seeing margin on its own delivered orders) exceed pure RBAC and would be expressed in the same seam as ABAC.

This stays cheap only because the migration *preserves rather than replaces*: field visibility remains behind the one sanitize seam, and `getAuthContext` remains the single authorization decision point — resolving capabilities, not just raw roles.
