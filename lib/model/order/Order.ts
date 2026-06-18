import { z } from "zod";
import { orderStatusSchema } from "../OrderStatus";

export const orderSchema = z.object({
  id: z.uuid(),
  status: orderStatusSchema,
  inquiryId: z.uuid(),
  notes: z.string().nullable(),
  userId: z.uuid().nullable(),
});

type Order = z.infer<typeof orderSchema>;
export { type Order as default };
