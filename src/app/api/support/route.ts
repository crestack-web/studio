import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, category } = body;

    if (!message || !userEmail) {
      return NextResponse.json({ error: 'Message and email are required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    if (!firestore) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const docRef = await addDoc(collection(firestore, 'supportMessages'), {
      userId: userEmail,
      userEmail,
      businessId: null,
      businessName: null,
      message,
      status: 'open',
      category: category || 'general',
      createdAt: serverTimestamp(),
      replies: [],
    });

    return NextResponse.json({ id: docRef.id, status: 'open' });
  } catch (error) {
    console.error('Support message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}