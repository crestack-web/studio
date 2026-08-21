import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, plan } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const adminDb = getAdminDb();

    console.log('🔍 [restore-user-access] Attempting to restore access for email:', email);
    
    // Find user by email in Supabase auth
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const supabaseUser = users.users.find(u => u.email === email);
    if (!supabaseUser) {
      console.error('❌ [restore-user-access] User not found with email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = supabaseUser.id;

    // Also check Firestore via Supabase facade for user data
    const usersSnapshot = await adminDb.collection('users').where('email', '==', email).get();

    let currentPlan = 'standard';
    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      currentPlan = userData.plan || 'standard';
    }

    console.log('✅ [restore-user-access] User found:', { userId, currentPlan });

    // Calculate subscription end date (default to 1 year from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

    // Update user's plan in Firestore (via Supabase facade)
    const targetPlan = plan || currentPlan;
    
    if (!usersSnapshot.empty) {
      await adminDb.collection('users').doc(userId).update({
        plan: targetPlan,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: subscriptionEndDate,
        updatedAt: new Date(),
      });
    }

    console.log('✅ [restore-user-access] User access restored successfully:', { userId, plan: targetPlan });

    return NextResponse.json({ 
      success: true, 
      userId: userId,
      email: email,
      plan: targetPlan,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    });

  } catch (error) {
    console.error('❌ [restore-user-access] Error:', error);
    return NextResponse.json({ error: 'Failed to restore user access' }, { status: 500 });
  }
}
