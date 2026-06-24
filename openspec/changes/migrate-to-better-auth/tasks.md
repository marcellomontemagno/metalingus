## 1. Phase 0 — Spike & decisions

- [x] 1.1 Spike Better Auth on the `@neondatabase/serverless` `Pool` — **confirmed: `Pool` + `ws` (`neonConfig.webSocketConstructor`) connects to `neondb`**
- [x] 1.2 Org `kind` (buyer/seller/both) is an organization `additionalField`; broker's home is a lean `platformRole` user field — revised from the admin plugin and ratified (see design decision #2)
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

- [x] 3.1 Added the `organization` plugin (server) + ran migrate — **organization/member/invitation tables + `session.activeOrganizationId`** (client `organizationClient` deferred with the switcher, 3.4)
- [x] 3.2 Provisioned a Business per user via `auth.api.createOrganization` (owner membership) — `db:seed-orgs` (skips `broker` users, so operators get no Business); buyer@/seller@ each own a Business
- [x] 3.3 Invitations + accept flow: Members-page invite (`createInvitation`) + public `/accept-invite` (`acceptInvitation`; signed-out → sign-in → back). **Delivered as one-click magic links** (`signInMagicLink` → `callbackURL`), framed by the invitation's org + inviter; the org plugin's `sendInvitationEmail` was dropped in favor of this
- [ ] 3.4 **Deferred** — shipped a read-only current-Business display in the sidebar (first membership, alphabetical) instead of the switcher. Still to build once multi-Business membership is real: client `organizationClient`, `setActive` + switcher dropdown, and reading the **active** org (not first-alphabetical) in `AppShell`/Members/`getAuthContext`
- [x] 3.5 Member management (invite / remove / change role) for `owner`/`admin` on the Members page; Better Auth enforces the last-owner rule. **Members nav is currently hidden** pending the decision to expose it
- [x] 3.6 (added) Operator panel `/operator` (broker-gated): provision Businesses + operators with an optional one-click welcome magic link — `provisionBusiness`/`provisionOperator` + `provision-business` CLI; live Businesses/Operators lists

## 4. Phase 3 — Re-home the domain

- [x] 4.1 Added `organization_id` to `inquiry`/`offer`/`order` (nullable, additive); `seed-orgs` links each entity to its owner's Business. No backfill (greenfield reset); `created_by` folds into the Step-5 `user_id`→`created_by` rename
- [x] 4.2 Added `kind` (buyer/seller/both) to `organization` via the plugin's `additionalFields`; `seed-orgs` derives it from the user's roles. No backfill
- [x] 4.3 Modeled the platform role as a `platformRole` user field (`operator`), set by `provisionOperator` — lighter than the admin plugin (decision #2 revisited). Additive: the global `broker` role stays until Step 4/4.7
- [x] 4.4 All 6 handlers org-scoped via `access(ctx)`: visibility by `organization_id`, writes gated by `kind`, orders operator-only; broker-sees-all + margin privacy preserved; ownership stamped server-side. Harness reworked (roles→org/platformRole); tsc 0, 28 tests pass
- [x] 4.5 `getAuthContext` returns `{ user, organization, platformRole }`; client `useAuthContext` carries the derived `access()` booleans (`isOperator/isBuyer/isSeller`) seeded via `SetAuthContext`. Layouts/AppShell/components all read these
- [x] 4.6 Spec visibility scenarios are org-scoped (authored for this change); tests updated — harness maps roles→org/platformRole, ownership test reframed. 28 pass. (Member-role-gating scenarios await multi-member, parked on `members-management`)
- [x] 4.7 Dropped `role`/`user_role` (schema, seed, harness, `getAuthContext`) **and** the member-role gate (`canManage`/`memberRole`) per the lean-branch decision — any member of a Business may act; member roles return with `members-management`. `provisionBusiness` now sets `kind` directly (panel gap fixed); `seed-orgs` keys `kind` off an explicit map, excludes operators via `platformRole`. Greenfield `db:reset` verified; tsc 0, 28 tests pass

## 5. Verification

- [x] 5.1 Tests (36) cover org-scoped visibility + isolation + `organization_id` stamping + cross-org rejection, business-type gating, operator platform actions, margin privacy, order immutability, `getAuthContext` shape (org / operator / none), provisioning (`kind` + `platformRole`, idempotent), and the both-org sell-first rule. Invite→accept onboarding + member-role gating live on `members-management`
- [ ] 5.2 Validate the data migration and the session cutover on a staging copy before production
