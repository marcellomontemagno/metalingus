// Bun preload: swap the Neon sql for the pglite adapter and Better Auth's session
// for the test-controlled one, before any route handler is imported. The real
// getAuthContext runs against pglite, so role resolution is exercised too.
import { mock } from "bun:test";
import { sql, db } from "./helpers/db";
import { getSession } from "./helpers/ctx";

// lib/auth constructs neon() at import; never loaded here, but keep env sane.
process.env.POSTGRES_URL ||= "postgresql://test:test@localhost:5432/test";

mock.module("@/lib/db/db", () => ({ sql, db, txDb: db }));
// getAuthContext resolves identity via @/lib/auth's getSession + next/headers.
// createOrganization is a minimal stand-in for Better Auth's: it writes the org +
// owner membership to pglite so provisionBusiness is exercisable in-harness.
mock.module("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => getSession(),
      createOrganization: async ({
        body,
      }: {
        body: { name: string; slug: string; userId: string };
      }) => {
        const id = crypto.randomUUID();
        await sql`INSERT INTO organization (id, name, slug) VALUES (${id}, ${body.name}, ${body.slug})`;
        await sql`INSERT INTO member (id, "organizationId", "userId", role)
          VALUES (${crypto.randomUUID()}, ${id}, ${body.userId}, 'owner')`;
        return { id, name: body.name, slug: body.slug };
      },
    },
  },
}));
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
