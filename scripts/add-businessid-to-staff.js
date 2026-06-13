const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function addBusinessIdToStaff() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Get staff user UID and business ID from command line arguments
    const staffUid = process.argv[2];
    const businessId = process.argv[3];
    const ownerEmail = process.argv[4];
    const ownerPassword = process.argv[5];

    if (!staffUid || !businessId || !ownerEmail || !ownerPassword) {
      console.error('Usage: node add-businessid-to-staff.js <staffUid> <businessId> <ownerEmail> <ownerPassword>');
      console.error('Example: node add-businessid-to-staff.js abc123xyz business456 owner@example.com password123');
      process.exit(1);
    }

    console.log(`Adding businessId ${businessId} to staff user ${staffUid}...`);

    // Sign in as owner to get admin access
    await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
    console.log('Signed in as owner');

    // Update staff user document with businessId
    const staffUserRef = doc(db, 'users', staffUid);
    await updateDoc(staffUserRef, {
      businessId: businessId
    });

    console.log(`Successfully added businessId ${businessId} to staff user ${staffUid}`);
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addBusinessIdToStaff();
