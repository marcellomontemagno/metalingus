import { auth } from "@/lib/auth";
import { sql } from "@/lib/db/db";

export type BusinessType = "buyer" | "seller" | "both";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Allowlist a user (idempotent on email), returning their id.
async function createOrFindUser(email: string, contactName?: string): Promise<string> {
  const existing = await sql`SELECT id FROM "user" WHERE email = ${email}`;
  if (existing[0]?.id) return existing[0].id as string;
  const rows = await sql`
    INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${contactName ?? email.split("@")[0]}, ${email}, true, now(), now())
    RETURNING id`;
  return rows[0].id as string;
}

// Provision a buyer/seller Business: allowlist the owner, create the Business
// (owner membership), and set its business type (`kind`). Shared by the operator
// panel and the `provision-business` CLI. (The optional welcome email is sent by
// the caller as a one-click magic link.)
export async function provisionBusiness(opts: {
  email: string;
  businessName: string;
  type: BusinessType;
  contactName?: string;
}): Promise<{ userId: string; orgSlug: string }> {
  const { email, businessName, type, contactName } = opts;
  const userId = await createOrFindUser(email, contactName);

  const orgSlug = slugify(businessName);
  const res: any = await auth.api.createOrganization({
    body: { name: businessName, slug: orgSlug, userId },
  });
  const orgId = res?.id ?? res?.organization?.id;
  if (orgId) await sql`UPDATE organization SET kind = ${type} WHERE id = ${orgId}`;

  return { userId, orgSlug };
}

// Provision a platform operator: allowlist the user and set the platform role.
// Operators are platform-level — no Business.
export async function provisionOperator(opts: {
  email: string;
  contactName?: string;
}): Promise<{ userId: string }> {
  const { email, contactName } = opts;
  const userId = await createOrFindUser(email, contactName);
  await sql`UPDATE "user" SET "platformRole" = 'operator' WHERE id = ${userId}`;
  return { userId };
}
