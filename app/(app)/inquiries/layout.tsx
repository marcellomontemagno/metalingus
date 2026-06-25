import { redirect } from "next/navigation";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";

export default async function InquiriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isBuyer, isOperator } = access(await getAuthContext());
  if (!isBuyer && !isOperator) redirect("/");
  return children;
}
