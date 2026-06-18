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
