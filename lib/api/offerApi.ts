import type Offer from "../model/offer/Offer";
import request from "./request";

export async function getOffers(): Promise<Offer[]> {
  const res = await request("/api/offers");
  return (await res.json()) as Offer[];
}

export async function createOfferApi(offer: Offer): Promise<Offer> {
  const res = await request("/api/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });
  return (await res.json()) as Offer;
}

export async function updateOfferApi(offer: Offer): Promise<Offer> {
  const res = await request(`/api/offers/${offer.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer),
  });
  return (await res.json()) as Offer;
}

export async function deleteOfferApi(id: string): Promise<void> {
  await request(`/api/offers/${id}`, {
    method: "DELETE",
  });
}
