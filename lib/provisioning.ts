import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/db";
import { user, organization } from "@/lib/db/schema";

export type BusinessType = "buyer" | "seller" | "both";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Allowlist a user (idempotent on email), returning their id.
async function createOrFindUser(email: string, contactName?: string): Promise<string> {
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (existing[0]?.id) return existing[0].id;
  const [created] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: contactName ?? email.split("@")[0],
      email,
      emailVerified: true,
      // createdAt/updatedAt default to now() at the DB.
    })
    .returning({ id: user.id });
  return created.id;
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
  if (orgId)
    await db.update(organization).set({ kind: type }).where(eq(organization.id, orgId));

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
  await db.update(user).set({ platformRole: "operator" }).where(eq(user.id, userId));
  return { userId };
}
