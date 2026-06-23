// Load sample inquiries/offers. Skips if data already exists (use db:reset to rebuild).
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { getSql, splitStatements, runStatements } from "./_run.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sql = getSql();

const [{ n: inquiries }] = await sql.query("SELECT count(*)::int n FROM inquiry");
const [{ n: offers }] = await sql.query("SELECT count(*)::int n FROM offer");
if (inquiries > 0 || offers > 0) {
  console.log(
    `Already populated (${inquiries} inquiries, ${offers} offers) - skipping. ` +
      `Run "pnpm db:reset" to rebuild from scratch.`,
  );
  process.exit(0);
}

const seed = readFileSync(join(here, "seed.sql"), "utf8");
await runStatements(sql, splitStatements(seed));

const [{ n: fi }] = await sql.query("SELECT count(*)::int n FROM inquiry");
const [{ n: fo }] = await sql.query("SELECT count(*)::int n FROM offer");
const preview = await sql.query(
  `SELECT i.notes AS inquiry, count(o.id)::int AS m
   FROM inquiry i
   LEFT JOIN offer o ON o.grade = i.grade AND o.shape = i.shape
     AND o.width = i.width AND o.height = i.height AND o.thickness = i.thickness
   GROUP BY i.id, i.notes ORDER BY i.notes`,
);
console.log(`Seeded: ${fi} inquiries, ${fo} offers.`);
console.log("Exact-match preview (what match-suggestions would surface):");
for (const r of preview) console.log(`  - ${r.inquiry} -> ${r.m} matching offer(s)`);
