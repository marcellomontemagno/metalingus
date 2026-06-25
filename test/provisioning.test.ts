import { test, expect, describe, beforeEach } from "bun:test";
import { reset, sql } from "./helpers/db";
import { provisionBusiness, provisionOperator } from "@/lib/provisioning";

beforeEach(reset);

describe("provisioning", () => {
  test("provisionBusiness creates the owner + Business and sets its kind", async () => {
    const { userId, orgSlug } = await provisionBusiness({
      email: "owner@acme.test",
      businessName: "Acme Steel",
      type: "seller",
    });
    expect(orgSlug).toBe("acme-steel");
    const [org] = await sql`
      SELECT o.kind, m.role FROM member m JOIN organization o ON o.id = m."organizationId"
      WHERE m."userId" = ${userId}`;
    // panel-provisioning sets the business type directly (the Step-5 gap fix).
    expect(org.kind).toBe("seller");
    expect(org.role).toBe("owner");
  });

  test("provisionOperator sets the platform role and creates no Business", async () => {
    const { userId } = await provisionOperator({ email: "ops@metalingus.test" });
    const [u] = await sql`SELECT "platformRole" FROM "user" WHERE id = ${userId}`;
    expect(u.platformRole).toBe("operator");
    const members = await sql`SELECT 1 FROM member WHERE "userId" = ${userId}`;
    expect(members.length).toBe(0); // operators are platform-level — no org
  });

  test("provisioning is idempotent on the owner email (allowlist, no duplicate user)", async () => {
    const a = await provisionOperator({ email: "dup@metalingus.test" });
    const b = await provisionOperator({ email: "dup@metalingus.test" });
    expect(b.userId).toBe(a.userId);
    const users = await sql`SELECT 1 FROM "user" WHERE email = 'dup@metalingus.test'`;
    expect(users.length).toBe(1);
  });
});
