import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { inquirySchema } from "@/lib/model/inquiry/Inquiry";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import parseRow from "@/lib/db/parseRow";
import setClause from "@/lib/db/setClause";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { orgId, isBuyer, canManage } = access(ctx);
  if (!orgId || !isBuyer || !canManage)
    return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  let fields: Inquiry;
  try {
    fields = inquirySchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  const linked = await sql`SELECT 1 FROM "order" WHERE inquiry_id = ${id} LIMIT 1`;
  if (linked[0])
    return new Response("Cannot modify an inquiry that is part of an order", {
      status: 403,
    });
  // Scope the update to the org (which also prevents reassigning org); never set user_id.
  const mutable: Record<string, unknown> = { ...fields };
  delete mutable.userId;
  const { set, where, values } = setClause({
    fields: mutable,
    where: { id, organizationId: orgId },
  });
  const rows = await sql.query(
    `UPDATE inquiry SET ${set} WHERE ${where} RETURNING *`,
    values,
  );
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return Response.json({ inquiry: [parseRow(inquirySchema, rows[0])] });
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { orgId, isBuyer, canManage } = access(ctx);
  if (!orgId || !isBuyer || !canManage)
    return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const linked = await sql`SELECT 1 FROM "order" WHERE inquiry_id = ${id} LIMIT 1`;
  if (linked[0])
    return new Response("Cannot delete an inquiry that is part of an order", {
      status: 403,
    });
  const rows = await sql`
    DELETE FROM inquiry WHERE id = ${id} AND organization_id = ${orgId} RETURNING id
  `;
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
