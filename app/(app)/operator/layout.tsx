import { redirect } from "next/navigation";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";

// Operator console: platform operators only.
export default async function OperatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isOperator } = access(await getAuthContext());
  if (!isOperator) redirect("/");
  return children;
}
