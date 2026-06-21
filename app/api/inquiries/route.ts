import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { inquirySchema } from "@/lib/model/inquiry/Inquiry";
import type Inquiry from "@/lib/model/inquiry/Inquiry";
import { userSchema } from "@/lib/model/user/User";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import insertClause from "@/lib/db/insertClause";

export async function GET() {
  const ctx = await getAuthContext();
  const has = (name: string) => ctx.roles.some((r) => r.name === name);
  const userId = ctx.user.id;
  let rows: Record<string, unknown>[] = [];
  if (has("broker")) {
    rows = await sql`
      SELECT * FROM inquiry
    `;
  } else if (has("buyer")) {
    rows = await sql`
      SELECT * FROM inquiry WHERE user_id = ${userId}
    `;
  }
  const inquiries = parseRows(inquirySchema, rows);
  const userIds = [...new Set(inquiries.map((i) => i.userId))];
  const userRows = userIds.length
    ? await sql`SELECT * FROM "user" WHERE id = ANY(${userIds})`
    : [];
  return Response.json({
    inquiry: inquiries,
    user: parseRows(userSchema, userRows),
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.roles.some((r) => r.name === "buyer"))
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
  if (fields.userId !== userId) {
    return new Response("Cannot create an inquiry for another user", {
      status: 403,
    });
  }
  const { columns, placeholders, values } = insertClause({ ...fields, userId });
  const rows = await sql.query(
    `INSERT INTO inquiry (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return Response.json(
    { inquiry: [parseRow(inquirySchema, rows[0])] },
    { status: 201 },
  );
}
