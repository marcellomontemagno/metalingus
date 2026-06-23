# metalingus

A broker-mediated B2B marketplace for steel bars. Buyers post **inquiries** (what they need),
sellers post **offers** (what they have in stock), and brokers create **orders** that match an
inquiry to one or more offers with a margin. The broker's margin is never shown to buyers or sellers.

**Stack:** Next.js 16 (App Router) · React 19 · next-auth v5 (Resend magic-link, invite-only) ·
Neon serverless Postgres (no ORM, hand-rolled SQL) · Zustand · Zod · Tailwind v4 / shadcn.

Specs and change proposals live in [`openspec/`](./openspec) — `openspec/specs` for current
behavior, `openspec/changes` for proposed work.

## Local development

### Prerequisites

- **Node.js** and **pnpm**
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

- `AUTH_SECRET` — any random 32+ byte string: `openssl rand -base64 33` (or `node -e "console.log(crypto.randomBytes(33).toString('base64'))"`). Note: don't use `npx auth secret` — the `auth` package on npm is an unrelated CLI (Better Auth).
- `POSTGRES_URL` — your Neon connection string
- `AUTH_RESEND_KEY` — your Resend API key
- `AUTH_EMAIL_FROM` — *(optional)* magic-link sender; the template defaults it to `onboarding@resend.dev` for local dev. Falls back to `auth@keepalink.com` when unset.

### 3. Bootstrap the database

```bash
pnpm db:setup     # creates the schema, then loads sample inquiries/offers
```

This runs `scripts/db/schema.sql` and `scripts/db/seed.sql` against `POSTGRES_URL`. Also available:
`pnpm db:bootstrap` (schema only), `pnpm db:seed` (sample data only), `pnpm db:reset` (drop and
rebuild — destructive). No-Node alternative: paste those two files into the Neon SQL editor. See
[`SETUP.md`](./SETUP.md) for details.

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
