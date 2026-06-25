// Seed the org layer: one Business (organization) per buyer/seller user — with its
// business-type `kind` — then link that user's sample entities to the Business.
// Skips platform operators. Runs in db:setup after the base seed. (Greenfield only.)
import { auth } from "../../lib/auth.ts";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL);

// Business type for the dev sample users (the base seed creates these).
const KIND = { "buyer@example.com": "buyer", "seller@example.com": "seller" };

// Businesses are for buyers/sellers — skip platform operators.
const users = await sql.query(
  'SELECT u.id, u.email, u.name FROM "user" u ' +
    'WHERE NOT EXISTS (SELECT 1 FROM member m WHERE m."userId" = u.id) ' +
    `AND u."platformRole" IS DISTINCT FROM 'operator' ` +
    'ORDER BY u.email',
);

for (const u of users) {
  const local = u.email.split("@")[0];
  const name = (u.name && u.name.trim()) || local;
  const slug = local.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const res = await auth.api.createOrganization({ body: { name, slug, userId: u.id } });
  const org = res?.name ? res : res?.organization;

  const kind = KIND[u.email] ?? "both";
  if (org?.id) {
    await sql.query("UPDATE organization SET kind = $1 WHERE id = $2", [kind, org.id]);
  }

  console.log(
    `provisioned Business "${org?.name ?? name}" (${org?.slug ?? slug}, kind=${kind}) — owner ${u.email}`,
  );
}
if (users.length === 0) console.log("All users already have a Business — nothing to do.");

// Link each sample entity to its owner's Business (the owner membership). Idempotent.
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
