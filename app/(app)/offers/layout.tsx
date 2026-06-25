import { redirect } from "next/navigation";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";

export default async function OffersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isSeller, isOperator } = access(await getAuthContext());
  if (!isSeller && !isOperator) redirect("/");
  return children;
}
