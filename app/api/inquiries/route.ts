import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { inquirySchema } from "@/lib/model/inquiry/Inquiry";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import { userSchema } from "@/lib/model/user/User";
import { orderSchema, sanitizeOrders } from "@/lib/model/order/Order";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import insertClause from "@/lib/db/insertClause";

export async function GET() {
  const ctx = await getAuthContext();
  const { isOperator, orgId, isBuyer } = access(ctx);
  let rows: Record<string, unknown>[] = [];
  if (isOperator) {
    rows = await sql`SELECT * FROM inquiry`;
  } else if (isBuyer && orgId) {
    rows = await sql`SELECT * FROM inquiry WHERE organization_id = ${orgId}`;
  }
  const inquiries = parseRows(inquirySchema, rows);
  const inquiryIds = inquiries.map((i) => i.id);

  let orderRows: Record<string, unknown>[] = [];
  if (inquiryIds.length > 0 && (isOperator || (isBuyer && orgId))) {
    orderRows = await sql`SELECT * FROM "order" WHERE inquiry_id = ANY(${inquiryIds})`;
  }
  const orders = sanitizeOrders(parseRows(orderSchema, orderRows), isOperator);

  const userIds = [...new Set(inquiries.map((i) => i.userId))];
  const userRows = userIds.length
    ? await sql`SELECT * FROM "user" WHERE id = ANY(${userIds})`
    : [];
  return Response.json({
    inquiry: inquiries,
    user: parseRows(userSchema, userRows),
    order: orders,
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  const { orgId, isBuyer, canManage } = access(ctx);
  // Only a buyer Business's owner/admin can open inquiries.
  if (!orgId || !isBuyer || !canManage)
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  let fields: Inquiry;
  try {
    fields = inquirySchema.parse(await request.json());
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
    `INSERT INTO inquiry (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return Response.json(
    { inquiry: [parseRow(inquirySchema, rows[0])] },
    { status: 201 },
  );
}
