import type Inquiry from "./Inquiry";

export default function createInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id: "",
    barsRequested: 0,
    latestDeliveryDate: null,
    grade: "S235JR",
    shape: "SQUARE",
    width: 0,
    height: 0,
    thickness: 0,
    notes: null,
    userId: null,
    ...overrides,
  };
}
