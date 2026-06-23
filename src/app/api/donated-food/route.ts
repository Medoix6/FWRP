import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { isRateLimited } from '@/lib/rateLimit';
import { handleApiError, ValidationError, AuthenticationError, RateLimitError, createSuccessResponse } from '@/lib/apiError';
import { validateFoodName, validateDescription, validateLocation, validateDate, validateFileType, validateFileSize, validateCategory, validateServings, validateAllergens, validatePackaging, validatePickupWindow } from '@/lib/validation';
import { getUserFromAuth } from '@/lib/serverAuth';
import { validateCsrfToken } from '@/lib/csrf';
import { getAdminDb } from '@/app/firebaseAdmin';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGES = 4;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb();
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`donate-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(req);

    // Authentication
    const user = await getUserFromAuth(req) as {
      uid: string;
      email?: string;
      name?: string;
      displayName?: string;
      avatar?: string;
    };

    const formData = await req.formData();
    const foodName = formData.get('foodName') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const images = formData.getAll('images') as File[];
    const expiryDate = formData.get('expiryDate') as string;
    const pickupInstructions = (formData.get('pickupInstructions') as string) || '';
    const category = (formData.get('category') as string) || '';
    const quantityServingsValue = formData.get('quantityServings') as string;
    const allergensValue = (formData.get('allergens') as string) || '';
    const packaging = (formData.get('packaging') as string) || '';
    const pickupWindowStart = (formData.get('pickupWindowStart') as string) || '';
    const pickupWindowEnd = (formData.get('pickupWindowEnd') as string) || '';
    const locationLatValue = formData.get('locationLat') as string;
    const locationLngValue = formData.get('locationLng') as string;

    // Validate required fields
    if (!foodName || !description || !location || images.length === 0) {
      throw new ValidationError('Missing required fields. At least one image is required.');
    }

    // Validate and sanitize inputs
    const validatedFoodName = validateFoodName(foodName);
    const validatedDescription = validateDescription(description);
    const validatedLocation = validateLocation(location);
    const validatedExpiryDate = validateDate(expiryDate);
    const validatedCategory = category ? validateCategory(category) : undefined;
    const validatedServings = quantityServingsValue ? validateServings(Number(quantityServingsValue)) : undefined;
    const validatedAllergens = allergensValue ? validateAllergens(allergensValue) : [];
    const validatedPackaging = packaging ? validatePackaging(packaging) : undefined;
    const validatedPickupWindowStart = pickupWindowStart ? validatePickupWindow(pickupWindowStart) : undefined;
    const validatedPickupWindowEnd = pickupWindowEnd ? validatePickupWindow(pickupWindowEnd) : undefined;
    const locationLat = locationLatValue ? Number(locationLatValue) : undefined;
    const locationLng = locationLngValue ? Number(locationLngValue) : undefined;
    const locationCoords = Number.isFinite(locationLat) && Number.isFinite(locationLng)
      ? { lat: locationLat as number, lng: locationLng as number }
      : undefined;

    // Validate images
    if (images.length > MAX_IMAGES) {
      throw new ValidationError(`Maximum ${MAX_IMAGES} images allowed`);
    }

    const validImages: File[] = [];
    for (const image of images) {
      if (!(image instanceof File)) continue;
      
      try {
        validateFileType(image, ALLOWED_IMAGE_TYPES);
        validateFileSize(image, 5); // 5MB max
        validImages.push(image);
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(`Image validation failed: ${error.message}`);
        }
      }
    }

    // Upload images to Cloudinary
    const imageUrls: string[] = [];
    for (const image of validImages) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const uploadUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: 'donated_food',
            resource_type: 'auto',
            quality: 'auto:good',
          },
          (error, result) => {
            if (error) return reject(error);
            if (result?.secure_url) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Failed to upload image'));
            }
          }
        );
        stream.end(buffer);
      });
      imageUrls.push(uploadUrl);
    }

    // Create donation document
    const docRef = await db.collection('donated_food').add({
      foodName: validatedFoodName,
      description: validatedDescription,
      location: validatedLocation,
      expiryDate: validatedExpiryDate,
      pickupInstructions: pickupInstructions.substring(0, 500),
      imageUrls,
      category: validatedCategory || '',
      quantityServings: validatedServings ?? null,
      allergens: validatedAllergens,
      packaging: validatedPackaging || '',
      pickupWindowStart: validatedPickupWindowStart || '',
      pickupWindowEnd: validatedPickupWindowEnd || '',
      locationCoords: locationCoords || null,
      status: 'available',
      reservedBy: null,
      reservedAt: null,
      pickedUpAt: null,
      userId: user.uid,
      userEmail: user.email,
      userName: user.name || user.displayName || 'Anonymous',
      avatar: user.avatar || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      createSuccessResponse({ id: docRef.id }),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`get-donations-${clientId}`)) {
      throw new RateLimitError(300);
    }

    const snapshot = await db
      .collection('donated_food')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const now = Date.now();
    const updates: Promise<unknown>[] = [];
    const donations = snapshot.docs.map(doc => {
      const data = doc.data();
      const expiryDate = data.expiryDate ? new Date(data.expiryDate).getTime() : null;
      const currentStatus = data.status || 'available';
      let nextStatus = currentStatus;
      if ((currentStatus === 'available' || currentStatus === 'reserved') && expiryDate && expiryDate < now) {
        nextStatus = 'expired';
        updates.push(doc.ref.update({ status: 'expired', updatedAt: new Date().toISOString() }));
      }
      return {
        id: doc.id,
        ...data,
        status: nextStatus,
      };
    });

    if (updates.length > 0) {
      await Promise.allSettled(updates);
    }

    const visibleDonations = donations.filter((donation) => donation.status !== "removed");

    return NextResponse.json(
      createSuccessResponse({ donations: visibleDonations }),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getAdminDb();
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`delete-donation-${clientId}`)) {
      throw new RateLimitError(300);
    }

    validateCsrfToken(req);

    // Authentication
    const user = await getUserFromAuth(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Missing donation id');
    }

    // Verify ownership
    const donationDoc = await db.collection('donated_food').doc(id).get();
    if (!donationDoc.exists) {
      throw new ValidationError('Donation not found');
    }

    const donation = donationDoc.data();
    if (donation?.userId !== user.uid) {
      throw new AuthenticationError('You can only delete your own donations');
    }

    // Delete images from Cloudinary
    if (donation?.imageUrls && Array.isArray(donation.imageUrls)) {
      for (const imageUrl of donation.imageUrls) {
        try {
          const publicId = extractPublicId(imageUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with deletion even if image deletion fails
        }
      }
    }

    // Delete donation document
    await db.collection('donated_food').doc(id).delete();

    return NextResponse.json(
      createSuccessResponse({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

function extractPublicId(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split('/');
    // Cloudinary URLs are like: /image/upload/v1234/folder/filename
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId ? `donated_food/${publicId}` : null;
  } catch {
    return null;
  }
}
