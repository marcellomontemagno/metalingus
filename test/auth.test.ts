import { test, expect, describe, beforeEach } from "bun:test";
import { reset, makeUser } from "./helpers/db";
import { asUser } from "./helpers/ctx";
import getAuthContext from "@/lib/auth/getAuthContext";
import { CustomSqlAdapter } from "@/lib/auth-adapter";

beforeEach(reset);

describe("authentication", () => {
  test("getAuthContext resolves the signed-in user and all their roles", async () => {
    await makeUser("multi@t", ["buyer", "seller"]);
    asUser("multi@t");
    const ctx = await getAuthContext();
    expect(ctx.user.email).toBe("multi@t");
    expect(ctx.roles.map((r) => r.name).sort()).toEqual(["buyer", "seller"]);
  });

  test("invite-only: the auth adapter does not expose createUser", () => {
    // createUser is intentionally omitted so unknown emails can't self-provision.
    expect(CustomSqlAdapter().createUser).toBeUndefined();
  });
});
