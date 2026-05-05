import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getUserFromAuth } from "@/lib/serverAuth";
import { handleApiError, ValidationError, RateLimitError } from "@/lib/apiError";
import { validateFoodName, validateDescription, validateLocation, validateDate, validateFileType, validateFileSize } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { validateCsrfToken } from "@/lib/csrf";
import { adminDb } from "@/app/firebaseAdmin";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = adminDb;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 4;

// GET donation by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
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
    return NextResponse.json({ 
      success: true,
      data: {
        id: docSnap.id, 
        ...data 
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

    const data: Record<string, string | string[]> = {};
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

      // Validate inputs if provided
      if (foodName) data.foodName = validateFoodName(foodName);
      if (description) data.description = validateDescription(description);
      if (location) data.location = validateLocation(location);
      if (expiryDate) data.expiryDate = validateDate(expiryDate);
      if (pickupInstructions) data.pickupInstructions = pickupInstructions.substring(0, 500);

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

// DELETE donation by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
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
