import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/firebaseAdmin";
import { handleApiError, RateLimitError, createSuccessResponse } from "@/lib/apiError";
import { verifyAdminAuth } from "@/lib/serverAuth";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`get-admin-analytics-${clientId}`)) {
      throw new RateLimitError(300);
    }

    await verifyAdminAuth(request);

    const usersSnapshot = await db.collection("users").get();
    const donationsSnapshot = await db.collection("donated_food").get();

    let totalPickupMinutes = 0;
    let pickupCount = 0;

    donationsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === "picked_up" && data.createdAt && data.pickedUpAt) {
        const created = new Date(data.createdAt).getTime();
        const picked = new Date(data.pickedUpAt).getTime();
        if (!Number.isNaN(created) && !Number.isNaN(picked)) {
          totalPickupMinutes += Math.max(0, Math.round((picked - created) / 60000));
          pickupCount += 1;
        }
      }
    });

    const avgPickupMinutes = pickupCount > 0 ? Math.round(totalPickupMinutes / pickupCount) : 0;

    return NextResponse.json(
      createSuccessResponse({
        userCount: usersSnapshot.size,
        donationCount: donationsSnapshot.size,
        pickedUpCount: pickupCount,
        avgPickupMinutes,
      }),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
