import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db/db";

// Public route (see middleware PUBLIC_PATHS): a signed-out invitee can reach it,
// and we bounce them through sign-in with a callback that returns here with ?id.
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/accept-invite?id=${id}`)}`);
  }

  // Name for the confirmation message — read before accepting (invitation still exists).
  const rows = await sql`
    SELECT o.name FROM invitation i JOIN organization o ON o.id = i."organizationId" WHERE i.id = ${id}`;
  const orgName = (rows[0]?.name as string | undefined) ?? "the Business";

  let ok = false;
  let error: string | null = null;
  try {
    await auth.api.acceptInvitation({ body: { invitationId: id }, headers: await headers() });
    ok = true;
  } catch (e) {
    error = e instanceof Error ? e.message : "This invitation can't be accepted.";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {ok ? "You're in" : "Invitation"}
      </h1>
      <p className={ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
        {ok
          ? `You've joined ${orgName}. Welcome aboard.`
          : (error ??
            "This invitation can't be accepted — it may be expired, already used, or for a different email.")}
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Continue to metalingus
      </Link>
    </main>
  );
}
