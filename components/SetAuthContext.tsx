"use client";

import { useEffect } from "react";
import { useStore, setStore } from "@/lib/store/store";

export default function SetAuthContext({
  userId,
  isOperator,
  isBuyer,
  isSeller,
  canManage,
  children,
}: {
  userId: string;
  isOperator: boolean;
  isBuyer: boolean;
  isSeller: boolean;
  canManage: boolean;
  children: React.ReactNode;
}) {
  const auth = useStore((s) => s.authContext);

  useEffect(() => {
    setStore({ authContext: { userId, isOperator, isBuyer, isSeller, canManage } });
  }, [userId, isOperator, isBuyer, isSeller, canManage]);

  if (!auth) return null;
  return <>{children}</>;
}
