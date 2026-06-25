import { ZodError } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { inquiry, order, user } from "@/lib/db/schema";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { inquirySchema } from "@/lib/model/inquiry/Inquiry";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import { userSchema } from "@/lib/model/user/User";
import { orderSchema, sanitizeOrders } from "@/lib/model/order/Order";

export async function GET() {
  const ctx = await getAuthContext();
  const { isOperator, orgId, isBuyer } = access(ctx);
  let inquiries: Inquiry[] = [];
  if (isOperator) {
    inquiries = (await db.select().from(inquiry)).map((r) => inquirySchema.parse(r));
  } else if (isBuyer && orgId) {
    inquiries = (
      await db.select().from(inquiry).where(eq(inquiry.organizationId, orgId))
    ).map((r) => inquirySchema.parse(r));
  }
  const inquiryIds = inquiries.map((i) => i.id);

  const orderRows =
    inquiryIds.length > 0 && (isOperator || (isBuyer && orgId))
      ? await db.select().from(order).where(inArray(order.inquiryId, inquiryIds))
      : [];
  const orders = sanitizeOrders(orderRows.map((r) => orderSchema.parse(r)), isOperator);

  const userIds = [...new Set(inquiries.map((i) => i.userId))];
  const userRows = userIds.length
    ? await db.select().from(user).where(inArray(user.id, userIds))
    : [];
  return Response.json({
    inquiry: inquiries,
    user: userRows.map((r) => userSchema.parse(r)),
    order: orders,
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  const { orgId, isBuyer } = access(ctx);
  // Any member of a buyer Business can open inquiries.
  if (!orgId || !isBuyer) return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  let fields: Inquiry;
  try {
    fields = inquirySchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  const [created] = await db
    .insert(inquiry)
    .values({
      ...fields,
      width: String(fields.width),
      height: String(fields.height),
      thickness: String(fields.thickness),
      userId,
      organizationId: orgId,
    })
    .returning();
  return Response.json({ inquiry: [inquirySchema.parse(created)] }, { status: 201 });
}
