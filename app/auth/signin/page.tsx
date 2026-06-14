import { signIn } from "@/auth";

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
          const searchParams = await searchParamsPromise;
          const email = formData.get("email") as string;
          await signIn("resend", { 
            email, 
            redirectTo: searchParams.callbackUrl || "/"
          });
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
