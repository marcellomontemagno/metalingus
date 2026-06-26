import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Welcome to metalingus
          </h1>
          <p className="text-muted-foreground text-balance">
            A broker-mediated marketplace for steel bar.
          </p>
        </div>
        <Button asChild>
          <Link href="/auth/signin">Sign in</Link>
        </Button>
        <p className="text-xs text-muted-foreground">Access is invite-only.</p>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="font-heading text-lg font-semibold tracking-tight">
          Welcome
        </h1>
        <p className="text-muted-foreground">Select a section from the sidebar.</p>
      </div>
    </AppShell>
  );
}
