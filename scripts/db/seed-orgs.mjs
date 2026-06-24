// Seed the org layer: one Business (organization) per buyer/seller user — with its
// business-type `kind` derived from the user's roles — then link that user's sample
// entities to the Business. Skips platform operators (broker). Runs in db:setup
// after the base seed. (Greenfield only — no production backfill.)
import { auth } from "../../lib/auth.ts";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL);

// Businesses are for buyers/sellers — skip platform operators (broker role).
const users = await sql.query(
  'SELECT u.id, u.email, u.name FROM "user" u ' +
    'WHERE NOT EXISTS (SELECT 1 FROM member m WHERE m."userId" = u.id) ' +
    'AND NOT EXISTS (SELECT 1 FROM user_role ur JOIN role r ON r.id = ur.role_id ' +
    "WHERE ur.user_id = u.id AND r.name = 'broker') " +
    'ORDER BY u.email',
);

for (const u of users) {
  const local = u.email.split("@")[0];
  const name = (u.name && u.name.trim()) || local;
  const slug = local.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const res = await auth.api.createOrganization({ body: { name, slug, userId: u.id } });
  const org = res?.name ? res : res?.organization;

  // Business type (kind) from the user's global roles — the Phase-1 mapping moving
  // onto the org. buyer+seller -> both.
  const roleRows = await sql.query(
    "SELECT r.name FROM user_role ur JOIN role r ON r.id = ur.role_id WHERE ur.user_id = $1",
    [u.id],
  );
  const names = roleRows.map((r) => r.name);
  const kind =
    names.includes("buyer") && names.includes("seller")
      ? "both"
      : names.includes("buyer")
        ? "buyer"
        : names.includes("seller")
          ? "seller"
          : null;
  if (kind && org?.id) {
    await sql.query("UPDATE organization SET kind = $1 WHERE id = $2", [kind, org.id]);
  }

  console.log(
    `provisioned Business "${org?.name ?? name}" (${org?.slug ?? slug}, kind=${kind ?? "—"}) — owner ${u.email}`,
  );
}
if (users.length === 0) console.log("All users already have a Business — nothing to do.");

// Link each sample entity to its owner's Business (the entity's user_id is the
// owner member). Idempotent; safe to re-run.
await sql.query(
  `UPDATE inquiry i SET organization_id = m."organizationId" FROM member m WHERE m."userId" = i.user_id AND m.role = 'owner'`,
);
await sql.query(
  `UPDATE offer f SET organization_id = m."organizationId" FROM member m WHERE m."userId" = f.user_id AND m.role = 'owner'`,
);
await sql.query(
  `UPDATE "order" o SET organization_id = m."organizationId" FROM member m WHERE m."userId" = o.user_id AND m.role = 'owner'`,
);

const members = await sql.query(
  "SELECT u.email, o.name AS org, o.kind, m.role FROM member m " +
    'JOIN "user" u ON u.id = m."userId" JOIN organization o ON o.id = m."organizationId" ORDER BY u.email',
);
console.log("\nMemberships:");
for (const m of members) console.log(`  ${m.email} -> ${m.org} (kind=${m.kind ?? "—"}, ${m.role})`);
