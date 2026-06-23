import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { CustomSqlAdapter } from "./lib/auth-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CustomSqlAdapter(),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      // Magic-link sender. Defaults to the production domain; set AUTH_EMAIL_FROM
      // (e.g. onboarding@resend.dev, Resend's no-setup test sender) for local dev.
      from: process.env.AUTH_EMAIL_FROM ?? "auth@keepalink.com",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  // Route gating lives in middleware.ts (which returns 401 for /api and redirects
  // for pages), so no `authorized` callback is needed here.
});
