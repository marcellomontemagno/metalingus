import { redirect } from "next/navigation";
import getAuthContext from "@/lib/auth/getAuthContext";

export default async function InquiriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { roles } = await getAuthContext();
  if (!roles.some((r) => r.name === "buyer")) redirect("/");
  return children;
}
