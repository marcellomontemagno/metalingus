import Link from "next/link";
import { signOut } from "@/auth";
import getAuthContext from "@/lib/auth/getAuthContext";

export default async function Sidebar() {
  const { user, roles } = await getAuthContext();
  const has = (name: string) => roles.some((r) => r.name === name);

  return (
    <nav className="flex w-48 flex-col gap-2 border-r p-4">
      {has("buyer") && <Link href="/inquiries">Inquiries</Link>}
      {has("seller") && <Link href="/offers">Offers</Link>}
      <form
        className="mt-auto"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <p className="mb-2 text-sm text-muted-foreground">{user.email}</p>
        <button type="submit">Sign out</button>
      </form>
    </nav>
  );
}
