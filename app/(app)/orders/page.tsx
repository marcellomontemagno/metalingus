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

import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store/store";
import mergeEntities from "@/lib/store/mergeEntities";
import { useAsync } from "react-async-hook";
import { getOrders } from "@/lib/api/orderApi";
import { getInquiries } from "@/lib/api/inquiryApi";
import { getOffers } from "@/lib/api/offerApi";
import createCode from "@/lib/utils/createCode";
import { formatOrderStatus, orderStatusVariant } from "@/lib/utils/format";

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
  const inquiriesMap = useStore((s) => s.entities.inquiry);
  const offersMap = useStore((s) => s.entities.offer);

  const orders = Object.values(ordersMap);
  const orderOffers = Object.values(orderOffersMap);

  const [searchQuery, setSearchQuery] = useState("");

  const rows = orders.map((order) => {
    const inquiry = inquiriesMap[order.inquiryId] ?? null;
    const offers = orderOffers
      .filter((oo) => oo.orderId === order.id)
      .map((oo) => offersMap[oo.offerId])
      .filter(Boolean);
    return {
      order,
      inquiryCode: inquiry ? createCode(inquiry) : order.inquiryId,
      offerCodes: offers.map((o) => createCode(o)),
    };
  });

  const filteredRows = rows.filter(({ order, inquiryCode, offerCodes }) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      inquiryCode,
      formatOrderStatus(order.status),
      offerCodes.join(" "),
      order.notes ?? "",
    ].some((field) => String(field).toLowerCase().includes(query));
  });

  return (
    <main className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
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
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map(({ order, inquiryCode, offerCodes }) => (
                      <TableRow key={order.id}>
                        <TableCell data-label="Inquiry">{inquiryCode}</TableCell>
                        <TableCell data-label="Status">
                          <Badge variant={orderStatusVariant(order.status)}>
                            {formatOrderStatus(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell data-label="Offers">
                          {offerCodes.length > 0 ? offerCodes.join(", ") : "—"}
                        </TableCell>
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
    </main>
  );
}
