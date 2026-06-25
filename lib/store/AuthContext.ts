// Client-side auth context, seeded server-side via SetAuthContext. Carries the
// access() booleans the UI gates on — not raw roles.
export default interface AuthContext {
  userId: string;
  isOperator: boolean;
  isBuyer: boolean;
  isSeller: boolean;
  canManage: boolean;
}
