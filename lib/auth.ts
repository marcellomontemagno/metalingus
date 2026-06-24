import { betterAuth } from "better-auth";
import { magicLink, organization } from "better-auth/plugins";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { Resend } from "resend";

// Neon's Pool speaks WebSocket; give it a constructor in Node (local + Vercel).
neonConfig.webSocketConstructor = ws;

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const from = process.env.AUTH_EMAIL_FROM ?? "auth@keepalink.com";
const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

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
      // One sender for every magic link, framed by the callbackURL. Operator/
      // business provisioning sends a one-click welcome (callbackURL `/?welcome`).
      sendMagicLink: async ({ email, url }) => {
        let subject = "Your metalingus sign-in link";
        let intro = "Sign in to metalingus:";
        try {
          if ((new URL(url).searchParams.get("callbackURL") ?? "").includes("welcome")) {
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
    // `kind` (buyer/seller/both) is the org's business type. sendInvitationEmail
    // delivers org invites (the Members UI + `/accept-invite`).
    organization({
      schema: {
        organization: { additionalFields: { kind: { type: "string", required: false } } },
      },
      sendInvitationEmail: async ({ email, organization, inviter, invitation }) => {
        const url = `${appUrl}/accept-invite?id=${invitation.id}`;
        try {
          await resend.emails.send({
            from,
            to: email,
            subject: `Join ${organization.name} on metalingus`,
            html: `<p>${inviter.user.name ?? inviter.user.email} invited you to join <strong>${organization.name}</strong>.</p><p><a href="${url}">Accept invitation</a></p>`,
          });
        } catch (e) {
          console.error("invitation email failed:", e);
        }
      },
    }),
  ],
});
