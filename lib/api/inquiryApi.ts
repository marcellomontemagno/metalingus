import type Inquiry from "../model/inquiry/Inquiry";
import type User from "../model/user/User";
import type Order from "../model/order/Order";
import request from "./request";

export async function getInquiries(): Promise<{
  inquiry: Inquiry[];
  user: User[];
  order: Order[];
}> {
  const res = await request("/api/inquiries");
  return res.json();
}

export async function createInquiryApi(
  inquiry: Inquiry,
): Promise<{ inquiry: Inquiry[] }> {
  const res = await request("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  return res.json();
}

export async function updateInquiryApi(
  inquiry: Inquiry,
): Promise<{ inquiry: Inquiry[] }> {
  const res = await request(`/api/inquiries/${inquiry.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  return res.json();
}

export async function deleteInquiryApi(id: string): Promise<void> {
  await request(`/api/inquiries/${id}`, {
    method: "DELETE",
  });
}
