import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Staged Better Auth handler. Lives at /api/better-auth/* alongside next-auth
// (/api/auth/*) until the swap, when it moves to /api/auth and next-auth is removed.
export const { GET, POST } = toNextJsHandler(auth);
