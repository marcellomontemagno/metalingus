// Shared helpers for the db scripts. Plain Node + the same @neondatabase/serverless
// HTTP driver the app uses, so there is no extra dependency or ORM.
// Env comes from Node itself: the package.json scripts pass --env-file-if-exists.
import { neon } from "@neondatabase/serverless";

export function getSql() {
  if (!process.env.POSTGRES_URL) {
    console.error(
      "POSTGRES_URL is not set. Run via the pnpm db:* scripts (they load .env.local " +
        "with `node --env-file-if-exists`), or pass that flag to node yourself.",
    );
    process.exit(1);
  }
  return neon(process.env.POSTGRES_URL);
}

// The Neon HTTP driver runs one statement per call, so split the file. Strips
// line comments; assumes no ';' inside string literals (true for our SQL).
export function splitStatements(sqlText) {
  return sqlText
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ALREADY_EXISTS = new Set(["42P07", "42710", "42P06"]); // dup table / object / schema

function isAlreadyExists(err) {
  return ALREADY_EXISTS.has(err.code) || /already exists/i.test(err.message || "");
}

export async function runStatements(sql, statements, { tolerateExisting = false } = {}) {
  let ran = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      ran++;
    } catch (err) {
      if (tolerateExisting && isAlreadyExists(err)) {
        skipped++;
        continue;
      }
      console.error("\nFailed statement:\n" + stmt.slice(0, 200) + "\n");
      throw err;
    }
  }
  return { ran, skipped };
}
