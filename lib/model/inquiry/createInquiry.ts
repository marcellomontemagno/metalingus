import type Inquiry from "./Inquiry";
import type WithRequired from "../../utils/WithRequired";

export default function createInquiry(
  input: WithRequired<Inquiry, "userId">,
): Inquiry {
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
    ...input,
  };
}
