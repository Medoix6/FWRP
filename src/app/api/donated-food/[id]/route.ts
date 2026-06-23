import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getUserFromAuth } from "@/lib/serverAuth";
import { handleApiError, ValidationError, RateLimitError, ForbiddenError } from "@/lib/apiError";
import { validateFoodName, validateDescription, validateLocation, validateDate, validateFileType, validateFileSize, validateCategory, validateServings, validateAllergens, validatePackaging, validatePickupWindow } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { validateCsrfToken } from "@/lib/csrf";
import { getAdminDb } from "@/app/firebaseAdmin";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 4;

// GET donation by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`get-donation-${clientId}`)) {
      throw new RateLimitError(300);
    }

    const { id: donationId } = await context.params;
    if (!donationId) {
      throw new ValidationError("Donation ID required");
    }

    const docRef = db.collection("donated_food").doc(donationId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      throw new ValidationError("Donation not found");
    }

    const data = docSnap.data();
    const expiryDate = data?.expiryDate ? new Date(data.expiryDate).getTime() : null;
    const currentStatus = data?.status || "available";
    let nextStatus = currentStatus;
    if ((currentStatus === "available" || currentStatus === "reserved") && expiryDate && expiryDate < Date.now()) {
      nextStatus = "expired";
      await docRef.update({ status: "expired", updatedAt: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docSnap.id,
        ...data,
        status: nextStatus,
      }
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH update donation by ID
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`patch-donation-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);

    const user = await getUserFromAuth(request);
    const { id: donationId } = await context.params;

    if (!donationId) {
      throw new ValidationError("Donation ID required");
    }

    // Verify ownership
    const docRef = db.collection("donated_food").doc(donationId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new ValidationError("Donation not found");
    }

    const existingData = docSnap.data();
    if (existingData?.userId !== user.uid) {
      throw new ValidationError("You can only update your own donations");
    }

    const data: Record<string, unknown> = {};
    const newImageUrls: string[] = [];
    let existingImagesToKeep: string[] = [];

    // Check content type
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const foodName = formData.get("title") as string;
      const description = formData.get("description") as string;
      const location = formData.get("location") as string;
      const expiryDate = formData.get("expiryDate") as string;
      const pickupInstructions = (formData.get("pickupInstructions") as string) || '';
      const category = (formData.get("category") as string) || '';
      const quantityServingsValue = formData.get("quantityServings") as string;
      const allergensValue = (formData.get("allergens") as string) || '';
      const packaging = (formData.get("packaging") as string) || '';
      const pickupWindowStart = (formData.get("pickupWindowStart") as string) || '';
      const pickupWindowEnd = (formData.get("pickupWindowEnd") as string) || '';
      const locationLatValue = formData.get("locationLat") as string;
      const locationLngValue = formData.get("locationLng") as string;

      // Validate inputs if provided
      if (foodName) data.foodName = validateFoodName(foodName);
      if (description) data.description = validateDescription(description);
      if (location) data.location = validateLocation(location);
      if (expiryDate) data.expiryDate = validateDate(expiryDate);
      if (pickupInstructions) data.pickupInstructions = pickupInstructions.substring(0, 500);
      if (category) data.category = validateCategory(category);
      if (quantityServingsValue) data.quantityServings = validateServings(Number(quantityServingsValue));
      if (allergensValue) data.allergens = validateAllergens(allergensValue);
      if (packaging) data.packaging = validatePackaging(packaging);
      if (pickupWindowStart) data.pickupWindowStart = validatePickupWindow(pickupWindowStart);
      if (pickupWindowEnd) data.pickupWindowEnd = validatePickupWindow(pickupWindowEnd);
      const locationLat = locationLatValue ? Number(locationLatValue) : undefined;
      const locationLng = locationLngValue ? Number(locationLngValue) : undefined;
      if (Number.isFinite(locationLat) && Number.isFinite(locationLng)) {
        data.locationCoords = { lat: locationLat as number, lng: locationLng as number };
      }

      // Get existing images to keep
      const existingImagesStr = formData.get("existingImages");
      if (existingImagesStr && typeof existingImagesStr === "string") {
        try {
          existingImagesToKeep = JSON.parse(existingImagesStr);
        } catch {
          existingImagesToKeep = [];
        }
      }


      // Process new images
      const multipleImages = formData.getAll("images");
      const imagesToProcess = (multipleImages.length > 0 ? multipleImages : []).filter(img => img instanceof File);

      if (imagesToProcess.length > 0) {
        for (const image of imagesToProcess) {
          try {
            validateFileType(image as File, ALLOWED_IMAGE_TYPES);
            validateFileSize(image as File, 5);
            
            const buffer = Buffer.from(await (image as File).arrayBuffer());
            const uploadUrl = await new Promise<string>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { 
                  folder: "donated_food",
                  resource_type: "auto",
                  quality: "auto:good",
                },
                (error, result) => {
                  if (error) return reject(error);
                  if (result?.secure_url) {
                    resolve(result.secure_url);
                  } else {
                    reject(new Error("No result from upload"));
                  }
                }
              );
              stream.end(buffer);
            });
            newImageUrls.push(uploadUrl);
          } catch (error) {
            if (error instanceof Error) {
              throw new ValidationError(`Image validation failed: ${error.message}`);
            }
          }
        }
      }

      // Merge images, limit to 4 total
      const mergedImageUrls = [...existingImagesToKeep, ...newImageUrls].slice(0, MAX_IMAGES);
      if (mergedImageUrls.length > 0) {
        data.imageUrls = mergedImageUrls;
      }
    } else {
      const jsonData = await request.json() as Record<string, unknown>;
      // Validate JSON inputs
      if (typeof jsonData.foodName === "string") data.foodName = validateFoodName(jsonData.foodName);
      if (typeof jsonData.description === "string") data.description = validateDescription(jsonData.description);
      if (typeof jsonData.location === "string") data.location = validateLocation(jsonData.location);
      if (typeof jsonData.expiryDate === "string") data.expiryDate = validateDate(jsonData.expiryDate);
      if (typeof jsonData.category === "string") data.category = validateCategory(jsonData.category);
      if (typeof jsonData.quantityServings === "number") data.quantityServings = validateServings(jsonData.quantityServings);
      if (typeof jsonData.allergens === "string") data.allergens = validateAllergens(jsonData.allergens);
      if (typeof jsonData.packaging === "string") data.packaging = validatePackaging(jsonData.packaging);
      if (typeof jsonData.pickupWindowStart === "string") data.pickupWindowStart = validatePickupWindow(jsonData.pickupWindowStart);
      if (typeof jsonData.pickupWindowEnd === "string") data.pickupWindowEnd = validatePickupWindow(jsonData.pickupWindowEnd);
      if (typeof jsonData.locationCoords === "object" && jsonData.locationCoords !== null) {
        const coords = jsonData.locationCoords as { lat?: number; lng?: number };
        if (Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
          data.locationCoords = { lat: coords.lat as number, lng: coords.lng as number };
        }
      }
    }

    // Remove undefined fields and add metadata
    Object.keys(data).forEach((k) => (data[k] === undefined ? delete data[k] : undefined));
    data.updatedAt = new Date().toISOString();

    await docRef.update(data);
    return NextResponse.json({ 
      success: true, 
      data: {
        id: donationId,
        ...data
      }
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST donation actions (reserve/cancel/picked up)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`action-donation-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);

    const user = await getUserFromAuth(request);
    const { id: donationId } = await context.params;

    if (!donationId) {
      throw new ValidationError("Donation ID required");
    }

    const { action } = await request.json() as { action?: string };
    if (!action) {
      throw new ValidationError("Action is required");
    }

    const docRef = db.collection("donated_food").doc(donationId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new ValidationError("Donation not found");
    }

    const data = docSnap.data() || {};
    const nowIso = new Date().toISOString();
    const status = data.status || "available";
    const expiryDate = data.expiryDate ? new Date(data.expiryDate).getTime() : null;

    if ((status === "available" || status === "reserved") && expiryDate && expiryDate < Date.now()) {
      await docRef.update({ status: "expired", updatedAt: nowIso });
      throw new ValidationError("Donation has expired");
    }

    if (action === "reserve") {
      if (data.userId === user.uid) {
        throw new ForbiddenError("You cannot reserve your own donation");
      }
      if (status !== "available") {
        throw new ValidationError("Donation is not available");
      }
      await docRef.update({
        status: "reserved",
        reservedBy: user.uid,
        reservedAt: nowIso,
        updatedAt: nowIso,
      });
      // notifications removed
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "cancel_reservation") {
      if (status !== "reserved") {
        throw new ValidationError("Donation is not reserved");
      }
      if (data.reservedBy !== user.uid && data.userId !== user.uid) {
        throw new ForbiddenError("You cannot cancel this reservation");
      }
      await docRef.update({
        status: "available",
        reservedBy: null,
        reservedAt: null,
        updatedAt: nowIso,
      });
      const otherUserId = data.userId === user.uid ? data.reservedBy : data.userId;
      // notifications removed
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "mark_picked_up") {
      if (data.userId !== user.uid) {
        throw new ForbiddenError("Only the donor can mark pickup");
      }
      if (status !== "reserved") {
        throw new ValidationError("Donation must be reserved before pickup");
      }
      await docRef.update({
        status: "picked_up",
        pickedUpAt: nowIso,
        updatedAt: nowIso,
      });
      // notifications removed
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "cancel_donation") {
      if (data.userId !== user.uid) {
        throw new ForbiddenError("Only the donor can cancel");
      }
      if (status === "picked_up" || status === "removed") {
        throw new ValidationError("Donation cannot be cancelled");
      }
      await docRef.update({
        status: "cancelled",
        updatedAt: nowIso,
      });
      // notifications removed
      return NextResponse.json({ success: true }, { status: 200 });
    }

    throw new ValidationError("Unsupported action");
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE donation by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const db = getAdminDb();
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`delete-donation-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(request);

    const user = await getUserFromAuth(request);
    const { id: donationId } = await context.params;

    if (!donationId) {
      throw new ValidationError("Donation ID required");
    }

    // Verify ownership
    const docRef = db.collection("donated_food").doc(donationId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new ValidationError("Donation not found");
    }

    const existingData = docSnap.data();
    if (existingData?.userId !== user.uid) {
      throw new ValidationError("You can only delete your own donations");
    }

    // Delete images from Cloudinary
    if (existingData?.imageUrls && Array.isArray(existingData.imageUrls)) {
      for (const imageUrl of existingData.imageUrls) {
        try {
          const publicId = extractPublicId(imageUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    await docRef.delete();
    return NextResponse.json({ 
      success: true 
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

function extractPublicId(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId ? `donated_food/${publicId}` : null;
  } catch {
    return null;
  }
}
