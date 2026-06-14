import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Welcome</h1>
        <Link href="/auth/signin">Sign in if invited</Link>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-lg font-semibold">Welcome</h1>
        <p className="text-muted-foreground">Select a section from the sidebar.</p>
      </div>
    </AppShell>
  );
}
