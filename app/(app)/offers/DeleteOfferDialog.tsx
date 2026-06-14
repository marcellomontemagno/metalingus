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
import type Offer from "@/lib/model/offer/Offer";

export default function DeleteOfferDialog({
  offer,
  onOpenChange,
  onDeleted,
}: {
  offer: Offer | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  async function handleDelete() {
    if (!offer) return;
    await fetch(`/api/offers/${offer.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <AlertDialog open={offer !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete offer?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the offer. This action cannot be undone.
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
