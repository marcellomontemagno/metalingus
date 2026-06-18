import { signOut } from "@/auth";
import getAuthContext from "@/lib/auth/getAuthContext";
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
  const { user, roles } = await getAuthContext();
  const has = (name: string) => roles.some((r) => r.name === name);

  const items = [
    ...(has("buyer") ? [{ href: "/inquiries", label: "Inquiries", icon: "inbox" }] : []),
    ...(has("seller") ? [{ href: "/offers", label: "Offers", icon: "tag" }] : []),
    ...(has("broker") || has("buyer") || has("seller")
      ? [{ href: "/orders", label: "Orders", icon: "package" }]
      : []),
  ];

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <SidebarProvider>
      <SetAuthContext userId={user.id} roles={roles.map((r) => r.name)} />
      <AppSidebar items={items} userEmail={user.email} signOutAction={signOutAction} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
