import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/app/firebaseAdmin";

// GET all users (for reference, not used for edit/delete)
export async function GET() {
  const usersCol = adminDb.collection("users");
  const snapshot = await usersCol.get();
  const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(users);
}

// PATCH to update a user
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    const userRef = adminDb.collection("users").doc(id);
    await userRef.update(data);
    return NextResponse.json({ success: true });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// DELETE to remove a user (admin only, with ID token check)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check admin
    const adminDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete user document from Firestore
    await adminDb.collection("users").doc(id).delete();

    // Delete user from Firebase Authentication
    await adminAuth.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (e) {
    // Log the actual error for debugging
    console.error("DELETE /api/users error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
