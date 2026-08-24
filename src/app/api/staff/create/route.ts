import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendStaffInvitationEmail } from '@/services/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      role,
      staffId,
      businessId,
      permissions,
      businessName,
      sendInvite = true,
    } = body;

    console.log('📡 [API] Creating staff user:', { email, name, role, staffId, businessId });

    if (!email || !password || !name || !role || !staffId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Supabase requires strong-enough passwords; enforce basic shape server-side
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const adminDb = getAdminDb();

    const staffRole = String(role).trim() || 'Staff';
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    let userId: string;
    let isNewUser = true;

    try {
      // Prefer getUserByEmail if available; fall back to listUsers scan
      let existingUser: { id: string } | null = null;
      try {
        const byEmail = await (supabase.auth.admin as any).getUserByEmail?.(cleanEmail);
        if (byEmail?.data?.user) existingUser = byEmail.data.user;
      } catch {
        /* older SDK */
      }
      if (!existingUser) {
        const { data: listed } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        existingUser =
          listed?.users?.find(
            (u: { email?: string }) => (u.email || '').toLowerCase() === cleanEmail
          ) || null;
      }

      const metadata = {
        full_name: cleanName,
        role: staffRole,
        businessId,
        staffId,
        must_change_password: true,
      };

      if (existingUser) {
        userId = existingUser.id;
        isNewUser = false;
        const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: metadata,
        });
        if (updateErr) throw updateErr;
        console.log('✅ [API] Updated existing auth user for staff:', userId);
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true, // invite flow — no confirm barrier for staff
          user_metadata: metadata,
        });
        if (createError) throw createError;
        userId = newUser!.user!.id;
        console.log('✅ [API] Staff auth user created:', userId);
      }
    } catch (error: any) {
      console.error('❌ [API] Error creating/updating user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Staff doc keyed by auth uid
    const staffRef = adminDb.collection('businesses').doc(businessId).collection('staff').doc(userId);
    await staffRef.set(
      {
        staffId,
        name: cleanName,
        email: cleanEmail,
        role: staffRole,
        permissions: permissions || {},
        createdAt: new Date().toISOString(),
        status: 'active',
        mustChangePassword: true,
        uid: userId,
      },
      { merge: true }
    );

    // Users collection
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.set(
      {
        name: cleanName,
        fullName: cleanName,
        displayName: cleanName,
        email: cleanEmail,
        role: staffRole,
        businessId,
        permissions: permissions || {},
        staffId,
        status: 'active',
        mustChangePassword: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    let emailSent = false;
    let emailError: string | null = null;
    if (sendInvite !== false) {
      try {
        await sendStaffInvitationEmail(
          cleanEmail,
          cleanName,
          businessName || 'your team on Busmo',
          password
        );
        emailSent = true;
        console.log('✅ [API] Staff invitation email sent to', cleanEmail);
      } catch (err: any) {
        emailError = err?.message || 'Failed to send invitation email';
        console.error('❌ [API] Invitation email failed:', emailError);
      }
    }

    return NextResponse.json({
      uid: userId,
      isNewUser,
      email: cleanEmail,
      generatedPassword: password,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error('❌ [API] Error creating staff:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
