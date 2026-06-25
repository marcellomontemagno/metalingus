import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

// lib/db/schema.ts is imported by client components for inferred types and the
// drizzle-zod validators — it MUST stay client-safe and never pull in the driver
// or the connection string (which live in lib/db/db.ts, server-only).
test("lib/db/schema.ts stays client-safe (no server-only imports)", () => {
  const src = readFileSync("lib/db/schema.ts", "utf8");
  expect(src).not.toMatch(/from\s+["']\.\/db["']/); // no import of the db instance
  expect(src).not.toMatch(/process\.env/); // no connection string
  expect(src).not.toMatch(/@neondatabase\/serverless/); // no driver
});
