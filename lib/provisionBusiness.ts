import { auth } from "@/lib/auth";
import { sql } from "@/lib/db/db";

export type BusinessType = "buyer" | "seller" | "both";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Operator provisioning: allowlist a user, create their Business, make them the
// owner, and apply the buyer/seller designation. Shared by the operator panel and
// the `provision-business` CLI. (Designation is a global role today — the Phase-1
// temporary mapping; it moves to the organization `kind` field in Phase 3.)
export async function provisionBusiness(opts: {
  email: string;
  businessName: string;
  type: BusinessType;
  contactName?: string;
}): Promise<{ userId: string; orgSlug: string }> {
  const { email, businessName, type, contactName } = opts;

  // 1. Allowlist the user (idempotent on email).
  const existing = await sql`SELECT id FROM "user" WHERE email = ${email}`;
  let userId = existing[0]?.id as string | undefined;
  if (!userId) {
    const rows = await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${contactName ?? email.split("@")[0]}, ${email}, true, now(), now())
      RETURNING id`;
    userId = rows[0].id as string;
  }

  // 2. Create the Business — createOrganization also records userId as owner.
  const orgSlug = slugify(businessName);
  await auth.api.createOrganization({ body: { name: businessName, slug: orgSlug, userId } });

  // 3. Apply the buyer/seller designation.
  const roles = type === "both" ? ["buyer", "seller"] : [type];
  for (const r of roles) {
    await sql`INSERT INTO user_role (user_id, role_id) SELECT ${userId}, id FROM role WHERE name = ${r} ON CONFLICT DO NOTHING`;
  }

  return { userId, orgSlug };
}
