import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main>
      <h1>Authentication Error</h1>
      <p>Something went wrong: {searchParams.error || "Unknown error"}</p>
      <Link href="/auth/signin">Try again</Link>
    </main>
  );
}
