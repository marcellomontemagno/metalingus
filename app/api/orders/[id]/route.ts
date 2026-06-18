import { z, ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { orderSchema } from "@/lib/model/order/Order";
import type Order from "@/lib/model/order/Order";
import { orderOfferSchema } from "@/lib/model/orderOffer/OrderOffer";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import setClause from "@/lib/db/setClause";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const has = (name: string) => ctx.roles.some((r) => r.name === name);
  const isBroker = has("broker");
  const isBuyer = has("buyer");
  // sellers are read-only for now; brokers and buyers are the only writers.
  if (!isBroker && !isBuyer)
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
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

  const currentRows = await sql`SELECT * FROM "order" WHERE id = ${id}`;
  if (!currentRows[0]) return new Response("Not found", { status: 404 });
  const current = parseRow(orderSchema, currentRows[0]);

  if (isBroker) {
    const currentLinks = await sql`
      SELECT offer_id FROM order_offer WHERE order_id = ${id}
    `;
    const currentOfferIds = currentLinks
      .map((r) => r.offer_id as string)
      .sort();
    const wantOfferIds = [...new Set(offerIds)].sort();

    const nonStatusChanged =
      fields.inquiryId !== current.inquiryId ||
      Number(fields.margin ?? 0) !== Number(current.margin ?? 0) ||
      (fields.notes ?? null) !== (current.notes ?? null) ||
      wantOfferIds.join(",") !== currentOfferIds.join(",");

    // the broker can move status freely, but offers/inquiry/margin/notes are
    // locked once the order leaves MATCHED.
    if (current.status !== "MATCHED" && nonStatusChanged)
      return new Response(
        "Offers, inquiry and margin can only be changed while the order is MATCHED",
        { status: 403 },
      );

    const { set, where, values } = setClause({
      fields: {
        status: fields.status,
        inquiryId: fields.inquiryId,
        margin: fields.margin ?? 0,
        notes: fields.notes,
      },
      where: { id },
    });

    const queries = [
      sql.query(
        `UPDATE "order" SET ${set} WHERE ${where} RETURNING *`,
        values,
      ),
    ];
    if (wantOfferIds.join(",") !== currentOfferIds.join(",")) {
      queries.push(sql.query(`DELETE FROM order_offer WHERE order_id = $1`, [id]));
      for (const offerId of wantOfferIds)
        queries.push(
          sql.query(
            `INSERT INTO order_offer (id, order_id, offer_id) VALUES ($1, $2, $3)`,
            [crypto.randomUUID(), id, offerId],
          ),
        );
    }
    const results = await sql.transaction(queries);

    const links = await sql`SELECT * FROM order_offer WHERE order_id = ${id}`;
    return Response.json({
      order: [parseRow(orderSchema, results[0][0])],
      orderOffer: parseRows(orderOfferSchema, links),
    });
  }

  // buyer path: must own the order's inquiry, and may only approve or cancel a
  // still-MATCHED order.
  const owned = await sql`
    SELECT 1 FROM inquiry
    WHERE id = ${current.inquiryId} AND user_id = ${userId}
  `;
  if (!owned[0]) return new Response("Forbidden", { status: 403 });

  const allowed =
    current.status === "MATCHED" &&
    (fields.status === "APPROVED" || fields.status === "CANCELLED");
  if (!allowed)
    return new Response("Buyers can only approve or cancel a matched order", {
      status: 403,
    });

  const updated = await sql`
    UPDATE "order" SET status = ${fields.status} WHERE id = ${id} RETURNING *
  `;
  const order = parseRow(orderSchema, updated[0]);
  order.margin = null; // never expose the broker's markup to a buyer
  const links = await sql`SELECT * FROM order_offer WHERE order_id = ${id}`;
  return Response.json({
    order: [order],
    orderOffer: parseRows(orderOfferSchema, links),
  });
}
