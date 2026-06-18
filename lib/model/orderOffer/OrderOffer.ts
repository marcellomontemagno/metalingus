import { z } from "zod";

export const orderOfferSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  offerId: z.uuid(),
});

type OrderOffer = z.infer<typeof orderOfferSchema>;
export { type OrderOffer as default };
