// In-process Postgres (pglite) wearing the @neondatabase/serverless interface, so
// the real route handlers run unmodified against it. Better Auth owns the `user`
// table in production; the harness creates a compatible one before the app schema.
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";
import { asUser } from "./ctx";

const pg = new PGlite(); // in-memory; one per test process

// Drizzle over the same pglite — what the handlers' `db`/`txDb` resolve to in tests.
export const db = drizzle(pg, { schema });

// Build the schema by applying the Drizzle migrations (the single schema source) —
// drizzle's own migrator handles statement-breakpoints, ordering, and tracking.
await migrate(db, { migrationsFolder: "drizzle" });

function makeQuery(text: string, params: unknown[]) {
  const run = () => pg.query(text, params).then((r) => r.rows);
  return {
    text,
    params,
    then: (res: any, rej: any) => run().then(res, rej),
    catch: (rej: any) => run().catch(rej),
    finally: (f: any) => run().finally(f),
  };
}

export const sql: any = Object.assign(
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) text += `$${i + 1}` + strings[i + 1];
    return makeQuery(text, values);
  },
  {
    query: (text: string, params: unknown[] = []) => makeQuery(text, params),
    transaction: async (queries: { text: string; params: unknown[] }[]) =>
      pg.transaction(async (tx) => {
        const out: unknown[][] = [];
        for (const q of queries) out.push((await tx.query(q.text, q.params)).rows);
        return out;
      }),
  },
);

// Clear all data between tests.
export async function reset() {
  await pg.exec(
    `TRUNCATE order_offer, "order", offer, inquiry, member, organization, "user" RESTART IDENTITY CASCADE;`,
  );
}

// Create a Better Auth-shaped user. `roles` is the buyer/seller/broker designation,
// mapped onto Phase-3 structure: buyer/seller → owner of a Business of that `kind`;
// broker → platform operator.
export async function makeUser(email: string, roles: string[] = []): Promise<string> {
  const id = crypto.randomUUID();
  await sql`INSERT INTO "user" (id, name, email, "emailVerified") VALUES (${id}, ${email}, ${email}, true)`;
  if (roles.includes("broker"))
    await sql`UPDATE "user" SET "platformRole" = 'operator' WHERE id = ${id}`;
  const isBuyer = roles.includes("buyer");
  const isSeller = roles.includes("seller");
  if (isBuyer || isSeller) {
    const kind = isBuyer && isSeller ? "both" : isBuyer ? "buyer" : "seller";
    const orgId = crypto.randomUUID();
    await sql`INSERT INTO organization (id, name, slug, kind, "createdAt") VALUES (${orgId}, ${email}, ${email}, ${kind}, now())`;
    await sql`INSERT INTO member (id, "organizationId", "userId", role, "createdAt") VALUES (${crypto.randomUUID()}, ${orgId}, ${id}, 'owner', now())`;
  }
  return id;
}

// The org a user owns/belongs to — used to stamp seeded entities with their org.
export async function orgOf(userId: string): Promise<string | null> {
  const rows = await sql`SELECT "organizationId" AS org FROM member WHERE "userId" = ${userId} LIMIT 1`;
  return (rows[0]?.org as string) ?? null;
}

// makeUser + set the session to that email.
export async function login(email: string, roles: string[] = []): Promise<string> {
  const id = await makeUser(email, roles);
  asUser(email);
  return id;
}

export async function seedInquiry(userId: string, over: Record<string, any> = {}): Promise<string> {
  const v = { bars_requested: 100, latest_delivery_date: null, grade: "S235JR", shape: "SQUARE", width: 50, height: 50, thickness: 5, notes: null, organization_id: await orgOf(userId), ...over };
  const rows = await sql`INSERT INTO inquiry (bars_requested, latest_delivery_date, grade, shape, width, height, thickness, notes, user_id, organization_id)
    VALUES (${v.bars_requested}, ${v.latest_delivery_date}, ${v.grade}, ${v.shape}, ${v.width}, ${v.height}, ${v.thickness}, ${v.notes}, ${userId}, ${v.organization_id}) RETURNING id`;
  return rows[0].id as string;
}

export async function seedOffer(userId: string, over: Record<string, any> = {}): Promise<string> {
  const v = { bars_available: 120, grade: "S235JR", shape: "SQUARE", width: 50, height: 50, thickness: 5, bars_per_bundle: 25, weight_per_meter: 6.97, price_per_meter: 11.5, currency: "EUR", notes: null, organization_id: await orgOf(userId), ...over };
  const rows = await sql`INSERT INTO offer (bars_available, grade, shape, width, height, thickness, bars_per_bundle, weight_per_meter, price_per_meter, currency, notes, user_id, organization_id)
    VALUES (${v.bars_available}, ${v.grade}, ${v.shape}, ${v.width}, ${v.height}, ${v.thickness}, ${v.bars_per_bundle}, ${v.weight_per_meter}, ${v.price_per_meter}, ${v.currency}, ${v.notes}, ${userId}, ${v.organization_id}) RETURNING id`;
  return rows[0].id as string;
}

export async function seedOrder(
  brokerId: string,
  inquiryId: string,
  offerIds: string[],
  { status = "MATCHED", margin = 0 }: { status?: string; margin?: number } = {},
): Promise<string> {
  const inq = await sql`SELECT organization_id AS org FROM inquiry WHERE id = ${inquiryId}`;
  const orgId = (inq[0]?.org as string) ?? null;
  const rows = await sql`INSERT INTO "order" (status, inquiry_id, margin, user_id, organization_id)
    VALUES (${status}, ${inquiryId}, ${margin}, ${brokerId}, ${orgId}) RETURNING id`;
  const orderId = rows[0].id as string;
  for (const offerId of offerIds)
    await sql`INSERT INTO order_offer (id, order_id, offer_id) VALUES (${crypto.randomUUID()}, ${orderId}, ${offerId})`;
  return orderId;
}
