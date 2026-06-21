import type Offer from "./Offer";
import type WithRequired from "../../utils/WithRequired";

export default function createOffer(
  input: WithRequired<Offer, "userId">,
): Offer {
  return {
    id: "",
    barsAvailable: 0,
    grade: "S235JR",
    shape: "SQUARE",
    width: 0,
    height: 0,
    thickness: 0,
    barsPerBundle: 0,
    weightPerMeter: 0,
    pricePerMeter: 0,
    currency: "EUR",
    notes: null,
    ...input,
  };
}
