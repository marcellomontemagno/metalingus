import { betterAuth } from "better-auth";
import { magicLink, organization } from "better-auth/plugins";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { Resend } from "resend";

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
    // Invitation create/accept (the Members UI + `/accept-invite`) is parked on
    // the members-management branch, so there's no sendInvitationEmail here yet —
    // the invitation tables/API exist via the plugin, just no delivery.
    organization(),
  ],
});
