import type User from "@/lib/model/user/User";
import type Role from "@/lib/model/role/Role";

// The resolved context for the current request's authenticated user.
// Entities stay flat: roles ride alongside the user, never nested inside it.
type AuthContext = {
  user: User;
  // Legacy global roles (buyer/seller/broker) — dropped in Step 5 once the
  // handlers/UI read the org-scoped fields below.
  roles: Role[];
  // Phase 3: the user's current Business + their role in it, and the platform role.
  organization: { id: string; name: string; kind: string | null } | null;
  memberRole: string | null;
  platformRole: string | null;
};

export { type AuthContext as default };
