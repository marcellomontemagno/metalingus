import type Order from "./Order";

export default function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "",
    status: "MATCHED",
    inquiryId: "",
    margin: 0,
    notes: null,
    userId: null,
    ...overrides,
  };
}
