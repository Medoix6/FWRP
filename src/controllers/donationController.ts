export async function fetchDonationById(id: string) {
  const res = await fetch(`/api/donated-food/${id}`);
  if (!res.ok) throw new Error("Donation not found");
  return await res.json();
}
