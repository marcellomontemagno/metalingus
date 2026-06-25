import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { member, organization } from "@/lib/db/schema";
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
  const orgRows = await db
    .select({ name: organization.name, slug: organization.slug })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, user.id))
    .orderBy(organization.name)
    .limit(1);
  const currentOrg = orgRows[0]
    ? { name: orgRows[0].name, slug: orgRows[0].slug }
    : null;

  const items = [
    // Operators see everything (broker-sees-all), matching the route layouts/handlers.
    ...(isBuyer || isOperator ? [{ href: "/inquiries", label: "Inquiries", icon: "inbox" }] : []),
    ...(isSeller || isOperator ? [{ href: "/offers", label: "Offers", icon: "tag" }] : []),
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
