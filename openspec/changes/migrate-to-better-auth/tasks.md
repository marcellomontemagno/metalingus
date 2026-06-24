## 1. Phase 0 — Spike & decisions

- [x] 1.1 Spike Better Auth on the `@neondatabase/serverless` `Pool` — **confirmed: `Pool` + `ws` (`neonConfig.webSocketConstructor`) connects to `neondb`**
- [ ] 1.2 Finalize the org `kind` (buyer/seller/both) field shape — broker's home is decided (Better Auth admin plugin)
- [x] 1.3 Greenfield: wiped schema, ran Better Auth migrate, reconciled app tables (`user_id` → text FK) + re-seeded — **10 tables, 3 users, sample data, dev operator `g@esposi.to` (all roles)**

## 2. Phase 1 — Provider swap (like-for-like)

- [x] 2.1 Add `better-auth`; configure `lib/auth.ts` (magicLink via Resend, DB sessions, secret/url) — **constructs, typechecks, magic-link endpoint present** (admin plugin deferred to Phase 3 per decision #2)
- [x] 2.2 Better Auth handler at `/api/auth/[...all]`; next-auth `[...nextauth]` mount removed
- [x] 2.3 Ran `@better-auth/cli migrate` (user/session/account/verification); app `schema.sql` now creates only app tables + FKs to Better Auth's text `user(id)`
- [x] 2.4 Re-implemented `getAuthContext()` on Better Auth (`auth.api.getSession`), preserving the `{ user, roles }` contract via the temporary role mapping
- [x] 2.5 `middleware.ts` uses `getSessionCookie` (401 for `/api`, redirect for pages)
- [x] 2.6 Ported sign-in (magic link), sign-out, `AppShell`, and the home page to Better Auth
- [x] 2.7 Invite-only via `disableSignUp: true` (no auto-provisioning of unknown emails)
- [x] 2.8 Test harness mocks the Better Auth seam (`@/lib/auth` + `next/headers`); **28 tests pass**
- [x] 2.9 Removed `auth.ts`, `lib/auth-adapter.ts`, and uninstalled `next-auth`

## 3. Phase 2 — Organizations

- [x] 3.1 Added the `organization` plugin (server) + Resend `sendInvitationEmail`; ran migrate — **organization/member/invitation tables + `session.activeOrganizationId`** (client `organizationClient` deferred with the switcher, 3.4)
- [x] 3.2 Provisioned a Business per user via `auth.api.createOrganization` (owner membership) — `db:seed-orgs` (skips `broker` users, so operators get no Business); buyer@/seller@ each own a Business
- [ ] 3.3 **Parked on the `members-management` branch** — invitations + accept flow (Members-page invite, public `/accept-invite`, one-click magic links). This branch keeps the org plugin's invitation tables/API but ships no member UI
- [ ] 3.4 **Deferred** — shipped a read-only current-Business display in the sidebar (first membership) instead of the switcher. Still to build once multi-Business membership is real: `organizationClient`, `setActive` + dropdown, and reading the active org in `AppShell`/`getAuthContext`
- [ ] 3.5 **Parked on the `members-management` branch** — member management (invite / remove / change role) on the Members page
- [x] 3.6 Operator panel `/operator` (broker-gated): provision Businesses + operators with optional welcome email — `provisionBusiness`/`provisionOperator` + `provision-business` CLI; live Businesses/Operators lists

## 4. Phase 3 — Re-home the domain

- [x] 4.1 Added `organization_id` to `inquiry`/`offer`/`order` (nullable, additive); `seed-orgs` links each entity to its owner's Business. No backfill (greenfield reset); `created_by` folds into the Step-5 `user_id`→`created_by` rename
- [x] 4.2 Added `kind` (buyer/seller/both) to `organization` via the plugin's `additionalFields`; `seed-orgs` derives it from the user's roles. No backfill
- [x] 4.3 Modeled the platform role as a `platformRole` user field (`operator`), set by `provisionOperator` — lighter than the admin plugin (decision #2 revisited). Additive: the global `broker` role stays until Step 4/4.7
- [ ] 4.4 Switch route-handler visibility/ownership from `user_id` to `organization_id`; gate writes by business type + member role; keep broker-sees-all and margin privacy
- [ ] 4.5 Evolve the `getAuthContext` / `useAuthContext` shape to `{ user, organization, member role, platform role }`
- [ ] 4.6 Reconcile the `inquiries`/`offers`/`orders` spec visibility scenarios to org-scoped; update tests
- [ ] 4.7 Drop `role` and `user_role`

## 5. Verification

- [ ] 5.1 Tests cover invite→accept onboarding, org-scoped visibility, business-type gating, member-role gating, broker platform actions, and preserved margin privacy / order immutability
- [ ] 5.2 Validate the data migration and the session cutover on a staging copy before production
