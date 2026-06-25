"use client";

import { useEffect } from "react";
import { useStore, setStore } from "@/lib/store/store";

export default function SetAuthContext({
  userId,
  isOperator,
  isBuyer,
  isSeller,
  children,
}: {
  userId: string;
  isOperator: boolean;
  isBuyer: boolean;
  isSeller: boolean;
  children: React.ReactNode;
}) {
  const auth = useStore((s) => s.authContext);

  useEffect(() => {
    setStore({ authContext: { userId, isOperator, isBuyer, isSeller } });
  }, [userId, isOperator, isBuyer, isSeller]);

  if (!auth) return null;
  return <>{children}</>;
}
