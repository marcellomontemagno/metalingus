import { test, expect, describe, beforeEach } from "bun:test";
import { reset, makeUser, login, seedInquiry, seedOffer, seedOrder } from "./helpers/db";
import { asUser } from "./helpers/ctx";
import { req, params, anInquiry } from "./helpers/factories";
import { GET, POST } from "@/app/api/inquiries/route";
import { PATCH, DELETE } from "@/app/api/inquiries/[id]/route";

beforeEach(reset);

describe("inquiries: create", () => {
  test("buyer creates their own inquiry", async () => {
    const buyer = await login("buyer@t", ["buyer"]);
    const res = await POST(req("POST", anInquiry({ userId: buyer })));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.inquiry[0].barsRequested).toBe(100);
    expect(body.inquiry[0].grade).toBe("S235JR");
  });

  test("rejects an invalid quantity with 400", async () => {
    const buyer = await login("buyer@t", ["buyer"]);
    const res = await POST(req("POST", anInquiry({ userId: buyer, barsRequested: 0 })));
    expect(res.status).toBe(400);
  });

  test("a non-buyer cannot create an inquiry", async () => {
    const seller = await login("seller@t", ["seller"]);
    const res = await POST(req("POST", anInquiry({ userId: seller })));
    expect(res.status).toBe(403);
  });
});

describe("inquiries: visibility", () => {
  test("broker sees all, buyer sees only their own, seller sees none", async () => {
    const a = await makeUser("a@t", ["buyer"]);
    const b = await makeUser("b@t", ["buyer"]);
    await seedInquiry(a);
    await seedInquiry(b);

    asUser("a@t");
    expect((await (await GET()).json()).inquiry.length).toBe(1);

    await makeUser("brk@t", ["broker"]);
    asUser("brk@t");
    expect((await (await GET()).json()).inquiry.length).toBe(2);

    await makeUser("sel@t", ["seller"]);
    asUser("sel@t");
    expect((await (await GET()).json()).inquiry.length).toBe(0);
  });
});

describe("inquiries: edit & delete", () => {
  test("buyer edits their own inquiry", async () => {
    const buyer = await login("buyer@t", ["buyer"]);
    const id = await seedInquiry(buyer);
    const res = await PATCH(
      req("PATCH", anInquiry({ id, userId: buyer, barsRequested: 250 })),
      params(id),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).inquiry[0].barsRequested).toBe(250);
  });

  test("buyer deletes their own inquiry", async () => {
    const buyer = await login("buyer@t", ["buyer"]);
    const id = await seedInquiry(buyer);
    const res = await DELETE(req("DELETE"), params(id));
    expect(res.status).toBe(204);
    asUser("buyer@t");
    expect((await (await GET()).json()).inquiry.length).toBe(0);
  });

  test("cannot delete an inquiry you do not own (404)", async () => {
    const a = await makeUser("a@t", ["buyer"]);
    const id = await seedInquiry(a);
    await login("b@t", ["buyer"]);
    const res = await DELETE(req("DELETE"), params(id));
    expect(res.status).toBe(404);
  });

  test("cannot edit an inquiry from another org (404)", async () => {
    const a = await makeUser("a@t", ["buyer"]);
    const id = await seedInquiry(a);
    await login("b@t", ["buyer"]); // different Business — the org-scoped UPDATE matches nothing
    const res = await PATCH(req("PATCH", anInquiry({ id, userId: a, barsRequested: 999 })), params(id));
    expect(res.status).toBe(404);
  });

  test("cannot edit or delete an inquiry that is part of an order (frozen)", async () => {
    const broker = await makeUser("brk@t", ["broker"]);
    const seller = await makeUser("sel@t", ["seller"]);
    const buyer = await login("buyer@t", ["buyer"]);
    const inq = await seedInquiry(buyer);
    const off = await seedOffer(seller);
    await seedOrder(broker, inq, [off]);

    const edit = await PATCH(req("PATCH", anInquiry({ id: inq, userId: buyer })), params(inq));
    expect(edit.status).toBe(403);
    const del = await DELETE(req("DELETE"), params(inq));
    expect(del.status).toBe(403);
  });
});
