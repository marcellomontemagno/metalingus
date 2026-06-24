import { z, ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { orderSchema, sanitizeOrders } from "@/lib/model/order/Order";
import type Order from "@/lib/model/order/Order";
import { orderOfferSchema } from "@/lib/model/orderOffer/OrderOffer";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import insertClause from "@/lib/db/insertClause";

export async function GET() {
  const ctx = await getAuthContext();
  const { isOperator, orgId, isBuyer, isSeller } = access(ctx);
  if (!isOperator && !orgId) {
    return Response.json({ order: [], orderOffer: [] });
  }
  let orderRows: Record<string, unknown>[];
  if (isOperator) {
    orderRows = await sql`SELECT * FROM "order"`;
  } else {
    const byId = new Map<string, Record<string, unknown>>();
    if (isBuyer) {
      (
        await sql`
          SELECT * FROM "order"
          WHERE inquiry_id IN (SELECT id FROM inquiry WHERE organization_id = ${orgId})
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
            WHERE f.organization_id = ${orgId})
        `
      ).forEach((r) => byId.set(r.id as string, r));
    }
    orderRows = [...byId.values()];
  }

  let linkRows: Record<string, unknown>[];
  if (isOperator) {
    linkRows = await sql`SELECT * FROM order_offer`;
  } else {
    const byId = new Map<string, Record<string, unknown>>();
    if (isSeller) {
      (
        await sql`
          SELECT * FROM order_offer
          WHERE offer_id IN (SELECT id FROM offer WHERE organization_id = ${orgId})
        `
      ).forEach((r) => byId.set(r.id as string, r));
    }
    if (isBuyer) {
      (
        await sql`
          SELECT * FROM order_offer
          WHERE order_id IN (
            SELECT id FROM "order"
            WHERE inquiry_id IN (SELECT id FROM inquiry WHERE organization_id = ${orgId}))
        `
      ).forEach((r) => byId.set(r.id as string, r));
    }
    linkRows = [...byId.values()];
  }

  const orders = sanitizeOrders(parseRows(orderSchema, orderRows), isOperator);

  return Response.json({
    order: orders,
    orderOffer: parseRows(orderOfferSchema, linkRows),
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
  const inq = await sql`SELECT organization_id FROM inquiry WHERE id = ${fields.inquiryId}`;
  const organizationId = (inq[0]?.organization_id as string | null) ?? null;

  // operators always own the order; new orders start MATCHED regardless of input.
  const order: Order = {
    ...fields,
    status: "MATCHED",
    margin: fields.margin ?? 0,
    userId,
    organizationId,
  };
  const { columns, placeholders, values } = insertClause(order);

  // one transaction so the order and all its offer links commit atomically.
  const results = await sql.transaction([
    sql.query(
      `INSERT INTO "order" (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    ),
    ...offerIds.map((offerId) =>
      sql.query(
        `INSERT INTO order_offer (id, order_id, offer_id) VALUES ($1, $2, $3) RETURNING *`,
        [crypto.randomUUID(), order.id, offerId],
      ),
    ),
  ]);

  const [orderRows, ...linkResults] = results;
  return Response.json(
    {
      order: [parseRow(orderSchema, orderRows[0])],
      orderOffer: parseRows(orderOfferSchema, linkResults.flat()),
    },
    { status: 201 },
  );
}
