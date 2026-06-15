import type Inquiry from "../model/inquiry/Inquiry";
import request from "./request";

export async function getInquiries(): Promise<Inquiry[]> {
  const res = await request("/api/inquiries");
  return (await res.json()) as Inquiry[];
}

export async function createInquiryApi(inquiry: Inquiry): Promise<Inquiry> {
  const res = await request("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  return (await res.json()) as Inquiry;
}

export async function updateInquiryApi(inquiry: Inquiry): Promise<Inquiry> {
  const res = await request(`/api/inquiries/${inquiry.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  return (await res.json()) as Inquiry;
}

export async function deleteInquiryApi(id: string): Promise<void> {
  await request(`/api/inquiries/${id}`, {
    method: "DELETE",
  });
}
