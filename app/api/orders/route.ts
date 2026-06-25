import { z, ZodError } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db, txDb } from "@/lib/db/db";
import { order, orderOffer, offer, inquiry } from "@/lib/db/schema";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { orderSchema, sanitizeOrders } from "@/lib/model/order/Order";
import type Order from "@/lib/model/order/Order";
import { orderOfferSchema } from "@/lib/model/orderOffer/OrderOffer";

export async function GET() {
  const ctx = await getAuthContext();
  const { isOperator, orgId, isBuyer, isSeller } = access(ctx);
  if (!isOperator && !orgId) {
    return Response.json({ order: [], orderOffer: [] });
  }

  let orderRows: (typeof order.$inferSelect)[];
  if (isOperator) {
    orderRows = await db.select().from(order);
  } else {
    const byId = new Map<string, typeof order.$inferSelect>();
    if (isBuyer) {
      (
        await db
          .select()
          .from(order)
          .where(
            inArray(
              order.inquiryId,
              db.select({ id: inquiry.id }).from(inquiry).where(eq(inquiry.organizationId, orgId!)),
            ),
          )
      ).forEach((r) => byId.set(r.id, r));
    }
    if (isSeller) {
      (
        await db
          .select()
          .from(order)
          .where(
            inArray(
              order.id,
              db
                .select({ id: orderOffer.orderId })
                .from(orderOffer)
                .innerJoin(offer, eq(offer.id, orderOffer.offerId))
                .where(eq(offer.organizationId, orgId!)),
            ),
          )
      ).forEach((r) => byId.set(r.id, r));
    }
    orderRows = [...byId.values()];
  }

  let linkRows: (typeof orderOffer.$inferSelect)[];
  if (isOperator) {
    linkRows = await db.select().from(orderOffer);
  } else {
    const byId = new Map<string, typeof orderOffer.$inferSelect>();
    if (isSeller) {
      (
        await db
          .select()
          .from(orderOffer)
          .where(
            inArray(
              orderOffer.offerId,
              db.select({ id: offer.id }).from(offer).where(eq(offer.organizationId, orgId!)),
            ),
          )
      ).forEach((r) => byId.set(r.id, r));
    }
    if (isBuyer) {
      (
        await db
          .select()
          .from(orderOffer)
          .where(
            inArray(
              orderOffer.orderId,
              db
                .select({ id: order.id })
                .from(order)
                .where(
                  inArray(
                    order.inquiryId,
                    db.select({ id: inquiry.id }).from(inquiry).where(eq(inquiry.organizationId, orgId!)),
                  ),
                ),
            ),
          )
      ).forEach((r) => byId.set(r.id, r));
    }
    linkRows = [...byId.values()];
  }

  const orders = sanitizeOrders(orderRows.map((r) => orderSchema.parse(r)), isOperator);
  return Response.json({
    order: orders,
    orderOffer: linkRows.map((r) => orderOfferSchema.parse(r)),
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  const { isOperator } = access(ctx);
  // Orders are broker-mediated — only platform operators create them.
  if (!isOperator) return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;

  let fields: Order;
  let offerIds: string[];
  try {
    const body = await request.json();
    fields = orderSchema.parse(body);
    offerIds = z.array(z.uuid()).min(1).parse(body.offerIds);
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }

  // the order belongs to the buyer Business it fulfills (its inquiry's org).
  const inq = await db
    .select({ organizationId: inquiry.organizationId })
    .from(inquiry)
    .where(eq(inquiry.id, fields.inquiryId));
  const organizationId = inq[0]?.organizationId ?? null;

  // one transaction so the order and all its offer links commit atomically.
  const { created, links } = await txDb.transaction(async (tx) => {
    const [created] = await tx
      .insert(order)
      .values({
        id: fields.id,
        status: "MATCHED", // new orders start MATCHED regardless of input.
        inquiryId: fields.inquiryId,
        margin: String(fields.margin ?? 0),
        notes: fields.notes,
        userId, // operators always own the order.
        organizationId,
      })
      .returning();
    const links = await tx
      .insert(orderOffer)
      .values(offerIds.map((offerId) => ({ orderId: created.id, offerId })))
      .returning();
    return { created, links };
  });

  return Response.json(
    {
      order: [orderSchema.parse(created)],
      orderOffer: links.map((r) => orderOfferSchema.parse(r)),
    },
    { status: 201 },
  );
}
