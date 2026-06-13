import { neon } from "@neondatabase/serverless";
import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  VerificationToken,
} from "next-auth/adapters";

const sql = neon(process.env.POSTGRES_URL!);

export function CustomSqlAdapter(): Adapter {
  return {
    /* 
     * createUser is disabled to prevent public signups. 
     * Users must be manually invited via the database.
     */
    // async createUser(user: Omit<AdapterUser, "id">) {
    //   const rows = await sql`
    //     INSERT INTO "user" (name, email, email_verified, image)
    //     VALUES (${user.name}, ${user.email}, ${user.emailVerified?.toISOString()}, ${user.image})
    //     RETURNING id, name, email, email_verified as "emailVerified", image
    //   `;
    //   return rows[0] as unknown as AdapterUser;
    // },
    async getUser(id: string) {
      const rows = await sql`SELECT id, name, email, email_verified as "emailVerified", image FROM "user" WHERE id = ${id}`;
      return rows[0] ? (rows[0] as unknown as AdapterUser) : null;
    },
    async getUserByEmail(email: string) {
      const rows = await sql`SELECT id, name, email, email_verified as "emailVerified", image FROM "user" WHERE email = ${email}`;
      return rows[0] ? (rows[0] as unknown as AdapterUser) : null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const rows = await sql`
        SELECT u.id, u.name, u.email, u.email_verified as "emailVerified", u.image
        FROM "user" u
        JOIN account a ON u.id = a.user_id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `;
      return rows[0] ? (rows[0] as unknown as AdapterUser) : null;
    },
    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      const rows = await sql`
        UPDATE "user"
        SET name = COALESCE(${user.name}, name),
            email = COALESCE(${user.email}, email),
            email_verified = COALESCE(${user.emailVerified?.toISOString()}, email_verified),
            image = COALESCE(${user.image}, image)
        WHERE id = ${user.id}
        RETURNING id, name, email, email_verified as "emailVerified", image
      `;
      return rows[0] as unknown as AdapterUser;
    },
    async linkAccount(account: AdapterAccount) {
      await sql`
        INSERT INTO account (
          user_id, type, provider, provider_account_id, refresh_token, access_token,
          expires_at, token_type, scope, id_token, session_state
        )
        VALUES (
          ${account.userId}, ${account.type}, ${account.provider}, ${account.providerAccountId},
          ${account.refresh_token}, ${account.access_token}, ${account.expires_at},
          ${account.token_type}, ${account.scope}, ${account.id_token}, ${typeof account.session_state === "string" ? account.session_state : JSON.stringify(account.session_state)}
        )
      `;
    },
    async createVerificationToken(token: VerificationToken) {
      await sql`
        INSERT INTO verification_token (identifier, token, expires)
        VALUES (${token.identifier}, ${token.token}, ${token.expires.toISOString()})
      `;
      return token;
    },
    async useVerificationToken({ identifier, token }) {
      const rows = await sql`
        DELETE FROM verification_token
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING identifier, token, expires
      `;
      return rows[0] ? (rows[0] as unknown as VerificationToken) : null;
    },
  };
}
