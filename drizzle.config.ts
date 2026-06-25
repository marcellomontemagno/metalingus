import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't auto-load .env.local (unlike the `node --env-file` scripts).
// Load it here, without overriding an already-set var — so an inline override
// (e.g. POSTGRES_URL=... for preprod) still wins.
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.POSTGRES_URL! },
});
