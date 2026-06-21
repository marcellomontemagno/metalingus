"use client";

import { useEffect } from "react";
import { useStore, setStore } from "@/lib/store/store";

export default function SetAuthContext({
  userId,
  roles,
  children,
}: {
  userId: string;
  roles: string[];
  children: React.ReactNode;
}) {
  const auth = useStore((s) => s.authContext);

  useEffect(() => {
    setStore({ authContext: { userId, roles } });
  }, [userId, roles]);

  if (!auth) return null;
  return <>{children}</>;
}
