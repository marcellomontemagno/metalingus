"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "@/lib/utils/cn";

export default function NavLink({
  href,
  children,
}: Readonly<{
  href: string;
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      data-active={isActive}
      className={cn(
        "flex items-center gap-2 rounded-md p-2 text-sm font-medium text-sidebar-foreground outline-hidden transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
      )}
    >
      {children}
    </Link>
  );
}
