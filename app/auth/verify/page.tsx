import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyRequestPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent you a sign-in link. Click it to finish signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Didn’t get it? Check your spam folder, or{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-foreground underline underline-offset-4"
        >
          try a different email
        </Link>
        .
      </CardContent>
    </Card>
  );
}
