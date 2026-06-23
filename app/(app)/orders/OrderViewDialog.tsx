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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EnumCombobox from "@/components/EnumCombobox";
import { produce } from "immer";
import { useStore, setStore } from "@/lib/store/store";
import useAuthContext from "@/lib/store/useAuthContext";
import mergeEntities from "@/lib/store/mergeEntities";
import { updateOrderApi } from "@/lib/api/orderApi";
import { orderStatusSchema } from "@/lib/model/OrderStatus";
import type OrderStatus from "@/lib/model/OrderStatus";
import {
  formatOrderStatus,
  orderStatusVariant,
  formatPrice,
  formatDimensions,
  formatDeliveryDate,
} from "@/lib/utils/format";
import createCode from "@/lib/utils/createCode";

export default function OrderViewDialog({
  open,
  onOpenChange,
  orderId,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onEdit: () => void;
}) {
  const order = useStore((s) => (orderId ? s.entities.order[orderId] : null));
  const offersMap = useStore((s) => s.entities.offer);
  const orderOffersMap = useStore((s) => s.entities.orderOffer);
  const inquiriesMap = useStore((s) => s.entities.inquiry);
  const usersMap = useStore((s) => s.entities.user);
  const auth = useAuthContext();

  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "MATCHED");

  if (!order) return null;

  const has = (r: string) => auth.roles.includes(r);
  const isBroker = has("broker");
  const isBuyer = has("buyer") && !isBroker;

  const links = Object.values(orderOffersMap).filter(
    (oo) => oo.orderId === order.id,
  );
  const offerIds = links.map((oo) => oo.offerId);
  const linkedOffers = offerIds.map((id) => offersMap[id]).filter(Boolean);
  const inquiry = inquiriesMap[order.inquiryId];
  const margin = order.margin ?? 0;

  async function applyStatus(next: OrderStatus) {
    const payload = { ...order!, status: next };
    setStore(
      produce((draft) => {
        const o = draft.entities.order[payload.id];
        if (o) o.status = next;
      }),
    );
    onOpenChange(false);
    const saved = await updateOrderApi(payload, offerIds);
    mergeEntities(saved);
  }

  const canEdit = isBroker && order.status === "MATCHED";
  const buyerCanAct = isBuyer && order.status === "MATCHED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <Label>ID</Label>
            <span className="font-mono">{order.id}</span>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Status</Label>
            <span>
              <Badge variant={orderStatusVariant(order.status)}>
                {formatOrderStatus(order.status)}
              </Badge>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Inquiry</Label>
            {!inquiry ? (
              <span className="font-mono">{order.inquiryId}</span>
            ) : (
              <div className="flex flex-col gap-1.5 rounded-md border p-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {inquiry.id}
                </span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-mono">{createCode(inquiry)}</span>
                  {isBroker && (
                    <>
                      <span className="text-muted-foreground">Owner</span>
                      <span>{usersMap[inquiry.userId]?.email ?? "—"}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Bars requested</span>
                  <span>{inquiry.barsRequested}</span>
                  <span className="text-muted-foreground">Grade</span>
                  <span>{inquiry.grade}</span>
                  <span className="text-muted-foreground">Shape</span>
                  <span>{inquiry.shape}</span>
                  <span className="text-muted-foreground">Dimensions (mm)</span>
                  <span>{formatDimensions(inquiry)}</span>
                  <span className="text-muted-foreground">Thickness (mm)</span>
                  <span>{inquiry.thickness}</span>
                  <span className="text-muted-foreground">Latest delivery</span>
                  <span>{formatDeliveryDate(inquiry.latestDeliveryDate)}</span>
                  <span className="text-muted-foreground">Notes</span>
                  <span>{inquiry.notes ?? "—"}</span>
                </div>
              </div>
            )}
          </div>

          {isBroker && (
            <div className="flex flex-col gap-1">
              <Label>Margin</Label>
              <span>{(margin * 100).toFixed(2)}%</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Label>Offers</Label>
            {linkedOffers.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <div className="flex flex-col gap-2">
                {linkedOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex flex-col gap-1.5 rounded-md border p-2"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {offer.id}
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Code</span>
                      <span className="font-mono">{createCode(offer)}</span>
                      {isBroker && (
                        <>
                          <span className="text-muted-foreground">Owner</span>
                          <span>{usersMap[offer.userId]?.email ?? "—"}</span>
                        </>
                      )}
                      <span className="text-muted-foreground">
                        Bars available
                      </span>
                      <span>{offer.barsAvailable}</span>
                      <span className="text-muted-foreground">Bars/bundle</span>
                      <span>{offer.barsPerBundle}</span>
                      <span className="text-muted-foreground">
                        Weight/m (kg)
                      </span>
                      <span>{offer.weightPerMeter}</span>
                      <span className="text-muted-foreground">Price/m</span>
                      <span>
                        {isBroker
                          ? `${formatPrice(offer.pricePerMeter, offer.currency)}/m → ${formatPrice(
                            Number(
                              (offer.pricePerMeter * (1 + margin)).toFixed(2),
                            ),
                            offer.currency,
                          )}/m`
                          : `${formatPrice(offer.pricePerMeter, offer.currency)}/m`}
                      </span>
                      <span className="text-muted-foreground">Grade</span>
                      <span>{offer.grade}</span>
                      <span className="text-muted-foreground">Shape</span>
                      <span>{offer.shape}</span>
                      <span className="text-muted-foreground">
                        Dimensions (mm)
                      </span>
                      <span>{formatDimensions(offer)}</span>
                      <span className="text-muted-foreground">
                        Thickness (mm)
                      </span>
                      <span>{offer.thickness}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Notes</Label>
            <span className="text-muted-foreground">{order.notes ?? "—"}</span>
          </div>

          {isBroker && (
            <div className="flex flex-col gap-1.5">
              <Label>Set status</Label>
              <EnumCombobox
                options={[...orderStatusSchema.options]}
                value={status}
                onValueChange={(v) => setStatus(v as OrderStatus)}
                placeholder="Select status"
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          {canEdit && (
            <Button type="button" variant="secondary" onClick={onEdit}>
              Edit
            </Button>
          )}

          {isBroker && (
            <Button
              type="button"
              disabled={status === order.status}
              onClick={() => applyStatus(status)}
            >
              Save status
            </Button>
          )}

          {buyerCanAct && (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => applyStatus("CANCELLED")}
              >
                Cancel order
              </Button>
              <Button type="button" onClick={() => applyStatus("APPROVED")}>
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
