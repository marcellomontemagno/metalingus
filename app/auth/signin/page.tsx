import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  return (
    <main>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Sign In</h1>
      {searchParams.error && (
        <p style={{ color: "red" }}>Error: {searchParams.error}</p>
      )}
      <form
        action={async (formData) => {
          "use server";
          const sp = await searchParamsPromise;
          const email = formData.get("email") as string;
          try {
            await auth.api.signInMagicLink({
              body: { email, callbackURL: sp.callbackUrl || "/" },
              headers: await headers(),
            });
          } catch {
            // Swallow: don't reveal whether the email is invited (invite-only).
          }
          redirect("/auth/verify");
        }}
      >
        <input
          type="email"
          name="email"
          placeholder="Email address"
          required
        />
        <button type="submit">Send Magic Link</button>
      </form>
    </main>
  );
}
