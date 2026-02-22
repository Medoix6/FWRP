// API route to get user public info (including phone) by userId
import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { handleApiError, ValidationError, createSuccessResponse, RateLimitError } from "@/lib/apiError";
import { isRateLimited } from "@/lib/rateLimit";
import { getUserFromAuth } from "@/lib/serverAuth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`get-user-${clientId}`)) {
      throw new RateLimitError(300);
    }

    const requester = await getUserFromAuth(req) as { uid: string } & Record<string, unknown>;

    const { id: userId } = await context.params;
    if (!userId) {
      throw new ValidationError("User ID required");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new ValidationError("User not found");
    }

    const { name, phone, avatar, address, city, state, postalCode, bio, email } = userDoc.data() || {};
    const isSelfOrAdmin = requester.uid === userId || requester.isAdmin;
    const responseData = isSelfOrAdmin
      ? { id: userId, name, phone, avatar, address, city, state, postalCode, bio, email }
      : { id: userId, name, phone, avatar };
    
    return NextResponse.json(
      createSuccessResponse(responseData),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
