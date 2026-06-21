import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { inquirySchema } from "@/lib/model/inquiry/Inquiry";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import parseRow from "@/lib/db/parseRow";
import setClause from "@/lib/db/setClause";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  if (!ctx.roles.some((r) => r.name === "buyer"))
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  const { id } = await params;
  let fields: Inquiry;
  try {
    fields = inquirySchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  if (fields.userId !== userId) {
    return new Response("Cannot reassign an inquiry to another user", {
      status: 403,
    });
  }
  const { set, where, values } = setClause({
    fields,
    where: { id, userId },
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
  if (!ctx.roles.some((r) => r.name === "buyer"))
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  const { id } = await params;
  const rows = await sql`
    DELETE FROM inquiry
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  if (!rows[0]) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
