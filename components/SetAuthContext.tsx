"use client";

import { useEffect } from "react";
import { setStore } from "@/lib/store/store";

// Seeds the server-resolved auth context into the client store on mount, so
// client components can read role/user via useStore((s) => s.authContext)
// instead of a React context provider.
export default function SetAuthContext({
  userId,
  roles,
}: {
  userId: string;
  roles: string[];
}) {
  useEffect(() => {
    setStore({ authContext: { userId, roles } });
  }, [userId, roles]);
  return null;
}
