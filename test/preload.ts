// Bun preload: swap the Neon sql for the pglite adapter and @/auth's session for
// the test-controlled one, before any route handler is imported. The real
// getAuthContext runs against pglite, so role resolution is exercised too.
import { mock } from "bun:test";
import { sql } from "./helpers/db";
import { getSession } from "./helpers/ctx";

// auth-adapter constructs neon() at import time; give it a URL it never queries.
process.env.POSTGRES_URL ||= "postgresql://test:test@localhost:5432/test";

mock.module("@/lib/db/db", () => ({ sql }));
mock.module("@/auth", () => ({ auth: async () => getSession() }));
