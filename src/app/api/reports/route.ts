import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/firebaseAdmin";
import { handleApiError, ValidationError, RateLimitError, createSuccessResponse } from "@/lib/apiError";
import { getUserFromAuth, verifyAdminAuth } from "@/lib/serverAuth";
import { validateCsrfToken } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`post-reports-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);
    const user = await getUserFromAuth(request);
    const { targetType, targetId, reason, details } = await request.json() as {
      targetType?: "donation" | "user" | "chat";
      targetId?: string;
      reason?: string;
      details?: string;
    };

    if (!targetType || !targetId || !reason) {
      throw new ValidationError("targetType, targetId, and reason are required");
    }

    const reportRef = await db.collection("reports").add({
      reporterId: user.uid,
      targetType,
      targetId,
      reason,
      details: details ? details.substring(0, 1000) : "",
      status: "open",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(createSuccessResponse({ id: reportRef.id }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`get-reports-${clientId}`)) {
      throw new RateLimitError(300);
    }

    await verifyAdminAuth(request);

    const snapshot = await db
      .collection("reports")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(createSuccessResponse({ reports }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`patch-reports-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);
    const admin = await verifyAdminAuth(request);
    const { id, status } = await request.json() as { id?: string; status?: "open" | "reviewing" | "resolved" };

    if (!id || !status) {
      throw new ValidationError("Report id and status are required");
    }

    const update: Record<string, unknown> = { status };
    if (status === "resolved") {
      update.resolvedAt = new Date().toISOString();
      update.resolvedBy = admin.uid;
    }

    await db.collection("reports").doc(id).update(update);

    return NextResponse.json(createSuccessResponse({ success: true }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
