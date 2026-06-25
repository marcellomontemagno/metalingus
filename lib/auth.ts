import { betterAuth } from "better-auth";
import { magicLink, organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { txDb } from "@/lib/db/db";
import * as dbSchema from "@/lib/db/schema";

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const from = process.env.AUTH_EMAIL_FROM ?? "auth@keepalink.com";

export const auth = betterAuth({
  // Drizzle over the same Neon DB — the WebSocket Pool (txDb) gives Better Auth its
  // sessions/transactions; the introspected schema is the single source of truth.
  database: drizzleAdapter(txDb, { provider: "pg", schema: dbSchema }),
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
    // Invitation create/accept (the Members UI + `/accept-invite`) is parked on
    // the members-management branch — no sendInvitationEmail here yet. Phase 3:
    // `kind` (buyer/seller/both) is the org's business type, which replaces the
    // global buyer/seller roles.
    organization({
      schema: {
        organization: { additionalFields: { kind: { type: "string", required: false } } },
      },
    }),
  ],
});
