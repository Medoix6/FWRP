import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/firebaseAdmin";
import { handleApiError, ValidationError, RateLimitError, createSuccessResponse, ForbiddenError } from "@/lib/apiError";
import { getUserFromAuth } from "@/lib/serverAuth";
import { validateCsrfToken } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`post-ratings-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);
    const user = await getUserFromAuth(request);
    const { donationId, toUserId, score, comment } = await request.json() as {
      donationId?: string;
      toUserId?: string;
      score?: number;
      comment?: string;
    };

    if (!donationId || !toUserId || typeof score !== "number") {
      throw new ValidationError("donationId, toUserId and score are required");
    }
    if (toUserId === user.uid) {
      throw new ValidationError("You cannot rate yourself");
    }
    if (score < 1 || score > 5) {
      throw new ValidationError("Score must be between 1 and 5");
    }

    const donationDoc = await db.collection("donated_food").doc(donationId).get();
    if (!donationDoc.exists) {
      throw new ValidationError("Donation not found");
    }
    const donation = donationDoc.data() || {};
    if (donation.status !== "picked_up") {
      throw new ValidationError("Donation must be picked up before rating");
    }
    const isParticipant = donation.userId === user.uid || donation.reservedBy === user.uid;
    if (!isParticipant) {
      throw new ForbiddenError("Only participants can rate this donation");
    }
    const validTarget = donation.userId === toUserId || donation.reservedBy === toUserId;
    if (!validTarget) {
      throw new ValidationError("Rating target is not part of this donation");
    }

    const ratingId = `${donationId}_${user.uid}`;
    const ratingRef = db.collection("ratings").doc(ratingId);
    const existing = await ratingRef.get();
    if (existing.exists) {
      throw new ValidationError("You already rated this donation");
    }

    await ratingRef.set({
      donationId,
      fromUserId: user.uid,
      toUserId,
      score,
      comment: comment ? comment.substring(0, 1000) : "",
      createdAt: new Date().toISOString(),
    });

    const userRef = db.collection("users").doc(toUserId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const data = userSnap.data() || {};
      const ratingCount = Number(data.ratingCount || 0);
      const ratingAverage = Number(data.ratingAverage || 0);
      const newCount = ratingCount + 1;
      const newAverage = ((ratingAverage * ratingCount) + score) / newCount;
      await userRef.update({
        ratingCount: newCount,
        ratingAverage: Number(newAverage.toFixed(2)),
      });
    }

    return NextResponse.json(createSuccessResponse({ success: true }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`get-ratings-${clientId}`)) {
      throw new RateLimitError(300);
    }

    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get("donationId");
    const userId = searchParams.get("userId");

    if (donationId) {
      const user = await getUserFromAuth(request);
      const ratingId = `${donationId}_${user.uid}`;
      const ratingSnap = await db.collection("ratings").doc(ratingId).get();
      if (!ratingSnap.exists) {
        return NextResponse.json(createSuccessResponse({ rating: null }), { status: 200 });
      }
      return NextResponse.json(createSuccessResponse({ rating: { id: ratingSnap.id, ...ratingSnap.data() } }), { status: 200 });
    }

    if (userId) {
      const snapshot = await db
        .collection("ratings")
        .where("toUserId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      const ratings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json(createSuccessResponse({ ratings }), { status: 200 });
    }

    throw new ValidationError("donationId or userId is required");
  } catch (error) {
    return handleApiError(error);
  }
}
