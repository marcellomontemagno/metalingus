import { test, expect, describe, beforeEach } from "bun:test";
import { reset, makeUser, login, seedInquiry, seedOffer, seedOrder, orgOf } from "./helpers/db";
import { asUser } from "./helpers/ctx";
import { req, anInquiry, anOffer } from "./helpers/factories";
import { GET as listInquiries, POST as createInquiry } from "@/app/api/inquiries/route";
import { POST as createOffer } from "@/app/api/offers/route";
import { GET as listOrders } from "@/app/api/orders/route";

beforeEach(reset);

describe("access-control: roles", () => {
  test("additive roles: a buyer+seller can post both inquiries and offers", async () => {
    const u = await login("multi@t", ["buyer", "seller"]);
    expect((await createInquiry(req("POST", anInquiry({ userId: u })))).status).toBe(201);
    expect((await createOffer(req("POST", anOffer({ userId: u })))).status).toBe(201);
  });

  test("a user with no roles gets empty results and cannot create", async () => {
    const u = await login("norole@t", []);
    expect((await (await listInquiries()).json()).inquiry.length).toBe(0);
    expect((await createInquiry(req("POST", anInquiry({ userId: u })))).status).toBe(403);
  });
});

describe("access-control: ownership", () => {
  test("a forged userId on create is ignored — the entity is owned by the caller", async () => {
    const me = await login("buyer@t", ["buyer"]);
    const res = await createInquiry(req("POST", anInquiry({ userId: crypto.randomUUID() })));
    expect(res.status).toBe(201);
    // server stamps ownership from the session/org, never the submitted userId.
    expect((await res.json()).inquiry[0].userId).toBe(me);
  });

  test("create stamps the entity with the caller's organization", async () => {
    const me = await login("buyer@t", ["buyer"]);
    const org = await orgOf(me);
    const res = await createInquiry(req("POST", anInquiry({ userId: me })));
    expect((await res.json()).inquiry[0].organizationId).toBe(org);
  });
});

describe("access-control: margin privacy", () => {
  test("the broker margin is visible to the broker and nulled for everyone else", async () => {
    const broker = await makeUser("brk@t", ["broker"]);
    const seller = await makeUser("sel@t", ["seller"]);
    const buyer = await makeUser("buy@t", ["buyer"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    await seedOrder(broker, inq, [off], { margin: 0.3 });

    asUser("brk@t");
    expect((await (await listOrders()).json()).order[0].margin).toBeCloseTo(0.3, 4);

    asUser("buy@t");
    expect((await (await listOrders()).json()).order[0].margin).toBeNull();
  });
});
