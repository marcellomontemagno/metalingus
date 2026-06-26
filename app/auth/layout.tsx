import Link from "next/link";

// Shared shell for the auth flow (signin / verify / error): centered, branded,
// max-w-sm. Each page renders its own Card inside.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <Link
        href="/"
        className="font-heading text-2xl font-semibold tracking-tight"
      >
        metalingus
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
