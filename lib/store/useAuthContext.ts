import AuthContext from "./AuthContext";
import { useStore } from "./store";

export default function useAuthContext(): AuthContext {
  const auth = useStore((s) => s.authContext);
  if (!auth) {
    throw new Error("useAuthContext used before auth context was seeded");
  }
  return auth;
}
