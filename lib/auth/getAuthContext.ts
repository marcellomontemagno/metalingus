import { auth } from "@/auth";
import { sql } from "@/lib/db/db";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import { userSchema } from "@/lib/model/user/User";
import { roleSchema } from "@/lib/model/role/Role";
import type AuthContext from "./AuthContext";

export default async function getAuthContext(): Promise<AuthContext> {
  const session = await auth();
  const email = session?.user?.email;
  const userRows = await sql`SELECT * FROM "user" WHERE email = ${email}`;
  const user = parseRow(userSchema, userRows[0]);
  const roleRows = await sql`
    SELECT r.*
    FROM role r
    JOIN user_role ur ON ur.role_id = r.id
    WHERE ur.user_id = ${user.id}
  `;
  return { user, roles: parseRows(roleSchema, roleRows) };
}
