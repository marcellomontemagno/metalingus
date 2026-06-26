"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";
import { Inbox, Package, Shield, Tag, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const icons: Record<string, LucideIcon> = {
  inbox: Inbox,
  tag: Tag,
  package: Package,
  shield: Shield,
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export default function AppSidebar({
  items,
  userEmail,
  currentOrg,
  signOutAction,
}: Readonly<{
  items: NavItem[];
  userEmail: string | null;
  currentOrg: { name: string; slug: string } | null;
  signOutAction: () => Promise<void>;
}>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1">
          <span className="font-heading text-base font-semibold tracking-tight">
            {brand.name}
          </span>
        </Link>
        {currentOrg && (
          <div className="px-2 pb-1">
            <p className="text-xs text-muted-foreground">Business</p>
            <p className="truncate text-sm font-medium">{currentOrg.name}</p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = icons[item.icon];
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        {Icon && <Icon />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <form className="flex flex-col gap-2" action={signOutAction}>
          <p className="truncate px-2 text-xs text-muted-foreground">{userEmail}</p>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
