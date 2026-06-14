import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { CustomSqlAdapter } from "./lib/auth-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CustomSqlAdapter(),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: "auth@keepalink.com",
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
