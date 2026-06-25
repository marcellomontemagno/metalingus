import { test, expect, describe, beforeEach } from "bun:test";
import { reset, makeUser } from "./helpers/db";
import { asUser } from "./helpers/ctx";
import getAuthContext from "@/lib/auth/getAuthContext";

beforeEach(reset);

describe("authentication", () => {
  test("getAuthContext resolves the signed-in user, their Business, and platform role", async () => {
    await makeUser("multi@t", ["buyer", "seller"]);
    asUser("multi@t");
    const ctx = await getAuthContext();
    expect(ctx.user.email).toBe("multi@t");
    // buyer+seller maps to a single both-type Business; no platform role.
    expect(ctx.organization?.kind).toBe("both");
    expect(ctx.platformRole).toBeNull();
  });

  test("an operator resolves with no Business and the operator platform role", async () => {
    await makeUser("op@t", ["broker"]);
    asUser("op@t");
    const ctx = await getAuthContext();
    expect(ctx.organization).toBeNull();
    expect(ctx.platformRole).toBe("operator");
  });

  test("a user with no Business resolves null org and null platform role", async () => {
    await makeUser("nobody@t", []);
    asUser("nobody@t");
    const ctx = await getAuthContext();
    expect(ctx.organization).toBeNull();
    expect(ctx.platformRole).toBeNull();
  });

  // Invite-only is now enforced by the Better Auth magicLink `disableSignUp: true`
  // option in lib/auth.ts (no auto-provisioning of unknown emails) rather than a
  // custom adapter that omits createUser.
});
