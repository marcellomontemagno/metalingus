// Create the schema. Safe to re-run: existing objects are skipped.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { getSql, splitStatements, runStatements } from "./_run.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, "schema.sql"), "utf8");

const sql = getSql();
const { ran, skipped } = await runStatements(sql, splitStatements(schema), {
  tolerateExisting: true,
});

const tables = await sql.query(
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1",
);
console.log(
  `Bootstrap complete: ${ran} statement(s) run` +
    (skipped ? `, ${skipped} skipped (already existed)` : "") +
    ".",
);
console.log(`Tables (${tables.length}): ${tables.map((t) => t.tablename).join(", ")}`);
