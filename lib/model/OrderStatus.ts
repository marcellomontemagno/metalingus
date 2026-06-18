import { z } from "zod";

export const orderStatusSchema = z.enum([
  "MATCHED",
  "APPROVED",
  "PAID",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
]);

type OrderStatus = z.infer<typeof orderStatusSchema>;
export { type OrderStatus as default };
