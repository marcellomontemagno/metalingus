// DESTRUCTIVE: wipes the entire public schema (Better Auth tables + app tables).
// `pnpm db:reset` re-runs the Better Auth migrate + app bootstrap + seed afterwards.
// You'll need to recreate your invite-only sign-in user (see SETUP.md).
import { getSql } from "./_run.mjs";

const sql = getSql();

await sql.query("DROP SCHEMA public CASCADE");
await sql.query("CREATE SCHEMA public");

console.log("Wiped the public schema (Better Auth + app tables).");
