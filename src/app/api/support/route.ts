import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, category, userId, businessId, businessName } = body;

    if (!message || !userEmail) {
      return NextResponse.json({ error: 'Message and email are required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    if (!firestore) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // If userId is provided, fetch additional user data
    let userData = {
      businessId: businessId || null,
      businessName: businessName || null,
    };

    if (userId) {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          userData.businessId = data.businessId || null;
          userData.businessName = data.businessName || null;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    const docRef = await addDoc(collection(firestore, 'supportMessages'), {
      userId: userId || userEmail,
      userEmail,
      businessId: userData.businessId,
      businessName: userData.businessName,
      message,
      status: 'unread',
      category: category || 'general',
      createdAt: serverTimestamp(),
      replies: [],
    });

    return NextResponse.json({ id: docRef.id, status: 'unread' });
  } catch (error) {
    console.error('Support message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}