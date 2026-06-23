import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/firebaseAdmin";
import { handleApiError, ValidationError, RateLimitError, createSuccessResponse } from "@/lib/apiError";
import { verifyAdminAuth } from "@/lib/serverAuth";
import { validateCsrfToken } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`get-admin-donations-${clientId}`)) {
      throw new RateLimitError(300);
    }

    await verifyAdminAuth(request);

    const snapshot = await db
      .collection("donated_food")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const donations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(createSuccessResponse({ donations }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`patch-admin-donations-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);
    await verifyAdminAuth(request);
    const { id, action } = await request.json() as { id?: string; action?: "remove" | "restore" | "expire" };

    if (!id || !action) {
      throw new ValidationError("Donation id and action are required");
    }

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (action === "remove") {
      update.status = "removed";
      update.removedAt = new Date().toISOString();
    } else if (action === "restore") {
      update.status = "available";
      update.removedAt = null;
    } else if (action === "expire") {
      update.status = "expired";
    } else {
      throw new ValidationError("Unsupported action");
    }

    await db.collection("donated_food").doc(id).update(update);

    return NextResponse.json(createSuccessResponse({ success: true }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
