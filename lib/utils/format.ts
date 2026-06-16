import type Shape from "@/lib/model/Shape";
import type Currency from "@/lib/model/Currency";

export function formatDimensions(item: { shape: Shape; width: number; height: number }): string {
  if (item.shape === "ROUND") return `${item.height}`;
  if (item.shape === "SQUARE") return `${item.width}`;
  return `${item.width}-${item.height}`;
}

export function formatDeliveryDate(value: string | null): string {
  if (!value) return "-";
  // value is 'YYYY-MM-DD'; parse as local midnight so it doesn't shift a day in
  // negative-UTC timezones.
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function formatPrice(price: number, currency: Currency): string {
  return `${price}-${currency}`;
}
