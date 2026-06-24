import { auth } from "@/lib/auth";
import { sql } from "@/lib/db/db";
import { sendWelcomeEmail } from "@/lib/email";

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

async function grantRole(userId: string, role: string): Promise<void> {
  await sql`INSERT INTO user_role (user_id, role_id) SELECT ${userId}, id FROM role WHERE name = ${role} ON CONFLICT DO NOTHING`;
}

// Provision a buyer/seller Business: allowlist the owner, create the Business
// (owner membership), and apply the buyer/seller designation (global role today —
// the Phase-1 mapping; moves to the organization `kind` field in Phase 3). Shared
// by the operator panel and the `provision-business` CLI.
export async function provisionBusiness(opts: {
  email: string;
  businessName: string;
  type: BusinessType;
  contactName?: string;
  sendEmail?: boolean;
}): Promise<{ userId: string; orgSlug: string; emailSent: boolean }> {
  const { email, businessName, type, contactName, sendEmail } = opts;
  const userId = await createOrFindUser(email, contactName);

  const orgSlug = slugify(businessName);
  await auth.api.createOrganization({ body: { name: businessName, slug: orgSlug, userId } });

  for (const r of type === "both" ? ["buyer", "seller"] : [type]) await grantRole(userId, r);

  const emailSent = sendEmail ? await sendWelcomeEmail(email, businessName) : false;
  return { userId, orgSlug, emailSent };
}

// Provision a platform operator: allowlist the user and grant the broker role.
// Operators are platform-level — no Business.
export async function provisionOperator(opts: {
  email: string;
  contactName?: string;
  sendEmail?: boolean;
}): Promise<{ userId: string; emailSent: boolean }> {
  const { email, contactName, sendEmail } = opts;
  const userId = await createOrFindUser(email, contactName);
  await grantRole(userId, "broker");
  const emailSent = sendEmail ? await sendWelcomeEmail(email, "platform operator") : false;
  return { userId, emailSent };
}
