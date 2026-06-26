"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Submit button that stays enabled until the request starts, then shows a spinner
// (guideline: no disabled-until-valid; feedback during the in-flight server action).
export default function SubmitButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
      {pending && <Spinner />}
      {pending ? "Sending…" : children}
    </Button>
  );
}
