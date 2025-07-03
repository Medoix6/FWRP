import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { v2 as cloudinary } from 'cloudinary';


if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const foodName = formData.get('foodName');
    const description = formData.get('description');
    const location = formData.get('location');
    const image = formData.get('image');
    const userId = formData.get('userId');
    const expiryDate = formData.get('expiryDate');
    const pickupInstructions = formData.get('pickupInstructions');

    if (!foodName || !description || !location || !image || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let imageUrl = '';
    if (typeof image === 'object' && 'arrayBuffer' in image) {
      const buffer = Buffer.from(await image.arrayBuffer());
      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'donated_food' }, (error, result) => {
          if (error) return reject(error);
          imageUrl = result?.secure_url || '';
          resolve(result);
        });
        stream.end(buffer);
      });
    }

    let avatar = '';
    try {
      const userDoc = await db.collection('users').doc(userId.toString()).get();
      const userData = userDoc.exists ? userDoc.data() : undefined;
      if (userData && userData.avatar) {
        avatar = userData.avatar;
      }
    } catch (e) {
    }

    const docRef = await db.collection('donated_food').add({
      foodName,
      description,
      location,
      expiryDate,
      pickupInstructions,
      imageUrl,
      userId,
      avatar,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    let message = 'Server error';
    if (error && typeof error === 'object' && 'message' in error) {
      message = (error as unknown as { message?: string }).message ?? 'Server error';
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('donated_food').orderBy('createdAt', 'desc').get();
    const donations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ donations });
  } catch (error) {
    let message = 'Server error';
    if (error && typeof error === 'object' && 'message' in error) {
      message = (error as unknown as { message?: string }).message ?? 'Server error';
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing donation id' }, { status: 400 });
    }

    await db.collection('donated_food').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    let message = 'Server error';
    if (error && typeof error === 'object' && 'message' in error) {
      message = (error as unknown as { message?: string }).message ?? 'Server error';
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
