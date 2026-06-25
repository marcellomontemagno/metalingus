import { defineConfig } from "drizzle-kit";

// POSTGRES_URL must be present in the environment when running drizzle-kit, e.g.
//   set -a; . ./.env.local; set +a; npx drizzle-kit <cmd>
// (drizzle-kit does not auto-load .env.local the way the node --env-file scripts do.)
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.POSTGRES_URL! },
});
