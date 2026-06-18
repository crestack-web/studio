import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth, isAdminInitialized } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, staffId, businessId, permissions } = await request.json();

    if (!email || !password || !name || !role || !staffId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized. Check environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL' },
        { status: 500 }
      );
    }

    const db = getAdminDb();
    const auth = getAdminAuth();

    // Check if user already exists
    const usersQuery = db.collection('users').where('email', '==', email);
    const userSnapshot = await usersQuery.get();

    if (!userSnapshot.empty) {
      const existingUserDoc = userSnapshot.docs[0];
      const existingUserData = existingUserDoc.data();
      
      // Check if this user is already a staff member for this business
      const existingStaffDoc = await db.doc(`businesses/${businessId}/staff/${existingUserDoc.id}`).get();
      
      if (existingStaffDoc.exists) {
        return NextResponse.json(
          { error: 'This email is already registered as a staff member for this business.' },
          { status: 400 }
        );
      }
      
      // User exists but not as staff for this business - link them
      await db.doc(`users/${existingUserDoc.id}`).set({
        role: existingUserData.role === 'Owner' ? 'Owner' : 'Staff',
        staffId: existingUserData.staffId || staffId,
        businessId: existingUserData.businessId || businessId,
        permissions: permissions,
        initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
      }, { merge: true });

      // Create staff member in businesses collection
      await db.doc(`businesses/${businessId}/staff/${existingUserDoc.id}`).set({
        name: name,
        email: email,
        role: role,
        staffId: staffId,
        permissions: permissions,
        status: 'active',
        createdAt: new Date(),
        revenue: 0,
        transactions: 0,
        online: false,
      });

      return NextResponse.json({ uid: existingUserDoc.id, isNewUser: false });
    }

    // Create new Firebase Auth user using Admin SDK
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Create user profile in Firestore
    await db.doc(`users/${userRecord.uid}`).set({
      displayName: name,
      email: email,
      role: 'Staff',
      staffId: staffId,
      businessId: businessId,
      permissions: permissions,
      initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
      createdAt: new Date(),
    });

    // Create staff member in businesses collection
    await db.doc(`businesses/${businessId}/staff/${userRecord.uid}`).set({
      name: name,
      email: email,
      role: role,
      staffId: staffId,
      permissions: permissions,
      status: 'active',
      createdAt: new Date(),
      revenue: 0,
      transactions: 0,
      online: false,
    });

    return NextResponse.json({ uid: userRecord.uid, isNewUser: true });
  } catch (error: any) {
    console.error('Error creating staff user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'This email is already in use' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create staff user' },
      { status: 500 }
    );
  }
}
