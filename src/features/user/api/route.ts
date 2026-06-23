import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/app/firebaseAdmin";
import { handleApiError, ValidationError, AuthenticationError, createSuccessResponse, RateLimitError } from "@/lib/apiError";
import { verifyAdminAuth, getUserFromAuth } from "@/lib/serverAuth";
import { isRateLimited } from "@/lib/rateLimit";
import { validateCsrfToken } from "@/lib/csrf";

// GET all users (requires admin)
export async function GET(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`get-users-${clientId}`)) {
      throw new RateLimitError(300);
    }

    // Verify admin access
    await verifyAdminAuth(req);

    const adminDb = getAdminDb();
    const usersCol = adminDb.collection("users");
    const snapshot = await usersCol.limit(100).get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Don't expose sensitive data
      return {
        id: doc.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        isAdmin: data.isAdmin,
        isVerified: data.isVerified,
        ratingAverage: data.ratingAverage || 0,
        ratingCount: data.ratingCount || 0,
        createdAt: data.createdAt,
      };
    });
    
    return NextResponse.json(createSuccessResponse({ users }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH to update a user
export async function PATCH(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`patch-user-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(req);

    const user = await getUserFromAuth(req) as { uid: string; isAdmin?: boolean };
    const { id, ...data } = await req.json();

    if (!id) {
      throw new ValidationError('User ID required');
    }

    // Users can only update their own profile unless they're admin
    const isAdmin = Boolean(user.isAdmin);
    if (id !== user.uid && !isAdmin) {
      throw new AuthenticationError('You can only update your own profile');
    }

    // Validate data
    const allowedFields = [
      'name',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'postalCode',
      'avatar',
      'bio',
    ];
    const updateData: Record<string, string | Date | boolean> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && typeof value === 'string') {
        updateData[key] = value;
      }
      if (key === 'isVerified' && isAdmin && typeof value === 'boolean') {
        updateData[key] = value;
      }
    }

    updateData.updatedAt = new Date().toISOString();

    const adminDb = getAdminDb();
    const userRef = adminDb.collection("users").doc(id);
    await userRef.update(updateData);

    return NextResponse.json(
      createSuccessResponse({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE to remove a user (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`delete-user-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(req);

    // Verify admin access
    const decodedToken = await verifyAdminAuth(req);

    const { id } = await req.json();

    if (!id) {
      throw new ValidationError('User ID required');
    }

    // Prevent self-deletion
    if (id === decodedToken.uid) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Delete user document from Firestore
    const adminDb = getAdminDb();
    await adminDb.collection("users").doc(id).delete();

    // Delete user from Firebase Authentication
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.deleteUser(id);
    } catch (error) {
      console.error("Error deleting Firebase Auth user:", error);
      // Continue even if Firebase Auth deletion fails
    }

    return NextResponse.json(
      createSuccessResponse({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
