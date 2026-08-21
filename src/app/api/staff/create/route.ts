import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAdminDb } from '@/lib/firebase-admin';

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

    const supabase = getSupabaseAdmin();
    const adminDb = getAdminDb();

    // Create user with Supabase Auth Admin SDK
    let userId: string;
    let isNewUser = true;

    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email.trim());

      if (existingUser) {
        // User already exists - update password
        userId = existingUser.id;
        isNewUser = false;
        await supabase.auth.admin.updateUserById(userId, { password: password });
        console.log('✅ [API] Updated password for existing user:', userId);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email.trim(),
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: name.trim(),
          },
        });

        if (createError) throw createError;
        userId = newUser!.user!.id;
        console.log('✅ [API] User created successfully:', userId);
      }
    } catch (error: any) {
      console.error('❌ [API] Error creating/updating user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create/update staff document in Firestore (via Supabase facade)
    const staffRef = adminDb.collection('businesses').doc(businessId).collection('staff').doc(userId);
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
    const userRef = adminDb.collection('users').doc(userId);
    const userData = {
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      businessId,
      permissions: permissions || {},
      staffId,
      status: 'active',
    };
    await userRef.set(userData, { merge: true });
    console.log('✅ [API] User document created/updated:', userId, userData);

    console.log('✅ [API] Staff created successfully:', userId);

    return NextResponse.json({
      uid: userId,
      isNewUser,
      email: email.trim(),
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
