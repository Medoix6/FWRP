// API route to get user public info (including phone) by userId
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/firebaseAdmin";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const db = getAdminDb();
    const { id: userId } = await context.params;
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { name, phone, avatar } = userDoc.data() || {};
    return NextResponse.json({ name, phone, avatar });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
