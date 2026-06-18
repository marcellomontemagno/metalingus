import type Order from "../model/order/Order";
import type OrderOffer from "../model/orderOffer/OrderOffer";
import request from "./request";

export async function getOrders(): Promise<{
  order: Order[];
  orderOffer: OrderOffer[];
}> {
  const res = await request("/api/orders");
  return res.json();
}

export async function createOrderApi(
  order: Order,
  offerIds: string[],
): Promise<{ order: Order[]; orderOffer: OrderOffer[] }> {
  const res = await request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...order, offerIds }),
  });
  return res.json();
}

export async function updateOrderApi(
  order: Order,
  offerIds: string[],
): Promise<{ order: Order[]; orderOffer: OrderOffer[] }> {
  const res = await request(`/api/orders/${order.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...order, offerIds }),
  });
  return res.json();
}
