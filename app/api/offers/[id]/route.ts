import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { offerSchema } from "@/lib/model/offer/Offer";
import type Offer from "@/lib/model/offer/Offer";
import parseRow from "@/lib/db/parseRow";
import setClause from "@/lib/db/setClause";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  if (!ctx.roles.some((r) => r.name === "seller"))
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  const { id } = await params;
  let fields: Offer;
  try {
    fields = offerSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  if (fields.userId !== userId) {
    return new Response("Cannot reassign an offer to another user", {
      status: 403,
    });
  }
  const linked = await sql`SELECT 1 FROM order_offer WHERE offer_id = ${id} LIMIT 1`;
  if (linked[0])
    return new Response("Cannot modify an offer that is part of an order", {
      status: 403,
    });
  const { set, where, values } = setClause({
    fields,
    where: { id, userId },
  });
  const rows = await sql.query(
    `UPDATE offer SET ${set} WHERE ${where} RETURNING *`,
    values,
  );
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return Response.json({ offer: [parseRow(offerSchema, rows[0])] });
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  if (!ctx.roles.some((r) => r.name === "seller"))
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  const { id } = await params;
  const linked = await sql`SELECT 1 FROM order_offer WHERE offer_id = ${id} LIMIT 1`;
  if (linked[0])
    return new Response("Cannot delete an offer that is part of an order", {
      status: 403,
    });
  const rows = await sql`
    DELETE FROM offer
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
