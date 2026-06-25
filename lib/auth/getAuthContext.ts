import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/db";
import { user as userTable, member, organization } from "@/lib/db/schema";
import { userSchema } from "@/lib/model/user/User";
import type AuthContext from "./AuthContext";

export default async function getAuthContext(): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";
  const userRows = await db.select().from(userTable).where(eq(userTable.email, email));
  const user = userSchema.parse(userRows[0]);
  // The user's current Business (first membership) + the platform role.
  const orgRows = await db
    .select({ id: organization.id, name: organization.name, kind: organization.kind })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, user.id))
    .orderBy(organization.name)
    .limit(1);
  const org = orgRows[0]
    ? { id: orgRows[0].id, name: orgRows[0].name, kind: orgRows[0].kind ?? null }
    : null;
  const platformRole = user.platformRole ?? null;
  return { user, organization: org, platformRole };
}
