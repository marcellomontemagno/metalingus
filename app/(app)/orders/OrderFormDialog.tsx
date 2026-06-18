"use client";

import { useState } from "react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import EnumCombobox from "@/components/EnumCombobox";
import { produce } from "immer";
import { useStore, setStore } from "@/lib/store/store";
import mergeEntities from "@/lib/store/mergeEntities";
import { createOrderApi, updateOrderApi } from "@/lib/api/orderApi";
import { orderSchema } from "@/lib/model/order/Order";
import type Order from "@/lib/model/order/Order";
import type OrderOffer from "@/lib/model/orderOffer/OrderOffer";
import { formatPrice } from "@/lib/utils/format";

// drops every order_offer row for an order, so we can replace the set without
// leaving stale links behind (mergeEntities only upserts, never deletes).
function clearLinks(orderOffer: Record<string, OrderOffer>, orderId: string) {
  for (const oo of Object.values(orderOffer))
    if (oo.orderId === orderId) delete orderOffer[oo.id];
}

export default function OrderFormDialog({
  open,
  onOpenChange,
  orderId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string | null;
  onSaved: () => void;
}) {
  const order = useStore((s) => (orderId ? s.entities.order[orderId] : null));
  const inquiriesMap = useStore((s) => s.entities.inquiry);
  const offersMap = useStore((s) => s.entities.offer);
  const orderOffersMap = useStore((s) => s.entities.orderOffer);

  const inquiryIds = Object.keys(inquiriesMap);
  const offers = Object.values(offersMap);

  const initialOfferIds = order
    ? Object.values(orderOffersMap)
        .filter((oo) => oo.orderId === order.id)
        .map((oo) => oo.offerId)
    : [];

  const [inquiryId, setInquiryId] = useState(order?.inquiryId ?? "");
  const [marginPercent, setMarginPercent] = useState(
    String((order?.margin ?? 0) * 100),
  );
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [offerIds, setOfferIds] = useState<string[]>(initialOfferIds);
  const [errors, setErrors] = useState<{
    inquiryId?: string;
    margin?: string;
    offers?: string;
  }>({});

  const margin = Number(marginPercent) / 100;
  const marginValid = Number.isFinite(margin) && margin >= 0;

  const toggleOffer = (id: string) => {
    setErrors((e) => ({ ...e, offers: undefined }));
    setOfferIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!inquiryId) nextErrors.inquiryId = "Select an inquiry";
    if (!marginValid) nextErrors.margin = "Margin must be 0 or more";
    if (offerIds.length === 0) nextErrors.offers = "Select at least one offer";

    const payload: Order = {
      id: order?.id ?? crypto.randomUUID(),
      status: order?.status ?? "MATCHED",
      inquiryId,
      margin,
      notes: notes || null,
      userId: order?.userId ?? null,
    };

    const result = orderSchema.safeParse(payload);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if ((key === "inquiryId" || key === "margin") && !nextErrors[key])
          nextErrors[key] = issue.message;
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    // optimistic: write the order and its links immediately, then close.
    setStore(
      produce((draft) => {
        draft.entities.order[payload.id] = payload;
        clearLinks(draft.entities.orderOffer, payload.id);
        for (const offerId of offerIds) {
          const lid = crypto.randomUUID();
          draft.entities.orderOffer[lid] = { id: lid, orderId: payload.id, offerId };
        }
      }),
    );

    onSaved();

    const saved = order
      ? await updateOrderApi(payload, offerIds)
      : await createOrderApi(payload, offerIds);

    // swap the optimistic links for the canonical ones the server returned.
    setStore(produce((draft) => clearLinks(draft.entities.orderOffer, payload.id)));
    mergeEntities(saved);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{orderId ? "Edit order" : "New order"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="contents">
          <DialogBody className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Inquiry</Label>
              <EnumCombobox
                options={inquiryIds}
                value={inquiryId || null}
                onValueChange={(v) => {
                  setErrors((e) => ({ ...e, inquiryId: undefined }));
                  setInquiryId(v);
                }}
                placeholder="Select inquiry"
              />
              <FieldError>{errors.inquiryId}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Offers</Label>
              <div className="flex max-h-48 flex-col gap-2 overflow-auto rounded-md border p-2">
                {offers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No offers available.</p>
                ) : (
                  offers.map((offer) => (
                    <label
                      key={offer.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={offerIds.includes(offer.id)}
                        onCheckedChange={() => toggleOffer(offer.id)}
                      />
                      <span className="font-mono">{offer.id}</span>
                      <span className="ml-auto text-muted-foreground">
                        {formatPrice(offer.pricePerMeter, offer.currency)}/m
                      </span>
                    </label>
                  ))
                )}
              </div>
              <FieldError>{errors.offers}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="margin">Margin (%)</Label>
              <Input
                id="margin"
                type="number"
                step="0.1"
                value={marginPercent}
                onChange={(e) => {
                  setErrors((err) => ({ ...err, margin: undefined }));
                  setMarginPercent(e.target.value);
                }}
              />
              <FieldError>{errors.margin}</FieldError>
            </div>

            {offerIds.length > 0 && marginValid && (
              <div className="flex flex-col gap-1 rounded-md border p-2 text-sm">
                <span className="font-medium">Buyer price preview</span>
                {offerIds.map((id) => {
                  const offer = offersMap[id];
                  if (!offer) return null;
                  const buyer = offer.pricePerMeter * (1 + margin);
                  return (
                    <div key={id} className="flex justify-between gap-2">
                      <span className="font-mono">{id}</span>
                      <span className="text-muted-foreground">
                        {formatPrice(offer.pricePerMeter, offer.currency)}/m →{" "}
                        {formatPrice(
                          Number(buyer.toFixed(2)),
                          offer.currency,
                        )}
                        /m
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
