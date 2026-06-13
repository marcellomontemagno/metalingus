import {auth} from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  return (
    <div>
      <p>This is the bare-bones landing page accessible to everyone.</p>
      {session ? (
        <div>
          <p>Logged in as {session.user?.email}</p>
          <Link href="/protected">Go to Protected Page</Link>
        </div>
      ) : (
        <Link href="/auth/signin">Sign In if invited</Link>
      )}
    </div>
  );
}
