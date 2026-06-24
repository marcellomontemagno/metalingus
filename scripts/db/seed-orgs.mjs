// Provision one Business (organization) per existing user who lacks one, making
// them the owner. Uses Better Auth's server API so membership + creator role are
// set correctly. Run with: pnpm db:seed-orgs   (after pnpm db:setup)
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
  console.log(`provisioned Business "${org?.name ?? name}" (${org?.slug ?? slug}) — owner ${u.email}`);
}
if (users.length === 0) console.log("All users already have a Business — nothing to do.");

const members = await sql.query(
  'SELECT u.email, o.name AS org, m.role FROM member m ' +
    'JOIN "user" u ON u.id = m."userId" JOIN organization o ON o.id = m."organizationId" ORDER BY u.email',
);
console.log("\nMemberships:");
for (const m of members) console.log(`  ${m.email} -> ${m.org} (${m.role})`);
