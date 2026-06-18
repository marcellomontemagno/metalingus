import { ZodError } from "zod";
import { sql } from "@/lib/db/db";
import getAuthContext from "@/lib/auth/getAuthContext";
import { offerSchema } from "@/lib/model/offer/Offer";
import type Offer from "@/lib/model/offer/Offer";
import parseRow from "@/lib/db/parseRow";
import parseRows from "@/lib/db/parseRows";
import insertClause from "@/lib/db/insertClause";

export async function GET() {
  const ctx = await getAuthContext();
  const has = (name: string) => ctx.roles.some((r) => r.name === name);
  const userId = ctx.user.id;
  let rows: Record<string, unknown>[] = [];
  if (has("broker")) {
    rows = await sql`SELECT * FROM offer`;
  } else if (has("seller")) {
    rows = await sql`
      SELECT * FROM offer WHERE user_id = ${userId}
    `;
  }
  return Response.json({ offer: parseRows(offerSchema, rows) });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.roles.some((r) => r.name === "seller"))
    return new Response("Forbidden", { status: 403 });
  const userId = ctx.user.id;
  let fields: Offer;
  try {
    fields = offerSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues[0].message : "Invalid request body";
    return new Response(message, { status: 400 });
  }
  if (fields.userId && fields.userId !== userId) {
    return new Response("Cannot create an offer for another user", {
      status: 403,
    });
  }
  const { columns, placeholders, values } = insertClause({ ...fields, userId });
  const rows = await sql.query(
    `INSERT INTO offer (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return Response.json(
    { offer: [parseRow(offerSchema, rows[0])] },
    { status: 201 },
  );
}
