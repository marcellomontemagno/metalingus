import type Offer from "../model/offer/Offer";
import type User from "../model/user/User";
import type Order from "../model/order/Order";
import type OrderOffer from "../model/orderOffer/OrderOffer";
import request from "./request";

export async function getOffers(): Promise<{
  offer: Offer[];
  user: User[];
  order: Order[];
  orderOffer: OrderOffer[];
}> {
  const res = await request("/api/offers");
  return res.json();
}

export async function createOfferApi(offer: Offer): Promise<{ offer: Offer[] }> {
  const res = await request("/api/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });
  return res.json();
}

export async function updateOfferApi(offer: Offer): Promise<{ offer: Offer[] }> {
  const res = await request(`/api/offers/${offer.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });
  return res.json();
}

export async function deleteOfferApi(id: string): Promise<void> {
  await request(`/api/offers/${id}`, {
    method: "DELETE",
  });
}
