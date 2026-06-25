import type AuthContext from "./AuthContext";

// Phase-3 access derivation from the auth context: the platform role and the
// user's current org + business-type. Route handlers use these instead of the
// old global roles.
export function access(ctx: AuthContext) {
  const orgId = ctx.organization?.id ?? null;
  const kind = ctx.organization?.kind ?? null;
  return {
    isOperator: ctx.platformRole === "operator",
    orgId,
    isBuyer: kind === "buyer" || kind === "both",
    isSeller: kind === "seller" || kind === "both",
  };
}
