// Script to restore user access directly via Firebase Admin
// Run with: npx tsx scripts/restore-user-access.ts

import { initializeFirebase } from '../src/firebase';
import { getFirestore, doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';

async function restoreUserAccess(email: string, plan: string = 'standard') {
  console.log('🔍 Restoring access for email:', email);
  
  const { firestore } = initializeFirebase();
  
  // Find user by email
  const usersQuery = query(collection(firestore, 'users'), where('email', '==', email));
  const usersSnapshot = await getDocs(usersQuery);

  if (usersSnapshot.empty) {
    console.error('❌ User not found with email:', email);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log('✅ User found:', { userId, currentPlan: userData.plan });

  // Calculate subscription end date (default to 1 year from now)
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

  // Update user's plan
  await updateDoc(doc(firestore, 'users', userId), {
    plan: plan,
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date(),
    subscriptionEndDate: subscriptionEndDate,
    updatedAt: new Date(),
  });

  console.log('✅ User access restored successfully:', { 
    userId, 
    email, 
    plan, 
    subscriptionEndDate: subscriptionEndDate.toISOString() 
  });
}

// Run the script
restoreUserAccess('shehubashir647@gmail.com', 'standard')
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
