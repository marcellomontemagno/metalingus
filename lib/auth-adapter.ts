import { sql } from "@vercel/postgres";
import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  VerificationToken,
} from "next-auth/adapters";

export function CustomSqlAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const { rows } = await sql`
        INSERT INTO users (name, email, email_verified, image)
        VALUES (${user.name}, ${user.email}, ${user.emailVerified?.toISOString()}, ${user.image})
        RETURNING id, name, email, email_verified as "emailVerified", image
      `;
      return rows[0] as AdapterUser;
    },
    async getUser(id: string) {
      const { rows } = await sql`SELECT id, name, email, email_verified as "emailVerified", image FROM users WHERE id = ${id}`;
      return rows[0] ? (rows[0] as AdapterUser) : null;
    },
    async getUserByEmail(email: string) {
      const { rows } = await sql`SELECT id, name, email, email_verified as "emailVerified", image FROM users WHERE email = ${email}`;
      return rows[0] ? (rows[0] as AdapterUser) : null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const { rows } = await sql`
        SELECT u.id, u.name, u.email, u.email_verified as "emailVerified", u.image
        FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `;
      return rows[0] ? (rows[0] as AdapterUser) : null;
    },
    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      const { rows } = await sql`
        UPDATE users
        SET name = COALESCE(${user.name}, name),
            email = COALESCE(${user.email}, email),
            email_verified = COALESCE(${user.emailVerified?.toISOString()}, email_verified),
            image = COALESCE(${user.image}, image)
        WHERE id = ${user.id}
        RETURNING id, name, email, email_verified as "emailVerified", image
      `;
      return rows[0] as AdapterUser;
    },
    async linkAccount(account: AdapterAccount) {
      await sql`
        INSERT INTO accounts (
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
      const { rows } = await sql`
        DELETE FROM verification_token
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING identifier, token, expires
      `;
      return rows[0] ? (rows[0] as VerificationToken) : null;
    },
  };
}
