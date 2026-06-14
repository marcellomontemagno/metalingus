"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type Inquiry from "@/lib/model/inquiry/Inquiry";

export default function DeleteInquiryDialog({
  inquiry,
  onOpenChange,
  onDeleted,
}: {
  inquiry: Inquiry | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  async function handleDelete() {
    if (!inquiry) return;
    await fetch(`/api/inquiries/${inquiry.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <AlertDialog open={inquiry !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete inquiry?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the inquiry. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
