import type User from "@/lib/model/user/User";

// The resolved context for the current request's authenticated user: the user,
// their current Business (+ business type), and the platform role.
type AuthContext = {
  user: User;
  organization: { id: string; name: string; kind: string | null } | null;
  platformRole: string | null;
};

export { type AuthContext as default };
