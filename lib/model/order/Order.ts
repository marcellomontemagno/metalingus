import { z } from "zod";
import { orderStatusSchema } from "../OrderStatus";

export const orderSchema = z.object({
  id: z.uuid(),
  status: orderStatusSchema,
  inquiryId: z.uuid(),
  // broker's markup as a decimal fraction (0.10 = 10%); the orders API nulls it
  // for buyers so the seller's price and margin never reach them.
  margin: z.coerce.number().min(0).nullable(),
  notes: z.string().nullable(),
  userId: z.uuid(),
  organizationId: z.uuid().nullable().optional(),
});

type Order = z.infer<typeof orderSchema>;
export { type Order as default };

export function sanitizeOrder(order: Order, isBroker: boolean): Order {
  if (!isBroker) {
    order.margin = null;
  }
  return order;
}

export function sanitizeOrders(orders: Order[], isBroker: boolean): Order[] {
  orders.forEach((o) => sanitizeOrder(o, isBroker));
  return orders;
}
