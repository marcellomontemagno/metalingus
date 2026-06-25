import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db/db";
import parseRow from "@/lib/db/parseRow";
import { userSchema } from "@/lib/model/user/User";
import type AuthContext from "./AuthContext";

export default async function getAuthContext(): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email;
  const userRows = await sql`SELECT * FROM "user" WHERE email = ${email}`;
  const user = parseRow(userSchema, userRows[0]);
  // The user's current Business (first membership) + the platform role.
  const orgRows = await sql`
    SELECT o.id, o.name, o.kind
    FROM member m JOIN organization o ON o.id = m."organizationId"
    WHERE m."userId" = ${user.id} ORDER BY o.name LIMIT 1`;
  const organization = orgRows[0]
    ? {
        id: orgRows[0].id as string,
        name: orgRows[0].name as string,
        kind: (orgRows[0].kind as string | null) ?? null,
      }
    : null;
  const platformRole = user.platformRole ?? null;
  return { user, organization, platformRole };
}
