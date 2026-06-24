import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db/db";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import { userSchema } from "@/lib/model/user/User";
import { roleSchema } from "@/lib/model/role/Role";
import type AuthContext from "./AuthContext";

export default async function getAuthContext(): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email;
  const userRows = await sql`SELECT * FROM "user" WHERE email = ${email}`;
  const user = parseRow(userSchema, userRows[0]);
  const roleRows = await sql`
    SELECT r.*
    FROM role r
    JOIN user_role ur ON ur.role_id = r.id
    WHERE ur.user_id = ${user.id}
  `;
  // The user's current Business (first membership) + their role in it; plus the
  // platform role off the user. These replace the global roles in Steps 4–5.
  const orgRows = await sql`
    SELECT o.id, o.name, o.kind, m.role AS member_role
    FROM member m JOIN organization o ON o.id = m."organizationId"
    WHERE m."userId" = ${user.id} ORDER BY o.name LIMIT 1`;
  const organization = orgRows[0]
    ? {
        id: orgRows[0].id as string,
        name: orgRows[0].name as string,
        kind: (orgRows[0].kind as string | null) ?? null,
      }
    : null;
  const memberRole = (orgRows[0]?.member_role as string | undefined) ?? null;
  const platformRole = user.platformRole ?? null;
  return {
    user,
    roles: parseRows(roleSchema, roleRows),
    organization,
    memberRole,
    platformRole,
  };
}
