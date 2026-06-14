import { signOut } from "@/auth";
import getAuthContext from "@/lib/auth/getAuthContext";
import NavLink from "@/components/NavLink";
import { Button } from "@/components/ui/button";

export default async function Sidebar() {
  const { user, roles } = await getAuthContext();
  const has = (name: string) => roles.some((r) => r.name === name);

  return (
    <nav className="flex w-48 flex-col gap-1 border-r bg-sidebar p-2 text-sidebar-foreground">
      {has("buyer") && <NavLink href="/inquiries">Inquiries</NavLink>}
      {has("seller") && <NavLink href="/offers">Offers</NavLink>}
      <form
        className="mt-auto flex flex-col gap-2 p-2"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Sign out
        </Button>
      </form>
    </nav>
  );
}
