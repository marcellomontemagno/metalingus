import type Order from "./Order";
import type WithRequired from "../../utils/WithRequired";

export default function createOrder(
  input: WithRequired<Order, "userId">,
): Order {
  return {
    id: "",
    status: "MATCHED",
    inquiryId: "",
    margin: 0,
    notes: null,
    ...input,
  };
}
