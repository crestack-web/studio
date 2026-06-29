import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, staffId, businessId, permissions } = body;

    console.log('📡 [API] Creating staff user:', { email, name, role, staffId, businessId });

    // Validate required fields
    if (!email || !password || !name || !role || !staffId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Create user with Firebase Admin SDK
    let userRecord;
    let isNewUser = true;

    try {
      userRecord = await adminAuth.createUser({
        email: email.trim(),
        password: password,
        displayName: name.trim(),
      });
      console.log('✅ [API] User created successfully:', userRecord.uid);
    } catch (error: any) {
      // Check if user already exists
      if (error.code === 'auth/email-already-exists') {
        // Try to get existing user
        try {
          const existingUser = await adminAuth.getUserByEmail(email.trim());
          userRecord = existingUser;
          isNewUser = false;
          // Update password for existing user so the generated credentials work
          await adminAuth.updateUser(userRecord.uid, { password: password });
          console.log('✅ [API] Updated password for existing user:', userRecord.uid);
        } catch (getUserError) {
          console.error('❌ [API] Error getting existing user:', getUserError);
          return NextResponse.json(
            { error: 'Email already exists but could not retrieve user' },
            { status: 400 }
          );
        }
      } else {
        console.error('❌ [API] Error creating user:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    // Create/update staff document in Firestore
    const staffRef = adminDb.collection('businesses').doc(businessId).collection('staff').doc(userRecord.uid);
    await staffRef.set({
      staffId,
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      permissions: permissions || {},
      createdAt: new Date().toISOString(),
      status: 'active',
    }, { merge: true });

    // Create/update user document
    const userRef = adminDb.collection('users').doc(userRecord.uid);
    await userRef.set({
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      businessId,
      permissions: permissions || {},
      staffId,
      status: 'active',
    }, { merge: true });

    console.log('✅ [API] Staff created successfully:', userRecord.uid);

    return NextResponse.json({
      uid: userRecord.uid,
      isNewUser,
      email: userRecord.email,
      generatedPassword: password,
    });
  } catch (error) {
    console.error('❌ [API] Error creating staff:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
