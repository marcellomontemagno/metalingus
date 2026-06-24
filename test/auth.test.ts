import { test, expect, describe, beforeEach } from "bun:test";
import { reset, makeUser } from "./helpers/db";
import { asUser } from "./helpers/ctx";
import getAuthContext from "@/lib/auth/getAuthContext";

beforeEach(reset);

describe("authentication", () => {
  test("getAuthContext resolves the signed-in user and all their roles", async () => {
    await makeUser("multi@t", ["buyer", "seller"]);
    asUser("multi@t");
    const ctx = await getAuthContext();
    expect(ctx.user.email).toBe("multi@t");
    expect(ctx.roles.map((r) => r.name).sort()).toEqual(["buyer", "seller"]);
  });

  // Invite-only is now enforced by the Better Auth magicLink `disableSignUp: true`
  // option in lib/auth.ts (no auto-provisioning of unknown emails) rather than a
  // custom adapter that omits createUser.
});
