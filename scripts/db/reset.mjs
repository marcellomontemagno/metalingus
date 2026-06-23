// DESTRUCTIVE: drops every app table and type (including all users -- you'll need
// to recreate your invite-only sign-in user afterwards). Used by `pnpm db:reset`,
// which then re-runs bootstrap + seed.
import { getSql } from "./_run.mjs";

const sql = getSql();

// Tables first (CASCADE clears FKs and dependent rows), then the enum types.
const drops = [
  'DROP TABLE IF EXISTS order_offer CASCADE',
  'DROP TABLE IF EXISTS "order" CASCADE',
  "DROP TABLE IF EXISTS user_role CASCADE",
  "DROP TABLE IF EXISTS account CASCADE",
  "DROP TABLE IF EXISTS verification_token CASCADE",
  "DROP TABLE IF EXISTS offer CASCADE",
  "DROP TABLE IF EXISTS inquiry CASCADE",
  "DROP TABLE IF EXISTS role CASCADE",
  'DROP TABLE IF EXISTS "user" CASCADE',
  "DROP TYPE IF EXISTS order_status",
  "DROP TYPE IF EXISTS grade",
  "DROP TYPE IF EXISTS shape",
];

for (const stmt of drops) await sql.query(stmt);
console.log("Dropped all metalingus tables and types.");
