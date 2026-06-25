import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { sql } from "@/lib/db/db";
import AppSidebar from "@/components/AppSidebar";
import SetAuthContext from "@/components/SetAuthContext";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = await getAuthContext();
  const { user } = ctx;
  const { isOperator, isBuyer, isSeller } = access(ctx);

  // Current Business to surface in the sidebar (first membership for now; the
  // deferred switcher will let multi-org users choose the active one).
  const orgRows = await sql`
    SELECT o.name, o.slug FROM member m JOIN organization o ON o.id = m."organizationId"
    WHERE m."userId" = ${user.id} ORDER BY o.name LIMIT 1`;
  const currentOrg = orgRows[0]
    ? { name: orgRows[0].name as string, slug: orgRows[0].slug as string }
    : null;

  const items = [
    ...(isBuyer ? [{ href: "/inquiries", label: "Inquiries", icon: "inbox" }] : []),
    ...(isSeller ? [{ href: "/offers", label: "Offers", icon: "tag" }] : []),
    ...(isOperator || isBuyer || isSeller
      ? [{ href: "/orders", label: "Orders", icon: "package" }]
      : []),
    ...(isOperator ? [{ href: "/operator", label: "Operator", icon: "shield" }] : []),
  ];

  async function signOutAction() {
    "use server";
    await auth.api.signOut({ headers: await headers() });
    redirect("/");
  }

  return (
    <SidebarProvider>
      <SetAuthContext
        userId={user.id}
        isOperator={isOperator}
        isBuyer={isBuyer}
        isSeller={isSeller}
      >
        <AppSidebar
          items={items}
          userEmail={user.email}
          currentOrg={currentOrg}
          signOutAction={signOutAction}
        />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </SetAuthContext>
    </SidebarProvider>
  );
}
