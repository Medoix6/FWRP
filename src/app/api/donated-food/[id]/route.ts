
import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import cloudinary from "cloudinary";
// Cloudinary config (make sure these env vars are set)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// GET donation by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const donationId = params.id;
    if (!donationId) return NextResponse.json({ error: "Donation ID required" }, { status: 400 });
    const docRef = db.collection("donated_food").doc(donationId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH update donation by ID (supporting multipart/form-data for image upload)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const donationId = params.id;
    if (!donationId) return NextResponse.json({ error: "Donation ID required" }, { status: 400 });

    let data: Record<string, unknown> = {};
    let imageUrl = null;

    // Check if the request is multipart/form-data (for image upload)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      data = {
        foodName: formData.get("title"),
        description: formData.get("description"),
        location: formData.get("location"),
        expiryDate: formData.get("expiryDate"),
        pickupInstructions: formData.get("pickupInstructions"),
      };
      const image = formData.get("foodImage");
      if (image && typeof image === "object" && "arrayBuffer" in image) {
        const buffer = Buffer.from(await image.arrayBuffer());
        await new Promise((resolve, reject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            { folder: "donated_food", resource_type: "image" },
            (error, result) => {
              if (error) return reject(error);
              if (result && result.secure_url) {
                imageUrl = result.secure_url;
                resolve(result);
              } else {
                reject(new Error("No result from Cloudinary upload"));
              }
            }
          );
          stream.end(buffer);
        });
        if (imageUrl) {
          data.imageUrl = imageUrl;
        }
      }
    } else {
      data = await req.json();
    }

    // Remove undefined fields
    Object.keys(data).forEach((k) => (data[k] === undefined ? delete data[k] : undefined));
    const docRef = db.collection("donated_food").doc(donationId);
    await docRef.update(data);
    return NextResponse.json({ success: true, imageUrl: data.imageUrl });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE donation by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const donationId = params.id;
    if (!donationId) return NextResponse.json({ error: "Donation ID required" }, { status: 400 });
    await db.collection("donated_food").doc(donationId).delete();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
