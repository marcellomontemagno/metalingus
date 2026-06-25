// Bootstrap a platform operator and hand back a one-click sign-in link.
// Provisioning reuses lib/provisioning's provisionOperator (same logic the operator
// panel + provision-business CLI use); the only script-specific bit is capturing the
// magic-link URL instead of emailing it — for the first operator (the panel is
// operator-gated) or when email delivery isn't wired up.
//   bun scripts/mint-operator-invite.mjs <email>
import { provisionOperator } from "../lib/provisioning.ts";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const email = process.argv[2] ?? "g@esposi.to";

// 1. Provision (shared) — allowlist the user + set platformRole=operator.
await provisionOperator({ email });

// 2. Mint + capture the magic link. A throwaway auth instance whose sendMagicLink
//    captures the URL (the real auth's sender emails it); the token lands in the
//    same DB the deployed app verifies against.
let captured;
const auth = betterAuth({
  database: new Pool({ connectionString: process.env.POSTGRES_URL }),
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [
    magicLink({ disableSignUp: true, sendMagicLink: async ({ url }) => { captured = url; } }),
  ],
});
await auth.api.signInMagicLink({
  body: { email, callbackURL: "/?welcome" },
  headers: new Headers(),
});

console.log(`operator:  ${email}  (platformRole=operator)`);
console.log(`baseURL:   ${process.env.BETTER_AUTH_URL ?? "http://localhost:3000 (DEFAULT — not preprod!)"}`);
console.log(`\nmagic link (one-click sign-in):\n${captured}`);
process.exit(0);
