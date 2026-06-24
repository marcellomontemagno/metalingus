# metalingus

A broker-mediated B2B marketplace for steel bars. Buyers post **inquiries** (what they need),
sellers post **offers** (what they have in stock), and brokers create **orders** that match an
inquiry to one or more offers with a margin. The broker's margin is never shown to buyers or sellers.

**Stack:** Next.js 16 (App Router) · React 19 · Better Auth (Resend magic-link, invite-only) ·
Neon serverless Postgres (no ORM, hand-rolled SQL) · Zustand · Zod · Tailwind v4 / shadcn.

Specs and change proposals live in [`openspec/`](./openspec) — `openspec/specs` for current
behavior, `openspec/changes` for proposed work.

## Local development

### Prerequisites

- **Node.js** and **pnpm**
- **Bun** — only needed to run the test suite ([install](https://bun.sh))
- A **Neon Postgres** database (the free tier is fine). `@neondatabase/serverless` connects over
  HTTP, so `POSTGRES_URL` must point at a Neon endpoint — a plain `postgres://localhost` will not
  work with this driver. Use a Neon cloud branch (simplest) or the Neon Local proxy.
- A **Resend** account and API key, for magic-link sign-in emails.

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local` (see `.env.example` for what each does):

- `AUTH_SECRET` — any random 32+ byte string: `openssl rand -base64 33` (or `node -e "console.log(crypto.randomBytes(33).toString('base64'))"`). Better Auth reads `BETTER_AUTH_SECRET` and falls back to this.
- `POSTGRES_URL` — your Neon connection string
- `AUTH_RESEND_KEY` — your Resend API key
- `AUTH_EMAIL_FROM` — *(optional)* magic-link sender; the template defaults it to `onboarding@resend.dev` for local dev. Falls back to `auth@keepalink.com` when unset.

### 3. Set up the database

```bash
pnpm db:setup     # Better Auth migrate, then app tables + sample data
```

This runs the Better Auth schema migration (`user`/`session`/`account`/`verification`), then
`scripts/db/schema.sql` (app tables) and `scripts/db/seed.sql` (sample inquiries/offers) against
`POSTGRES_URL`. Run the parts individually with `pnpm db:auth-migrate`, `pnpm db:bootstrap`,
`pnpm db:seed`; or `pnpm db:reset` to wipe and rebuild (destructive). See [`SETUP.md`](./SETUP.md).

### 4. Create your sign-in user

Sign-in is **invite-only**, and the seeded sample users can't log in. Add yourself a user with the
**Create your sign-in user** block in [`SETUP.md`](./SETUP.md) (change the email first) — it grants
all three roles, so you'll see everything.

### 5. Run

```bash
pnpm dev
```

Open <http://localhost:3000> and sign in at `/auth/signin` with the email you inserted. The magic
link is delivered via Resend.

> **Heads-up:** magic-link emails are sent from `AUTH_EMAIL_FROM` — the `.env.example` defaults it to
> `onboarding@resend.dev`, Resend's no-setup test sender, which needs no domain verification but only
> delivers to your own Resend account email. The fallback `auth@keepalink.com` must be a domain
> verified in your Resend account.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the Bun test suite |

## Testing

Tests run on [Bun](https://bun.sh)'s test runner against the **real API route handlers**, with
[pglite](https://pglite.dev) providing an in-process Postgres — no database or network needed.

```bash
pnpm test                       # whole suite
bun test test/orders.test.ts    # a single file
```

The harness in `test/` swaps the Neon `sql` for a pglite-backed adapter and mocks the auth
session, so each test drives an actual route handler end-to-end. Coverage tracks the capabilities
specified in `openspec/specs/`: authentication, access-control, inquiries, offers, and orders.
