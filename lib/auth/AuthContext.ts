import type User from "@/lib/model/user/User";
import type Role from "@/lib/model/role/Role";

// The resolved context for the current request's authenticated user.
// Entities stay flat: roles ride alongside the user, never nested inside it.
type AuthContext = {
  user: User;
  roles: Role[];
};

export { type AuthContext as default };
