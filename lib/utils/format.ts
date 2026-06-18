import type Shape from "@/lib/model/Shape";
import type Currency from "@/lib/model/Currency";
import type OrderStatus from "@/lib/model/OrderStatus";

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

export function formatOrderStatus(status: OrderStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function orderStatusVariant(
  status: OrderStatus,
): "default" | "secondary" | "destructive" {
  if (status === "CANCELLED") return "destructive";
  if (status === "DELIVERED") return "default";
  return "secondary";
}
