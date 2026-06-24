import { test, expect, describe, beforeEach } from "bun:test";
import { reset, makeUser, login, seedInquiry, seedOffer, seedOrder } from "./helpers/db";
import { asUser } from "./helpers/ctx";
import { req, params, anOrderBody } from "./helpers/factories";
import { GET, POST } from "@/app/api/orders/route";
import { PATCH } from "@/app/api/orders/[id]/route";

beforeEach(reset);

describe("orders: create (matching)", () => {
  test("broker matches an inquiry to an offer, atomically", async () => {
    const buyer = await makeUser("buyer@t", ["buyer"]);
    const seller = await makeUser("seller@t", ["seller"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    await login("brk@t", ["broker"]);

    const res = await POST(req("POST", anOrderBody({ inquiryId: inq, offerIds: [off], margin: 0.1 })));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.order[0].status).toBe("MATCHED");
    expect(body.order[0].margin).toBeCloseTo(0.1, 4);
    expect(body.orderOffer.length).toBe(1);
  });

  test("an order requires at least one offer", async () => {
    const buyer = await makeUser("buyer@t", ["buyer"]);
    const inq = await seedInquiry(buyer);
    await login("brk@t", ["broker"]);
    const res = await POST(req("POST", anOrderBody({ inquiryId: inq, offerIds: [] })));
    expect(res.status).toBe(400);
  });

  test("a non-broker cannot create an order", async () => {
    const buyer = await login("buyer@t", ["buyer"]);
    const inq = await seedInquiry(buyer);
    const res = await POST(req("POST", anOrderBody({ inquiryId: inq, offerIds: [crypto.randomUUID()] })));
    expect(res.status).toBe(403);
  });
});

describe("orders: visibility & margin privacy", () => {
  test("broker sees all with margin; buyer/seller see their own with margin nulled; others see none", async () => {
    const broker = await makeUser("brk@t", ["broker"]);
    const seller = await makeUser("sel@t", ["seller"]);
    const buyer = await makeUser("buy@t", ["buyer"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    await seedOrder(broker, inq, [off], { margin: 0.2 });

    asUser("brk@t");
    let body = await (await GET()).json();
    expect(body.order.length).toBe(1);
    expect(body.order[0].margin).toBeCloseTo(0.2, 4);

    asUser("buy@t");
    body = await (await GET()).json();
    expect(body.order.length).toBe(1);
    expect(body.order[0].margin).toBeNull();

    asUser("sel@t");
    body = await (await GET()).json();
    expect(body.order.length).toBe(1);
    expect(body.order[0].margin).toBeNull();

    await makeUser("other@t", ["buyer"]);
    asUser("other@t");
    body = await (await GET()).json();
    expect(body.order.length).toBe(0);
  });
});

describe("orders: status transitions", () => {
  test("broker may change status while the order is MATCHED", async () => {
    const buyer = await makeUser("buy@t", ["buyer"]);
    const seller = await makeUser("sel@t", ["seller"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    const broker = await login("brk@t", ["broker"]);
    const order = await seedOrder(broker, inq, [off], { margin: 0.1 });

    const res = await PATCH(
      req("PATCH", anOrderBody({ status: "APPROVED", inquiryId: inq, margin: 0.1, offerIds: [off] })),
      params(order),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).order[0].status).toBe("APPROVED");
  });

  test("broker cannot change margin/offers once the order has left MATCHED", async () => {
    const buyer = await makeUser("buy@t", ["buyer"]);
    const seller = await makeUser("sel@t", ["seller"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    const broker = await login("brk@t", ["broker"]);
    const order = await seedOrder(broker, inq, [off], { status: "APPROVED", margin: 0.1 });

    const res = await PATCH(
      req("PATCH", anOrderBody({ status: "APPROVED", inquiryId: inq, margin: 0.2, offerIds: [off] })),
      params(order),
    );
    expect(res.status).toBe(403);
  });

  test("owning buyer may approve a matched order but not advance it further", async () => {
    const seller = await makeUser("sel@t", ["seller"]);
    const broker = await makeUser("brk@t", ["broker"]);
    const buyer = await login("buy@t", ["buyer"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    const order = await seedOrder(broker, inq, [off]);

    const ok = await PATCH(req("PATCH", anOrderBody({ status: "APPROVED", inquiryId: inq, margin: null })), params(order));
    expect(ok.status).toBe(200);

    const order2 = await seedOrder(broker, inq, [off]);
    const blocked = await PATCH(req("PATCH", anOrderBody({ status: "PAID", inquiryId: inq, margin: null })), params(order2));
    expect(blocked.status).toBe(403);
  });

  test("a seller is read-only on orders", async () => {
    const buyer = await makeUser("buy@t", ["buyer"]);
    const broker = await makeUser("brk@t", ["broker"]);
    const seller = await login("sel@t", ["seller"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    const order = await seedOrder(broker, inq, [off]);

    const res = await PATCH(req("PATCH", anOrderBody({ status: "APPROVED", inquiryId: inq, margin: null })), params(order));
    expect(res.status).toBe(403);
  });
});
