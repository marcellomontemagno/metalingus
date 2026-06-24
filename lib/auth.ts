import { betterAuth } from "better-auth";
import { magicLink, organization } from "better-auth/plugins";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { Resend } from "resend";
import { sql } from "@/lib/db/db";

// Neon's Pool speaks WebSocket; give it a constructor in Node (local + Vercel).
neonConfig.webSocketConstructor = ws;

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const from = process.env.AUTH_EMAIL_FROM ?? "auth@keepalink.com";

export const auth = betterAuth({
  // Same Neon database the app already uses — via the WebSocket Pool, not the
  // HTTP neon() client, because Better Auth needs sessions/transactions.
  database: new Pool({ connectionString: process.env.POSTGRES_URL }),
  // Reuse the existing secret in dev; set BETTER_AUTH_SECRET/URL in production.
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // UUID ids keep the app's z.uuid() validations and the text user_id FKs aligned.
  advanced: { database: { generateId: () => crypto.randomUUID() } },
  // Platform role lives on the user: `operator` = broker/platform (sees-all),
  // outside the org model. Lighter than the admin plugin (which we'd only add for
  // impersonate/ban/admin API).
  user: { additionalFields: { platformRole: { type: "string", required: false } } },
  plugins: [
    magicLink({
      // Invite-only: never auto-provision an unknown email.
      disableSignUp: true,
      // Single sender for every magic link. Sign-in, org invites, and
      // operator/business provisioning all flow through here as one-click links;
      // we frame the message from the callbackURL embedded in the link.
      sendMagicLink: async ({ email, url }) => {
        let subject = "Your metalingus sign-in link";
        let intro = "Sign in to metalingus:";
        try {
          const cb = new URL(url).searchParams.get("callbackURL") ?? "";
          if (cb.startsWith("/accept-invite")) {
            subject = "You've been invited to a Business on metalingus";
            intro =
              "You've been invited to join a Business on metalingus. Click to sign in and accept:";
            // Enrich with the org + inviter, looked up from the invitation id.
            const id = new URL(cb, "http://localhost").searchParams.get("id");
            if (id) {
              const rows = await sql`
                SELECT o.name AS org, COALESCE(u.name, u.email) AS inviter
                FROM invitation i
                JOIN organization o ON o.id = i."organizationId"
                LEFT JOIN "user" u ON u.id = i."inviterId"
                WHERE i.id = ${id}`;
              if (rows[0]) {
                const org = rows[0].org as string;
                const inviter = (rows[0].inviter as string) ?? "Someone";
                subject = `You've been invited to join ${org} on metalingus`;
                intro = `${inviter} invited you to join ${org}. Click to sign in and accept:`;
              }
            }
          } else if (cb.includes("welcome")) {
            subject = "You've been added to metalingus";
            intro = "An account was created for you on metalingus. Click to sign in:";
          }
        } catch {}
        await resend.emails.send({
          from,
          to: email,
          subject,
          html: `<p>${intro}</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    }),
    // `kind` (buyer/seller/both) is the org's business type. No sendInvitationEmail —
    // invites are delivered as one-click magic links from the invite action
    // (callbackURL -> /accept-invite?id=...), framed by sendMagicLink above.
    organization({
      schema: {
        organization: { additionalFields: { kind: { type: "string", required: false } } },
      },
    }),
  ],
});
