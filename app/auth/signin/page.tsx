import { signIn } from "@/auth";

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  return (
    <main>
      <h1>Sign In</h1>
      {searchParams.error && (
        <p style={{ color: "red" }}>Error: {searchParams.error}</p>
      )}
      <form
        action={async (formData) => {
          "use server";
          const email = formData.get("email") as string;
          await signIn("resend", { 
            email, 
            redirectTo: searchParams.callbackUrl || "/protected" 
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
