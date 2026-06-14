"use client";

import { useCallback, useEffect, useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type Offer from "@/lib/model/offer/Offer";
import OfferFormDialog from "./OfferFormDialog";
import DeleteOfferDialog from "./DeleteOfferDialog";

function dimensions(o: Offer) {
  if (o.shape === "ROUND") return `Ø${o.height}`;
  if (o.shape === "SQUARE") return `${o.width}`;
  return `${o.width} × ${o.height}`;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers");
      const data: Offer[] = await res.json();
      setOffers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(offer: Offer) {
    setEditing(offer);
    setFormOpen(true);
  }

  return (
    <main className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Offers</CardTitle>
          <CardAction>
            <Button size="sm" onClick={openNew}>
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
                {offers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell data-label="Bars">{o.barsAvailable}</TableCell>
                    <TableCell data-label="Grade">
                      <Badge variant="secondary">{o.grade}</Badge>
                    </TableCell>
                    <TableCell data-label="Shape">
                      <Badge variant="outline">{o.shape}</Badge>
                    </TableCell>
                    <TableCell data-label="Dimensions (mm)">
                      {dimensions(o)}
                    </TableCell>
                    <TableCell data-label="Thickness (mm)">
                      {o.thickness}
                    </TableCell>
                    <TableCell data-label="Bars/bundle">
                      {o.barsPerBundle}
                    </TableCell>
                    <TableCell data-label="Weight/m (kg)">
                      {o.weightPerMeter}
                    </TableCell>
                    <TableCell data-label="Price/m">
                      {o.pricePerMeter} {o.currency}
                    </TableCell>
                    <TableCell
                      data-label="Notes"
                      className="text-muted-foreground"
                    >
                      {o.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right max-md:before:hidden">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(o)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleting(o)}
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
        open={formOpen}
        onOpenChange={setFormOpen}
        offer={editing}
        onSaved={() => {
          setFormOpen(false);
          loadOffers();
        }}
      />

      <DeleteOfferDialog
        offer={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          loadOffers();
        }}
      />
    </main>
  );
}
