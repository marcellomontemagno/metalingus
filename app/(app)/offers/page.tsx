"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
import { Badge } from "@/components/ui/badge";
import { produce } from "immer";
import { useStore, setStore } from "@/lib/store/store";
import mergeEntities from "@/lib/store/mergeEntities";
import useAuthContext from "@/lib/store/useAuthContext";
import { useAsync } from "react-async-hook";
import { getOffers, deleteOfferApi } from "@/lib/api/offerApi";
import OfferFormDialog from "./OfferFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import createCode from "@/lib/utils/createCode";
import { formatDimensions, formatPrice, formatOrderStatus, orderStatusVariant } from "@/lib/utils/format";

export default function OffersPage() {
  const { loading } = useAsync(getOffers, [], {
    onSuccess: (data) => mergeEntities(data),
  });

  const auth = useAuthContext();
  const offersMap = useStore((s) => s.entities.offer);
  const offers = Object.values(offersMap);
  const ordersMap = useStore((s) => s.entities.order);
  const orderOffersMap = useStore((s) => s.entities.orderOffer);
  const usersMap = useStore((s) => s.entities.user);

  // Pre-index orders by offer ID
  const ordersByOfferId = new Map<string, typeof ordersMap[string][]>();
  Object.values(orderOffersMap).forEach((oo) => {
    const order = ordersMap[oo.orderId];
    if (order) {
      const list = ordersByOfferId.get(oo.offerId) ?? [];
      list.push(order);
      ordersByOfferId.set(oo.offerId, list);
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredOffers = offers.filter((offer) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const linkedOrders = ordersByOfferId.get(offer.id) ?? [];
    const orderStatusesStr = linkedOrders.map((o) => formatOrderStatus(o.status)).join(" ");
    const orderIdsStr = linkedOrders.map((o) => o.id).join(" ");

    return [
      offer.id,
      createCode(offer),
      offer.barsAvailable,
      offer.grade,
      offer.shape,
      formatDimensions(offer),
      offer.thickness,
      offer.barsPerBundle,
      offer.weightPerMeter,
      formatPrice(offer.pricePerMeter, offer.currency),
      offer.notes ?? "",
      usersMap[offer.userId]?.email ?? "",
      orderStatusesStr,
      orderIdsStr,
    ].some((field) => String(field).toLowerCase().includes(query));
  });

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
          {auth.roles.includes("seller") && (
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
          )}
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
            <div className="space-y-4">
              <div className="flex max-w-sm items-center">
                <InputGroup>
                  <InputGroupAddon>
                    <Search className="size-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Filter offers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              {filteredOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No matching offers found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Orders</TableHead>
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
                    {filteredOffers.map((offer) => {
                      const linkedOrders = ordersByOfferId.get(offer.id) ?? [];
                      return (
                        <TableRow key={offer.id}>
                          <TableCell data-label="ID">{offer.id}</TableCell>
                          <TableCell data-label="Code">{createCode(offer)}</TableCell>
                          <TableCell
                            data-label="Owner"
                            className="text-muted-foreground"
                          >
                            {usersMap[offer.userId]?.email ?? "—"}
                          </TableCell>
                          <TableCell data-label="Orders">
                            <div className="flex flex-col gap-1.5">
                              {linkedOrders.length > 0 ? (
                                linkedOrders.map((order) => (
                                  <div key={order.id} className="flex items-center gap-2">
                                    <Badge variant={orderStatusVariant(order.status)}>
                                      {formatOrderStatus(order.status)}
                                    </Badge>
                                    <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-label="Bars">{offer.barsAvailable}</TableCell>
                          <TableCell data-label="Grade">{offer.grade}</TableCell>
                          <TableCell data-label="Shape">{offer.shape}</TableCell>
                          <TableCell data-label="Dimensions (mm)">
                            {formatDimensions(offer)}
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
                            {formatPrice(offer.pricePerMeter, offer.currency)}
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
                                disabled={auth.userId !== offer.userId}
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
                                disabled={auth.userId !== offer.userId}
                                onClick={() => setDeletingId(offer.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
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
