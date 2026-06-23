import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/firebaseAdmin";
import { handleApiError, ValidationError, RateLimitError, createSuccessResponse, ForbiddenError } from "@/lib/apiError";
import { getUserFromAuth } from "@/lib/serverAuth";
import { validateCsrfToken } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`get-notifications-${clientId}`)) {
      throw new RateLimitError(300);
    }

    const user = await getUserFromAuth(request);

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{ id: string; read?: boolean } & Record<string, unknown>>;

    const unreadCount = notifications.filter((item) => !item.read).length;

    return NextResponse.json(
      createSuccessResponse({ notifications, unreadCount }),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`patch-notifications-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);
    const user = await getUserFromAuth(request);
    const { ids, markAll } = await request.json() as { ids?: string[]; markAll?: boolean };

    const batch = db.batch();
    if (markAll) {
      const snapshot = await db
        .collection("notifications")
        .where("userId", "==", user.uid)
        .where("read", "==", false)
        .get();

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
    } else if (Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        const docRef = db.collection("notifications").doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) continue;
        const data = docSnap.data();
        if (data?.userId !== user.uid) {
          throw new ForbiddenError("You can only update your own notifications");
        }
        batch.update(docRef, { read: true });
      }
    } else {
      throw new ValidationError("Notification ids or markAll required");
    }

    await batch.commit();
    return NextResponse.json(createSuccessResponse({ success: true }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`post-notifications-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);
    const sender = await getUserFromAuth(request);
    const { receiverId, message, donationId } = await request.json() as { receiverId?: string; message?: string; donationId?: string };

    if (!receiverId || !message) {
      throw new ValidationError("Receiver and message are required");
    }
    if (receiverId === sender.uid) {
      throw new ValidationError("Cannot notify yourself");
    }

    await db.collection("notifications").add({
      userId: receiverId,
      type: "message",
      title: "New message",
      body: message.substring(0, 200),
      link: donationId ? `/chat?donorId=${sender.uid}&donationId=${donationId}` : `/chat?donorId=${sender.uid}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(createSuccessResponse({ success: true }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
