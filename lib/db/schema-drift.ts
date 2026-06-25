// Compile-time anti-drift guard. The hand-written `lib/model/**` Zod schemas stay
// the source of input validation + response shaping, but their FIELD SETS must
// match the Drizzle tables. Add or remove a column without updating the model —
// or vice versa — and `tsc` fails right here. (Chosen over generating validators
// via drizzle-zod, which would override ~8/11 fields anyway.) Type-only: erased at
// build, never imported, so no runtime/client cost.
import type {
  Inquiry as InquiryRow,
  Offer as OfferRow,
  Order as OrderRow,
  OrderOffer as OrderOfferRow,
  User as UserRow,
} from "@/lib/db/schema";
import type InquiryModel from "@/lib/model/inquiry/Inquiry";
import type OfferModel from "@/lib/model/offer/Offer";
import type OrderModel from "@/lib/model/order/Order";
import type OrderOfferModel from "@/lib/model/orderOffer/OrderOffer";
import type UserModel from "@/lib/model/user/User";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type SubsetOf<Sub, Sup> = [Sub] extends [Sup] ? true : false;

// Entity models mirror their table columns exactly (by field name).
type _Inquiry = Expect<Equal<keyof InquiryModel, keyof InquiryRow>>;
type _Offer = Expect<Equal<keyof OfferModel, keyof OfferRow>>;
type _Order = Expect<Equal<keyof OrderModel, keyof OrderRow>>;
type _OrderOffer = Expect<Equal<keyof OrderOfferModel, keyof OrderOfferRow>>;
// The user response is a curated subset (no createdAt/updatedAt): every model field
// must still be a real column.
type _User = Expect<SubsetOf<keyof UserModel, keyof UserRow>>;

// Exported so tsc is forced to evaluate the assertions above.
export type DriftChecks = [_Inquiry, _Offer, _Order, _OrderOffer, _User];
