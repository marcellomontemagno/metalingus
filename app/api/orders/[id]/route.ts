import { z, ZodError } from "zod";
import { and, eq } from "drizzle-orm";
import { db, txDb } from "@/lib/db/db";
import { order, orderOffer, inquiry } from "@/lib/db/schema";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { orderSchema, sanitizeOrder } from "@/lib/model/order/Order";
import type Order from "@/lib/model/order/Order";
import { orderOfferSchema } from "@/lib/model/orderOffer/OrderOffer";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { isOperator, orgId, isBuyer } = access(ctx);
  // sellers are read-only for now; operators and buyer orgs are the only writers.
  if (!isOperator && !(isBuyer && orgId))
    return new Response("Forbidden", { status: 403 });
  const { id } = await params;

  let fields: Order;
  let offerIds: string[];
  try {
    const body = await request.json();
    fields = orderSchema.parse(body);
    offerIds = z.array(z.uuid()).parse(body.offerIds ?? []);
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }

  const currentRows = await db.select().from(order).where(eq(order.id, id));
  if (!currentRows[0]) return new Response("Not found", { status: 404 });
  const current = orderSchema.parse(currentRows[0]);

  if (isOperator) {
    const currentLinks = await db
      .select({ offerId: orderOffer.offerId })
      .from(orderOffer)
      .where(eq(orderOffer.orderId, id));
    const currentOfferIds = currentLinks.map((r) => r.offerId).sort();
    const wantOfferIds = [...new Set(offerIds)].sort();

    const nonStatusChanged =
      fields.inquiryId !== current.inquiryId ||
      Number(fields.margin ?? 0) !== Number(current.margin ?? 0) ||
      (fields.notes ?? null) !== (current.notes ?? null) ||
      wantOfferIds.join(",") !== currentOfferIds.join(",");

    // the operator can move status freely, but offers/inquiry/margin/notes are
    // locked once the order leaves MATCHED.
    if (current.status !== "MATCHED" && nonStatusChanged)
      return new Response(
        "Offers, inquiry and margin can only be changed while the order is MATCHED",
        { status: 403 },
      );

    const updated = await txDb.transaction(async (tx) => {
      const [o] = await tx
        .update(order)
        .set({
          status: fields.status,
          inquiryId: fields.inquiryId,
          margin: String(fields.margin ?? 0),
          notes: fields.notes,
        })
        .where(eq(order.id, id))
        .returning();
      if (wantOfferIds.join(",") !== currentOfferIds.join(",")) {
        await tx.delete(orderOffer).where(eq(orderOffer.orderId, id));
        if (wantOfferIds.length)
          await tx
            .insert(orderOffer)
            .values(wantOfferIds.map((offerId) => ({ orderId: id, offerId })));
      }
      return o;
    });

    const links = await db.select().from(orderOffer).where(eq(orderOffer.orderId, id));
    return Response.json({
      order: [orderSchema.parse(updated)],
      orderOffer: links.map((r) => orderOfferSchema.parse(r)),
    });
  }

  // buyer path: the buyer org must own the order's inquiry, and may only approve
  // or cancel a still-MATCHED order.
  const owned = await db
    .select({ id: inquiry.id })
    .from(inquiry)
    .where(and(eq(inquiry.id, current.inquiryId), eq(inquiry.organizationId, orgId!)));
  if (!owned[0]) return new Response("Forbidden", { status: 403 });

  const allowed =
    current.status === "MATCHED" &&
    (fields.status === "APPROVED" || fields.status === "CANCELLED");
  if (!allowed)
    return new Response("Buyers can only approve or cancel a matched order", {
      status: 403,
    });

  const [updated] = await db
    .update(order)
    .set({ status: fields.status })
    .where(eq(order.id, id))
    .returning();
  const sanitized = sanitizeOrder(orderSchema.parse(updated), isOperator);
  const links = await db.select().from(orderOffer).where(eq(orderOffer.orderId, id));
  return Response.json({
    order: [sanitized],
    orderOffer: links.map((r) => orderOfferSchema.parse(r)),
  });
}
