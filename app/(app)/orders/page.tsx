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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store/store";
import mergeEntities from "@/lib/store/mergeEntities";
import { useAsync } from "react-async-hook";
import { getOrders } from "@/lib/api/orderApi";
import { getInquiries } from "@/lib/api/inquiryApi";
import { getOffers } from "@/lib/api/offerApi";
import { formatOrderStatus, orderStatusVariant, formatPrice } from "@/lib/utils/format";
import OrderFormDialog from "./OrderFormDialog";
import OrderViewDialog from "./OrderViewDialog";

export default function OrdersPage() {
  const { loading } = useAsync(async () => {
    const [orders, inquiries, offers] = await Promise.all([
      getOrders(),
      getInquiries(),
      getOffers(),
    ]);
    mergeEntities(orders);
    mergeEntities(inquiries);
    mergeEntities(offers);
  }, []);

  const ordersMap = useStore((s) => s.entities.order);
  const orderOffersMap = useStore((s) => s.entities.orderOffer);
  const offersMap = useStore((s) => s.entities.offer);
  const auth = useStore((s) => s.authContext);

  const isBroker = auth?.roles.includes("broker") ?? false;

  const orders = Object.values(ordersMap);
  const orderOffers = Object.values(orderOffersMap);

  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const rows = orders.map((order) => {
    const margin = order.margin ?? 0;
    const offers = orderOffers
      .filter((oo) => oo.orderId === order.id)
      .map((oo) => offersMap[oo.offerId])
      .filter(Boolean);
    // brokers see the raw price marked up; buyers already receive the marked-up
    // price from the API, so it is shown as-is.
    const priceText = offers
      .map((o) => {
        const price = isBroker ? o.pricePerMeter * (1 + margin) : o.pricePerMeter;
        return formatPrice(Number(price.toFixed(2)), o.currency);
      })
      .join(", ");
    return {
      order,
      offerIds: offers.map((o) => o.id),
      priceText,
    };
  });

  const filteredRows = rows.filter(({ order, offerIds, priceText }) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      order.inquiryId,
      formatOrderStatus(order.status),
      offerIds.join(" "),
      priceText,
      order.notes ?? "",
    ].some((field) => String(field).toLowerCase().includes(query));
  });

  return (
    <main className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          {isBroker && (
            <CardAction>
              <Button
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setFormOpen(true);
                }}
              >
                New order
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
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex max-w-sm items-center">
                <InputGroup>
                  <InputGroupAddon>
                    <Search className="size-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Filter orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              {filteredRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No matching orders found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inquiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Offers</TableHead>
                      <TableHead>Price</TableHead>
                      {isBroker && <TableHead>Margin</TableHead>}
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map(({ order, offerIds, priceText }) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() => setViewingId(order.id)}
                      >
                        <TableCell data-label="Inquiry" className="font-mono">
                          {order.inquiryId}
                        </TableCell>
                        <TableCell data-label="Status">
                          <Badge variant={orderStatusVariant(order.status)}>
                            {formatOrderStatus(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Offers" className="font-mono">
                          {offerIds.length > 0 ? offerIds.join(", ") : "—"}
                        </TableCell>
                        <TableCell data-label="Price">
                          {priceText || "—"}
                        </TableCell>
                        {isBroker && (
                          <TableCell data-label="Margin">
                            {((order.margin ?? 0) * 100).toFixed(1)}%
                          </TableCell>
                        )}
                        <TableCell
                          data-label="Notes"
                          className="text-muted-foreground"
                        >
                          {order.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <OrderFormDialog
        key={`${formOpen}-${editingId}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        orderId={editingId}
        onSaved={() => setFormOpen(false)}
      />

      <OrderViewDialog
        key={`view-${viewingId}`}
        open={viewingId !== null}
        onOpenChange={(o) => !o && setViewingId(null)}
        orderId={viewingId}
        onEdit={() => {
          setEditingId(viewingId);
          setViewingId(null);
          setFormOpen(true);
        }}
      />
    </main>
  );
}
