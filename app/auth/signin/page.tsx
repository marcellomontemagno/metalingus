import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import SubmitButton from "../submit-button";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your email and we’ll send you a magic link. Access is invite-only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            "use server";
            const email = formData.get("email") as string;
            try {
              await auth.api.signInMagicLink({
                body: { email, callbackURL: callbackUrl || "/" },
                headers: await headers(),
              });
            } catch {
              // Swallow: don't reveal whether the email is invited (invite-only).
            }
            redirect("/auth/verify");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@company.com"
                required
                autoFocus
              />
              {error && (
                <FieldError>
                  We couldn’t send a link to that address — check it and try again.
                </FieldError>
              )}
            </Field>
            <SubmitButton>Send magic link</SubmitButton>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
