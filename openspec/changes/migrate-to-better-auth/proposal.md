## Why

metalingus authenticates standalone users with hand-rolled global roles (`buyer`/`seller`/`broker` in `role`/`user_role`). The business needs **Businesses where several people operate together** — a company's staff sharing its inquiries, offers, and orders, with roles and email invitations. next-auth v5 has no organization model, so we would hand-build members, invitations, and org-scoped roles ourselves. Better Auth ships all of that in its organization plugin, so this change replaces the auth layer *and* unlocks the multi-user-business model.

## What Changes

- Replace **next-auth v5 with Better Auth**, preserving magic-link sign-in via Resend and invite-only access.
- Introduce **organizations ("Businesses")**: each Business has many members; members hold roles (`owner`/`admin`/`member`); email invitations onboard new members.
- Re-home the role model: `buyer`/`seller` become a **Business type** (what an org may do), `broker` becomes a **platform role** (not org-scoped), and member roles govern who within a Business may act.
- Move entity ownership from **user → organization**: inquiries/offers/orders belong to a Business and are visible to its members; the broker still sees everything.
- Re-implement `getAuthContext()` and the client `useAuthContext` seam on Better Auth (active org + member role + platform role) without changing their call-site contract.
- **BREAKING**: sessions move from JWT to Better Auth database-backed sessions; the auth schema changes (Better Auth tables replace `user`/`account`/`verification_token`; `role`/`user_role` are removed). Existing users require a one-time migration into a Business.

## Capabilities

### New Capabilities
- `organizations`: Businesses as multi-user organizations — membership, member roles, email invitations, optional teams, and the buyer/seller business type; ownership and visibility of inquiries/offers/orders scoped to the organization.

### Modified Capabilities
- `authentication`: the provider becomes Better Auth (magic-link via Resend retained); sessions become database-backed; invite-only is enforced by organization invitations plus no auto-provisioning of unknown emails.
- `access-control`: the single additive role list splits into Business type (org), member role (`owner`/`admin`/`member`), and platform role (`broker`); ownership and per-actor visibility become organization-scoped. Margin privacy and order-immutability invariants are unchanged.

## Impact

- **Code**: `auth.ts`, `lib/auth-adapter.ts`, `lib/auth/getAuthContext.ts`, `middleware.ts`, and the `/api/auth/[...nextauth]` mount become Better Auth; all six entity route handlers switch visibility from `user_id` to `organization_id`; the `SetAuthContext`/`useAuthContext` client seam and the sign-in/sign-out/`AppShell` flows update.
- **Database**: add Better Auth tables + `organization`/`member`/`invitation`/`team`; entity tables gain `organization_id` (and `created_by`); drop `role`/`user_role`; backfill existing users into a Business.
- **Dependencies**: add `better-auth`, remove `next-auth`; reuse `@neondatabase/serverless` (Pool variant) and Resend.
- **Tests**: the `getAuthContext` seam keeps the pglite suite largely intact (mock the seam, not the provider).
- **Non-goals**: adopting Drizzle or any ORM (the raw-SQL data layer stays — see design.md); billing/plans; 2FA/passkeys (available later as Better Auth plugins); changing the matching/pricing domain beyond org-scoping ownership.
