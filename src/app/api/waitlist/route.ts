import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, Timestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...formData } = body;

    const { firestore } = initializeFirebase();
    
    // Determine collection based on waitlist type
    const collectionName = type === 'seller' ? 'seller_waitlist' : 'investor_waitlist';
    
    const docData = {
      ...formData,
      type,
      createdAt: Timestamp.now(),
      status: 'pending',
    };

    const docRef = await addDoc(collection(firestore, collectionName), docData);
    
    console.log(`✅ Waitlist submission saved: ${docRef.id} (${type})`);
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Successfully joined the waitlist'
    });
  } catch (error) {
    console.error('❌ Error saving waitlist submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'seller';
    const limitCount = parseInt(searchParams.get('limit') || '50');

    const { firestore } = initializeFirebase();
    
    const collectionName = type === 'seller' ? 'seller_waitlist' : 'investor_waitlist';
    const q = query(
      collection(firestore, collectionName),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length
    });
  } catch (error) {
    console.error('❌ Error fetching waitlist submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
