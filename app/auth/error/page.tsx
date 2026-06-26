import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Map Better Auth error codes to a friendly line with a next step; fall back to a
// generic message rather than surfacing a raw code.
const MESSAGES: Record<string, string> = {
  INVALID_TOKEN: "That sign-in link is invalid or has already been used.",
  EXPIRED_TOKEN: "That sign-in link has expired — request a new one.",
  ACCESS_DENIED: "This email isn’t invited yet. Ask your contact to add you.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    (error && MESSAGES[error]) ??
    "We couldn’t sign you in. The link may have expired — request a new one.";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign-in failed</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/auth/signin">Try again</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
