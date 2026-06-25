import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// The app's first client-side auth instance — powers the org switcher and other
// client-driven organization actions. Same-origin, so baseURL defaults to the
// current window origin (matches the server's /api/auth handler).
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
