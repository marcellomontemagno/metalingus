import { ZodError } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { offer, orderOffer, order, inquiry, user } from "@/lib/db/schema";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { offerSchema } from "@/lib/model/offer/Offer";
import type Offer from "@/lib/model/offer/Offer";
import { userSchema } from "@/lib/model/user/User";
import { orderSchema, sanitizeOrders } from "@/lib/model/order/Order";
import { orderOfferSchema } from "@/lib/model/orderOffer/OrderOffer";

export async function GET() {
  const ctx = await getAuthContext();
  const { isOperator, orgId, isBuyer, isSeller } = access(ctx);
  let offers: Offer[] = [];
  if (isOperator) {
    offers = (await db.select().from(offer)).map((r) => offerSchema.parse(r));
  } else if (isSeller && orgId) {
    // Sell-first: a `both`-type org matches here and sees its own offers; it does
    // not fall through to the buyer branch below (its orders' marked-up offers).
    offers = (
      await db.select().from(offer).where(eq(offer.organizationId, orgId))
    ).map((r) => offerSchema.parse(r));
  } else if (isBuyer && orgId) {
    // buyers only see offers linked to their own org's orders, and only at the
    // marked-up price (seller price × (1 + order margin)) — never the raw seller
    // price or the margin itself.
    const rows = await db
      .selectDistinct({
        id: offer.id,
        barsAvailable: offer.barsAvailable,
        grade: offer.grade,
        shape: offer.shape,
        width: offer.width,
        height: offer.height,
        thickness: offer.thickness,
        barsPerBundle: offer.barsPerBundle,
        weightPerMeter: offer.weightPerMeter,
        pricePerMeter: sql<string>`${offer.pricePerMeter} * (1 + ${order.margin})`,
        currency: offer.currency,
        notes: offer.notes,
        userId: offer.userId,
        organizationId: offer.organizationId,
      })
      .from(offer)
      .innerJoin(orderOffer, eq(orderOffer.offerId, offer.id))
      .innerJoin(order, eq(order.id, orderOffer.orderId))
      .innerJoin(inquiry, eq(inquiry.id, order.inquiryId))
      .where(eq(inquiry.organizationId, orgId));
    offers = rows.map((r) => offerSchema.parse(r));
  }
  const offerIds = offers.map((o) => o.id);

  const linkRows = offerIds.length
    ? await db.select().from(orderOffer).where(inArray(orderOffer.offerId, offerIds))
    : [];
  const orderIds = [...new Set(linkRows.map((r) => r.orderId))];
  const orderRows = orderIds.length
    ? await db.select().from(order).where(inArray(order.id, orderIds))
    : [];
  const orders = sanitizeOrders(orderRows.map((r) => orderSchema.parse(r)), isOperator);

  const userIds = [...new Set(offers.map((o) => o.userId))];
  const userRows = userIds.length
    ? await db.select().from(user).where(inArray(user.id, userIds))
    : [];
  return Response.json({
    offer: offers,
    user: userRows.map((r) => userSchema.parse(r)),
    order: orders,
    orderOffer: linkRows.map((r) => orderOfferSchema.parse(r)),
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  const { orgId, isSeller } = access(ctx);
  // Any member of a seller Business can post offers.
  if (!orgId || !isSeller) return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  let fields: Offer;
  try {
    fields = offerSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  const [created] = await db
    .insert(offer)
    .values({
      ...fields,
      width: String(fields.width),
      height: String(fields.height),
      thickness: String(fields.thickness),
      weightPerMeter: String(fields.weightPerMeter),
      pricePerMeter: String(fields.pricePerMeter),
      userId,
      organizationId: orgId,
    })
    .returning();
  return Response.json({ offer: [offerSchema.parse(created)] }, { status: 201 });
}
