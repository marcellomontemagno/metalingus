import type AuthContext from "./AuthContext";

// Phase-3 access derivation from the auth context: the platform role, the user's
// current org + business-type, and whether they can write for it. Route handlers
// use these instead of the old global roles.
export function access(ctx: AuthContext) {
  const orgId = ctx.organization?.id ?? null;
  const kind = ctx.organization?.kind ?? null;
  return {
    isOperator: ctx.platformRole === "operator",
    orgId,
    isBuyer: kind === "buyer" || kind === "both",
    isSeller: kind === "seller" || kind === "both",
    canManage: ctx.memberRole === "owner" || ctx.memberRole === "admin",
  };
}
