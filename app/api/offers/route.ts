import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { offerSchema } from "@/lib/model/offer/Offer";
import type Offer from "@/lib/model/offer/Offer";
import { userSchema } from "@/lib/model/user/User";
import { orderSchema, sanitizeOrders } from "@/lib/model/order/Order";
import { orderOfferSchema } from "@/lib/model/orderOffer/OrderOffer";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import insertClause from "@/lib/db/insertClause";

export async function GET() {
  const ctx = await getAuthContext();
  const { isOperator, orgId, isBuyer, isSeller } = access(ctx);
  let rows: Record<string, unknown>[] = [];
  if (isOperator) {
    rows = await sql`SELECT * FROM offer`;
  } else if (isSeller && orgId) {
    rows = await sql`SELECT * FROM offer WHERE organization_id = ${orgId}`;
  } else if (isBuyer && orgId) {
    // buyers only see offers linked to their own org's orders, and only at the
    // marked-up price (seller price × (1 + order margin)) — never the raw seller
    // price or the margin itself.
    rows = await sql`
      SELECT DISTINCT
        f.id, f.bars_available, f.grade, f.shape, f.width, f.height,
        f.thickness, f.bars_per_bundle, f.weight_per_meter,
        (f.price_per_meter * (1 + o.margin)) AS price_per_meter,
        f.currency, f.notes, f.user_id, f.organization_id
      FROM offer f
      JOIN order_offer oo ON oo.offer_id = f.id
      JOIN "order" o ON o.id = oo.order_id
      JOIN inquiry i ON i.id = o.inquiry_id
      WHERE i.organization_id = ${orgId}
    `;
  }
  const offers = parseRows(offerSchema, rows);
  const offerIds = offers.map((o) => o.id);

  let linkRows: Record<string, unknown>[] = [];
  let orderRows: Record<string, unknown>[] = [];
  if (offerIds.length > 0) {
    linkRows = await sql`SELECT * FROM order_offer WHERE offer_id = ANY(${offerIds})`;
    const orderIds = [...new Set(linkRows.map((r) => r.order_id as string))];
    if (orderIds.length > 0) {
      orderRows = await sql`SELECT * FROM "order" WHERE id = ANY(${orderIds})`;
    }
  }

  const orders = sanitizeOrders(parseRows(orderSchema, orderRows), isOperator);

  const userIds = [...new Set(offers.map((o) => o.userId))];
  const userRows = userIds.length
    ? await sql`SELECT * FROM "user" WHERE id = ANY(${userIds})`
    : [];
  return Response.json({
    offer: offers,
    user: parseRows(userSchema, userRows),
    order: orders,
    orderOffer: parseRows(orderOfferSchema, linkRows),
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  const { orgId, isSeller } = access(ctx);
  // Any member of a seller Business can post offers.
  if (!orgId || !isSeller)
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  let fields: Offer;
  try {
    fields = offerSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  const { columns, placeholders, values } = insertClause({
    ...fields,
    userId,
    organizationId: orgId,
  });
  const rows = await sql.query(
    `INSERT INTO offer (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return Response.json(
    { offer: [parseRow(offerSchema, rows[0])] },
    { status: 201 },
  );
}
