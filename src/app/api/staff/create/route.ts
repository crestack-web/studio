import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAdminDb, getNativeAdminFirestore, isAdminInitialized } from '@/lib/firebase-admin';
import { sendStaffInvitationEmail } from '@/services/email/brevo-service';

/**
 * Staff may belong to exactly one business at a time.
 * Re-invite to the same business is allowed; assigning an active staff
 * email to a different business is rejected (409).
 */
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

    console.log('📡 [API] Creating staff user:', {
      email,
      name,
      role,
      staffId,
      businessId,
    });

    if (!email || !password || !name || !role || !staffId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
    const targetBusinessId = String(businessId).trim();

    // ── 1) Resolve existing auth user by email ──────────────────────────
    let existingAuthUser: {
      id: string;
      user_metadata?: Record<string, unknown>;
    } | null = null;
    try {
      const byEmail = await (supabase.auth.admin as any).getUserByEmail?.(
        cleanEmail
      );
      if (byEmail?.data?.user) existingAuthUser = byEmail.data.user;
    } catch {
      /* older SDK */
    }
    if (!existingAuthUser) {
      const { data: listed } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });
      existingAuthUser =
        listed?.users?.find(
          (u: { email?: string }) =>
            (u.email || '').toLowerCase() === cleanEmail
        ) || null;
    }

    // ── 2) One-business rule: block if already active elsewhere ─────────
    let previousBusinessId: string | null = null;

    // users collection by email
    try {
      const usersByEmail = await adminDb
        .collection('users')
        .where('email', '==', cleanEmail)
        .limit(5)
        .get();
      for (const docSnap of usersByEmail.docs) {
        const data = docSnap.data() || {};
        const bid = data.businessId ? String(data.businessId) : null;
        const roleLc = String(data.role || '').toLowerCase();
        if (bid && bid !== targetBusinessId && roleLc !== 'removed') {
          // Confirm they still have an active staff record there
          const staffElsewhere = await adminDb
            .collection('businesses')
            .doc(bid)
            .collection('staff')
            .doc(docSnap.id)
            .get();
          const st = staffElsewhere.exists
            ? String(staffElsewhere.data()?.status || 'active')
            : 'missing';
          if (st !== 'removed' && st !== 'missing') {
            const otherBiz = await adminDb
              .collection('businesses')
              .doc(bid)
              .get();
            const otherName =
              otherBiz.data()?.businessName ||
              otherBiz.data()?.name ||
              'another business';
            return NextResponse.json(
              {
                error: `This email is already staff of ${otherName}. Each staff account can only belong to one business. Ask that owner to remove them first.`,
                code: 'STAFF_ALREADY_ASSIGNED',
                existingBusinessId: bid,
              },
              { status: 409 }
            );
          }
        }
        if (bid) previousBusinessId = bid;
      }
    } catch (e) {
      console.warn('[API] users-by-email check failed', e);
    }

    if (existingAuthUser) {
      const metaBiz = existingAuthUser.user_metadata?.businessId
        ? String(existingAuthUser.user_metadata.businessId)
        : null;
      const userDoc = await adminDb
        .collection('users')
        .doc(existingAuthUser.id)
        .get();
      const docBiz = userDoc.exists && userDoc.data()?.businessId
        ? String(userDoc.data()!.businessId)
        : null;
      const claimedBiz = docBiz || metaBiz;

      if (claimedBiz && claimedBiz !== targetBusinessId) {
        const staffElsewhere = await adminDb
          .collection('businesses')
          .doc(claimedBiz)
          .collection('staff')
          .doc(existingAuthUser.id)
          .get();
        const st = staffElsewhere.exists
          ? String(staffElsewhere.data()?.status || 'active')
          : 'missing';
        const roleLc = String(
          userDoc.data()?.role || existingAuthUser.user_metadata?.role || ''
        ).toLowerCase();

        if (
          roleLc !== 'removed' &&
          st !== 'removed' &&
          (staffElsewhere.exists || docBiz)
        ) {
          // Owner account (not staff) — still block sharing identity as staff of another biz
          if (roleLc === 'owner' || roleLc === 'admin') {
            return NextResponse.json(
              {
                error:
                  'This email belongs to a business owner account and cannot be added as staff of another business.',
                code: 'EMAIL_IS_OWNER',
              },
              { status: 409 }
            );
          }
          if (st !== 'missing') {
            const otherBiz = await adminDb
              .collection('businesses')
              .doc(claimedBiz)
              .get();
            const otherName =
              otherBiz.data()?.businessName ||
              otherBiz.data()?.name ||
              'another business';
            return NextResponse.json(
              {
                error: `This email is already staff of ${otherName}. Each staff account can only belong to one business. Ask that owner to remove them first.`,
                code: 'STAFF_ALREADY_ASSIGNED',
                existingBusinessId: claimedBiz,
              },
              { status: 409 }
            );
          }
        }
        previousBusinessId = claimedBiz;
      }
    }

    // ── 3) Create or update auth user (same business only reaches here) ─
    let userId: string;
    let isNewUser = true;

    const metadata = {
      full_name: cleanName,
      role: staffRole,
      businessId: targetBusinessId,
      staffId,
      must_change_password: true,
    };

    try {
      if (existingAuthUser) {
        userId = existingAuthUser.id;
        isNewUser = false;
        const { error: updateErr } = await supabase.auth.admin.updateUserById(
          userId,
          {
            password,
            email_confirm: true,
            user_metadata: metadata,
          }
        );
        if (updateErr) throw updateErr;
        console.log('✅ [API] Updated existing auth user for staff:', userId);
      } else {
        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
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

    // ── 4) Clean stale staff docs from a previous (removed) business ─────
    if (
      previousBusinessId &&
      previousBusinessId !== targetBusinessId
    ) {
      try {
        await adminDb
          .collection('businesses')
          .doc(previousBusinessId)
          .collection('staff')
          .doc(userId)
          .set(
            {
              status: 'removed',
              removedAt: new Date().toISOString(),
              removedReason: 'reassigned_or_cleared',
            },
            { merge: true }
          );
      } catch (e) {
        console.warn('[API] could not mark previous staff removed', e);
      }
    }

    // ── 5) Write single source of truth ─────────────────────────────────
    const staffRef = adminDb
      .collection('businesses')
      .doc(targetBusinessId)
      .collection('staff')
      .doc(userId);
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
        businessId: targetBusinessId,
      },
      { merge: true }
    );

    const userRef = adminDb.collection('users').doc(userId);
    await userRef.set(
      {
        name: cleanName,
        fullName: cleanName,
        displayName: cleanName,
        email: cleanEmail,
        role: staffRole,
        businessId: targetBusinessId,
        permissions: permissions || {},
        staffId,
        status: 'active',
        mustChangePassword: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );


    // Dual-write to real Firebase Firestore so client SDK (security rules) can read
    if (isAdminInitialized()) {
      try {
        const native = getNativeAdminFirestore();
        await native
          .collection('businesses')
          .doc(targetBusinessId)
          .collection('staff')
          .doc(userId)
          .set(
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
              businessId: targetBusinessId,
            },
            { merge: true }
          );
        await native
          .collection('users')
          .doc(userId)
          .set(
            {
              name: cleanName,
              fullName: cleanName,
              displayName: cleanName,
              email: cleanEmail,
              role: staffRole,
              businessId: targetBusinessId,
              permissions: permissions || {},
              staffId,
              status: 'active',
              mustChangePassword: true,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        console.log('✅ [API] Dual-wrote staff profile to Firebase Firestore');
      } catch (nativeErr) {
        console.error('❌ [API] Native Firestore dual-write failed', nativeErr);
      }
    }

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
      businessId: targetBusinessId,
    });
  } catch (error) {
    console.error('❌ [API] Error creating staff:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
