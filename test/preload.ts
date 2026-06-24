// Bun preload: swap the Neon sql for the pglite adapter and Better Auth's session
// for the test-controlled one, before any route handler is imported. The real
// getAuthContext runs against pglite, so role resolution is exercised too.
import { mock } from "bun:test";
import { sql } from "./helpers/db";
import { getSession } from "./helpers/ctx";

// lib/auth constructs neon() at import; never loaded here, but keep env sane.
process.env.POSTGRES_URL ||= "postgresql://test:test@localhost:5432/test";

mock.module("@/lib/db/db", () => ({ sql }));
// getAuthContext resolves identity via @/lib/auth's getSession + next/headers.
mock.module("@/lib/auth", () => ({
  auth: { api: { getSession: async () => getSession() } },
}));
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
