import { getAdminDb } from "@/app/firebaseAdmin";

// Removes donated food items whose `expiryDate` is more than 3 days in the past.
// Marks them with `status: "removed"` and sets `removedAt`/`updatedAt`.
export async function removeExpiredDonations(): Promise<{ removedCount: number }> {
  const db = getAdminDb();
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const snapshot = await db.collection("donated_food").where("expiryDate", "<", cutoff).get();
  if (snapshot.empty) return { removedCount: 0 };

  const batch = db.batch();
  let removedCount = 0;
  const nowIso = new Date().toISOString();

  snapshot.forEach((doc) => {
    const data = doc.data() as any;
    // Skip already finalized states
    if (data?.status === "removed" || data?.status === "picked_up" || data?.status === "cancelled") return;
    const ref = db.collection("donated_food").doc(doc.id);
    batch.update(ref, { status: "removed", removedAt: nowIso, updatedAt: nowIso });
    removedCount++;
  });

  if (removedCount > 0) await batch.commit();
  return { removedCount };
}
