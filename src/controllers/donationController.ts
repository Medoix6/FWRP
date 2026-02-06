import { AuthTokenManager } from "@/lib/clientAuth";

export async function fetchDonationById(id: string) {
  const authHeader = AuthTokenManager.getAuthHeader();
  const res = await fetch(`/api/donated-food/${id}`, {
    headers: {
      ...(authHeader || {}),
    },
  });
  if (!res.ok) throw new Error("Donation not found");
  const response = await res.json();
  return response.data || response;
}
