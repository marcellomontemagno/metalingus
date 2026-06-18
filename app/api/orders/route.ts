import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { orderSchema } from "@/lib/model/order/Order";
import { orderOfferSchema } from "@/lib/model/orderOffer/OrderOffer";
import parseRows from "@/lib/db/parseRows";

export async function GET() {
  const ctx = await getAuthContext();
  const has = (name: string) => ctx.roles.some((r) => r.name === name);
  const isBroker = has("broker");
  const isBuyer = has("buyer");
  const isSeller = has("seller");
  const userId = ctx.user.id;
  if (!isBroker && !isBuyer && !isSeller) {
    return Response.json({ order: [], orderOffer: [] });
  }
  let orderRows: Record<string, unknown>[];
  if (isBroker) {
    orderRows = await sql`SELECT * FROM "order"`;
  } else {
    const byId = new Map<string, Record<string, unknown>>();
    if (isBuyer) {
      (
        await sql`
          SELECT * FROM "order"
          WHERE inquiry_id IN (SELECT id FROM inquiry WHERE user_id = ${userId})
        `
      ).forEach((r) => byId.set(r.id as string, r));
    }
    if (isSeller) {
      (
        await sql`
          SELECT * FROM "order"
          WHERE id IN (
            SELECT oo.order_id FROM order_offer oo
            JOIN offer f ON f.id = oo.offer_id
            WHERE f.user_id = ${userId})
        `
      ).forEach((r) => byId.set(r.id as string, r));
    }
    orderRows = [...byId.values()];
  }

  let linkRows: Record<string, unknown>[];
  if (isBroker) {
    linkRows = await sql`SELECT * FROM order_offer`;
  } else {
    const byId = new Map<string, Record<string, unknown>>();
    if (isSeller) {
      (
        await sql`
          SELECT * FROM order_offer
          WHERE offer_id IN (SELECT id FROM offer WHERE user_id = ${userId})
        `
      ).forEach((r) => byId.set(r.id as string, r));
    }
    if (isBuyer) {
      (
        await sql`
          SELECT * FROM order_offer
          WHERE order_id IN (
            SELECT id FROM "order"
            WHERE inquiry_id IN (SELECT id FROM inquiry WHERE user_id = ${userId}))
        `
      ).forEach((r) => byId.set(r.id as string, r));
    }
    linkRows = [...byId.values()];
  }

  return Response.json({
    order: parseRows(orderSchema, orderRows),
    orderOffer: parseRows(orderOfferSchema, linkRows),
  });
}
