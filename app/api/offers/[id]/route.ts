import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { offerSchema } from "@/lib/model/offer/Offer";
import type Offer from "@/lib/model/offer/Offer";
import parseRow from "@/lib/db/parseRow";
import setClause from "@/lib/db/setClause";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { orgId, isSeller, canManage } = access(ctx);
  if (!orgId || !isSeller || !canManage)
    return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  let fields: Offer;
  try {
    fields = offerSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  const linked = await sql`SELECT 1 FROM order_offer WHERE offer_id = ${id} LIMIT 1`;
  if (linked[0])
    return new Response("Cannot modify an offer that is part of an order", {
      status: 403,
    });
  const mutable: Record<string, unknown> = { ...fields };
  delete mutable.userId;
  const { set, where, values } = setClause({
    fields: mutable,
    where: { id, organizationId: orgId },
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
  const { orgId, isSeller, canManage } = access(ctx);
  if (!orgId || !isSeller || !canManage)
    return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const linked = await sql`SELECT 1 FROM order_offer WHERE offer_id = ${id} LIMIT 1`;
  if (linked[0])
    return new Response("Cannot delete an offer that is part of an order", {
      status: 403,
    });
  const rows = await sql`
    DELETE FROM offer WHERE id = ${id} AND organization_id = ${orgId} RETURNING id
  `;
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
