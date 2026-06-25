import { ZodError } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { inquiry, order } from "@/lib/db/schema";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { inquirySchema } from "@/lib/model/inquiry/Inquiry";
import type Inquiry from "@/lib/model/inquiry/Inquiry";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { orgId, isBuyer } = access(ctx);
  if (!orgId || !isBuyer) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  let fields: Inquiry;
  try {
    fields = inquirySchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  const linked = await db
    .select({ id: order.id })
    .from(order)
    .where(eq(order.inquiryId, id))
    .limit(1);
  if (linked[0])
    return new Response("Cannot modify an inquiry that is part of an order", {
      status: 403,
    });
  // Scope the update to the org (also blocks reassigning org); never touch user_id.
  const [updated] = await db
    .update(inquiry)
    .set({
      barsRequested: fields.barsRequested,
      latestDeliveryDate: fields.latestDeliveryDate,
      grade: fields.grade,
      shape: fields.shape,
      width: String(fields.width),
      height: String(fields.height),
      thickness: String(fields.thickness),
      notes: fields.notes,
    })
    .where(and(eq(inquiry.id, id), eq(inquiry.organizationId, orgId)))
    .returning();
  if (!updated) return new Response("Not found", { status: 404 });
  return Response.json({ inquiry: [inquirySchema.parse(updated)] });
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { orgId, isBuyer } = access(ctx);
  if (!orgId || !isBuyer) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const linked = await db
    .select({ id: order.id })
    .from(order)
    .where(eq(order.inquiryId, id))
    .limit(1);
  if (linked[0])
    return new Response("Cannot delete an inquiry that is part of an order", {
      status: 403,
    });
  const [deleted] = await db
    .delete(inquiry)
    .where(and(eq(inquiry.id, id), eq(inquiry.organizationId, orgId)))
    .returning({ id: inquiry.id });
  if (!deleted) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
