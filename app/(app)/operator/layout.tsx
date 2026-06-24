import { redirect } from "next/navigation";
import getAuthContext from "@/lib/auth/getAuthContext";

// Operator console: platform (broker) role only.
export default async function OperatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { roles } = await getAuthContext();
  if (!roles.some((r) => r.name === "broker")) redirect("/");
  return children;
}
