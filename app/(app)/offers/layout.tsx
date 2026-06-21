import { redirect } from "next/navigation";
import getAuthContext from "@/lib/auth/getAuthContext";

export default async function OffersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { roles } = await getAuthContext();
  if (!roles.some((r) => r.name === "seller" || r.name === "broker")) redirect("/");
  return children;
}
