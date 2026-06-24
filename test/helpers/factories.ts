// Request + body builders for route-handler tests.
export const req = (method: string, body?: unknown) =>
  new Request("http://test.local/api", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

// Params arg shape for [id] route handlers ({ params: Promise<{ id }> }).
export const params = (id: string) => ({ params: Promise.resolve({ id }) });

export const anInquiry = (over: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  barsRequested: 100,
  latestDeliveryDate: null,
  grade: "S235JR",
  shape: "SQUARE",
  width: 50,
  height: 50,
  thickness: 5,
  notes: null,
  ...over,
});

export const anOffer = (over: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  barsAvailable: 120,
  grade: "S235JR",
  shape: "SQUARE",
  width: 50,
  height: 50,
  thickness: 5,
  barsPerBundle: 25,
  weightPerMeter: 6.97,
  pricePerMeter: 11.5,
  currency: "EUR",
  notes: null,
  ...over,
});

export const anOrderBody = (over: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  status: "MATCHED",
  inquiryId: crypto.randomUUID(),
  margin: 0,
  notes: null,
  userId: crypto.randomUUID(),
  offerIds: [] as string[],
  ...over,
});
