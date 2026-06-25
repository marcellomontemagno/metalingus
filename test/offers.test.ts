import { test, expect, describe, beforeEach } from "bun:test";
import { reset, makeUser, login, seedInquiry, seedOffer, seedOrder } from "./helpers/db";
import { asUser } from "./helpers/ctx";
import { req, params, anOffer } from "./helpers/factories";
import { GET, POST } from "@/app/api/offers/route";
import { PATCH, DELETE } from "@/app/api/offers/[id]/route";

beforeEach(reset);

describe("offers: create", () => {
  test("seller creates their own offer", async () => {
    const seller = await login("seller@t", ["seller"]);
    const res = await POST(req("POST", anOffer({ userId: seller })));
    expect(res.status).toBe(201);
    expect((await res.json()).offer[0].pricePerMeter).toBeCloseTo(11.5, 4);
  });

  test("rejects a non-positive price with 400", async () => {
    const seller = await login("seller@t", ["seller"]);
    const res = await POST(req("POST", anOffer({ userId: seller, pricePerMeter: 0 })));
    expect(res.status).toBe(400);
  });

  test("a non-seller cannot create an offer", async () => {
    const buyer = await login("buyer@t", ["buyer"]);
    const res = await POST(req("POST", anOffer({ userId: buyer })));
    expect(res.status).toBe(403);
  });
});

describe("offers: visibility & price masking", () => {
  test("broker sees all offers, seller sees only their own", async () => {
    const s1 = await makeUser("s1@t", ["seller"]);
    const s2 = await makeUser("s2@t", ["seller"]);
    await seedOffer(s1);
    await seedOffer(s2);

    await makeUser("brk@t", ["broker"]);
    asUser("brk@t");
    expect((await (await GET()).json()).offer.length).toBe(2);

    asUser("s1@t");
    expect((await (await GET()).json()).offer.length).toBe(1);
  });

  test("buyer sees only offers linked to their orders, at the marked-up price", async () => {
    const broker = await makeUser("brk@t", ["broker"]);
    const seller = await makeUser("sel@t", ["seller"]);
    const buyer = await makeUser("buyer@t", ["buyer"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller, { price_per_meter: 10 });
    await seedOrder(broker, inq, [off], { margin: 0.5 });

    // an unrelated offer the buyer must NOT see
    await seedOffer(seller, { price_per_meter: 99 });

    asUser("buyer@t");
    const body = await (await GET()).json();
    expect(body.offer.length).toBe(1);
    expect(body.offer[0].pricePerMeter).toBeCloseTo(15, 4); // 10 * (1 + 0.5)
    expect(body.order[0].margin).toBeNull(); // margin never reaches the buyer
  });

  test("a both-type org is sell-first: sees its own offers, not its orders' marked-up offers", async () => {
    const both = await makeUser("both@t", ["buyer", "seller"]);
    const seller2 = await makeUser("s2@t", ["seller"]);
    const broker = await makeUser("brk@t", ["broker"]);
    const ownOffer = await seedOffer(both); // the both-org's own listing (seller view)
    const inq = await seedInquiry(both); // ...the same org also buys
    const linked = await seedOffer(seller2, { price_per_meter: 10 });
    await seedOrder(broker, inq, [linked], { margin: 0.5 });

    asUser("both@t");
    const body = await (await GET()).json();
    // isSeller short-circuits the GET, so a both-org sees only its own offer; the
    // marked-up `linked` offer (the buyer branch) is intentionally not surfaced.
    expect(body.offer.map((o: any) => o.id)).toEqual([ownOffer]);
  });
});

describe("offers: edit & delete", () => {
  test("seller edits their own offer", async () => {
    const seller = await login("seller@t", ["seller"]);
    const id = await seedOffer(seller);
    const res = await PATCH(
      req("PATCH", anOffer({ id, userId: seller, pricePerMeter: 20 })),
      params(id),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).offer[0].pricePerMeter).toBeCloseTo(20, 4);
  });

  test("cannot edit or delete an offer that is part of an order (frozen)", async () => {
    const broker = await makeUser("brk@t", ["broker"]);
    const buyer = await makeUser("buyer@t", ["buyer"]);
    const seller = await login("seller@t", ["seller"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    await seedOrder(broker, inq, [off]);

    const edit = await PATCH(req("PATCH", anOffer({ id: off, userId: seller })), params(off));
    expect(edit.status).toBe(403);
    const del = await DELETE(req("DELETE"), params(off));
    expect(del.status).toBe(403);
  });
});
