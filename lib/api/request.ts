export default async function request(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(res.statusText || `Request failed with status ${res.status}`);
  }
  return res;
}
