"use client";

import { useState } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { produce } from "immer";
import { useStore, setStore } from "@/lib/store/store";
import { useAsync } from "react-async-hook";
import { getOffers, deleteOfferApi } from "@/lib/api/offerApi";
import type Offer from "@/lib/model/offer/Offer";
import OfferFormDialog from "./OfferFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import createCode from "@/lib/utils/createCode";

function dimensions(o: Offer) {
  if (o.shape === "ROUND") return `Ø${o.height}`;
  if (o.shape === "SQUARE") return `${o.width}`;
  return `${o.width} × ${o.height}`;
}

export default function OffersPage() {
  const { loading } = useAsync(getOffers, [], {
    onSuccess: (data) => {
      setStore(
        produce((s) => {
          data.forEach((o) => {
            s.entities.offer[o.id] = o;
          });
        }),
      );
    },
  });

  const offersMap = useStore((s) => s.entities.offer);
  const offers = Object.values(offersMap);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteOffer() {
    if (!deletingId) return;
    setStore(
      produce((draft) => {
        delete draft.entities.offer[deletingId];
      }),
    );
    setDeletingId(null);
    await deleteOfferApi(deletingId);
  }

  return (
    <main className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Offers</CardTitle>
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setFormOpen(true);
              }}
            >
              New offer
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Bars</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Shape</TableHead>
                  <TableHead>Dimensions (mm)</TableHead>
                  <TableHead>Thickness (mm)</TableHead>
                  <TableHead>Bars/bundle</TableHead>
                  <TableHead>Weight/m (kg)</TableHead>
                  <TableHead>Price/m</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell data-label="Code">{createCode(offer)}</TableCell>
                    <TableCell data-label="Bars">{offer.barsAvailable}</TableCell>
                    <TableCell data-label="Grade">{offer.grade}</TableCell>
                    <TableCell data-label="Shape">{offer.shape}</TableCell>
                    <TableCell data-label="Dimensions (mm)">
                      {dimensions(offer)}
                    </TableCell>
                    <TableCell data-label="Thickness (mm)">
                      {offer.thickness}
                    </TableCell>
                    <TableCell data-label="Bars/bundle">
                      {offer.barsPerBundle}
                    </TableCell>
                    <TableCell data-label="Weight/m (kg)">
                      {offer.weightPerMeter}
                    </TableCell>
                    <TableCell data-label="Price/m">
                      {offer.pricePerMeter} {offer.currency}
                    </TableCell>
                    <TableCell
                      data-label="Notes"
                      className="text-muted-foreground"
                    >
                      {offer.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right max-md:before:hidden">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(offer.id);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingId(offer.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <OfferFormDialog
        key={String(formOpen)}
        open={formOpen}
        onOpenChange={setFormOpen}
        offerId={editingId}
        onSaved={() => {
          setFormOpen(false);
        }}
      />

      <DeleteConfirmDialog
        isOpen={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete offer?"
        description="This permanently removes the offer. This action cannot be undone."
        onConfirm={handleDeleteOffer}
      />
    </main>
  );
}
