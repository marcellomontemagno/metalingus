import { ZodError } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { offer, orderOffer } from "@/lib/db/schema";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { offerSchema } from "@/lib/model/offer/Offer";
import type Offer from "@/lib/model/offer/Offer";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { orgId, isSeller } = access(ctx);
  if (!orgId || !isSeller) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  let fields: Offer;
  try {
    fields = offerSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  const linked = await db
    .select({ id: orderOffer.id })
    .from(orderOffer)
    .where(eq(orderOffer.offerId, id))
    .limit(1);
  if (linked[0])
    return new Response("Cannot modify an offer that is part of an order", {
      status: 403,
    });
  const [updated] = await db
    .update(offer)
    .set({
      barsAvailable: fields.barsAvailable,
      grade: fields.grade,
      shape: fields.shape,
      width: String(fields.width),
      height: String(fields.height),
      thickness: String(fields.thickness),
      barsPerBundle: fields.barsPerBundle,
      weightPerMeter: String(fields.weightPerMeter),
      pricePerMeter: String(fields.pricePerMeter),
      currency: fields.currency,
      notes: fields.notes,
    })
    .where(and(eq(offer.id, id), eq(offer.organizationId, orgId)))
    .returning();
  if (!updated) return new Response("Not found", { status: 404 });
  return Response.json({ offer: [offerSchema.parse(updated)] });
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await getAuthContext();
  const { orgId, isSeller } = access(ctx);
  if (!orgId || !isSeller) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const linked = await db
    .select({ id: orderOffer.id })
    .from(orderOffer)
    .where(eq(orderOffer.offerId, id))
    .limit(1);
  if (linked[0])
    return new Response("Cannot delete an offer that is part of an order", {
      status: 403,
    });
  const [deleted] = await db
    .delete(offer)
    .where(and(eq(offer.id, id), eq(offer.organizationId, orgId)))
    .returning({ id: offer.id });
  if (!deleted) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}
