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

- [x] 3.1 Added the `organization` plugin (server) + Resend `sendInvitationEmail`; ran migrate — **organization/member/invitation tables + `session.activeOrganizationId`** (client plugin lands with the switcher UI, 3.4)
- [ ] 3.2 Provision a Business per existing user and set the creator as `owner` (backfill)
- [ ] 3.3 Wire invitations via Resend (`sendInvitationEmail`) and the accept-invitation onboarding flow
- [ ] 3.4 Active-organization selection + org switcher UI; surface the active org in `getAuthContext`
- [ ] 3.5 Member management (invite / remove / change role) for `owner`/`admin`

## 4. Phase 3 — Re-home the domain

- [ ] 4.1 Add `organization_id` (+ `created_by`) to `inquiry`/`offer`/`order`; backfill from each owner's Business
- [ ] 4.2 Add `kind` (buyer/seller/both) to `organization`; backfill from former roles
- [ ] 4.3 Model `broker` as a platform role per the Phase 0 decision
- [ ] 4.4 Switch route-handler visibility/ownership from `user_id` to `organization_id`; gate writes by business type + member role; keep broker-sees-all and margin privacy
- [ ] 4.5 Evolve the `getAuthContext` / `useAuthContext` shape to `{ user, organization, member role, platform role }`
- [ ] 4.6 Reconcile the `inquiries`/`offers`/`orders` spec visibility scenarios to org-scoped; update tests
- [ ] 4.7 Drop `role` and `user_role`

## 5. Verification

- [ ] 5.1 Tests cover invite→accept onboarding, org-scoped visibility, business-type gating, member-role gating, broker platform actions, and preserved margin privacy / order immutability
- [ ] 5.2 Validate the data migration and the session cutover on a staging copy before production
