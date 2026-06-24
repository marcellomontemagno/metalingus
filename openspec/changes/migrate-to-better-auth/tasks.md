## 1. Phase 0 — Spike & decisions

- [x] 1.1 Spike Better Auth on the `@neondatabase/serverless` `Pool` — **confirmed: `Pool` + `ws` (`neonConfig.webSocketConstructor`) connects to `neondb`**
- [ ] 1.2 Finalize the org `kind` (buyer/seller/both) field shape — broker's home is decided (Better Auth admin plugin)
- [ ] 1.3 Greenfield: rebuild the schema and re-seed sample data on Better Auth (no backfill); confirm a clean cutover

## 2. Phase 1 — Provider swap (like-for-like)

- [x] 2.1 Add `better-auth`; configure `lib/auth.ts` (magicLink via Resend, DB sessions, secret/url) — **constructs, typechecks, magic-link endpoint present** (admin plugin deferred to Phase 3 per decision #2)
- [ ] 2.2 Mount the Better Auth route handler; remove the next-auth `[...nextauth]` mount — **handler staged at `/api/better-auth`; moves to `/api/auth` + next-auth removed at the swap**
- [ ] 2.3 Run `@better-auth/cli migrate`; fold the Better Auth tables into the schema source
- [ ] 2.4 Re-implement `getAuthContext()` on Better Auth, preserving the existing `{ user, roles }` contract (temporary role mapping)
- [ ] 2.5 Update `middleware.ts` to the Better Auth session/cookie check (401 for `/api`, redirect for pages)
- [ ] 2.6 Port sign-in (magic link), sign-out, and `AppShell` flows
- [ ] 2.7 Enforce invite-only: disable open sign-up, reject unknown emails
- [ ] 2.8 Update the test harness to mock the Better Auth seam; keep the pglite suite green
- [ ] 2.9 Remove `next-auth` and `lib/auth-adapter.ts`

## 3. Phase 2 — Organizations

- [ ] 3.1 Add the `organization` plugin (server + client); run CLI migrate
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
