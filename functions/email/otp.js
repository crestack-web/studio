// OTP utility for generating and verifying one-time passwords
const admin = require('firebase-admin');

function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

async function storeOTP(email, otp, role) {
  const db = admin.firestore();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  await db.collection('otpLogins').doc(email).set({
    otp,
    role,
    expiresAt,
    attempts: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function verifyOTP(email, otp) {
  const db = admin.firestore();
  const docRef = db.collection('otpLogins').doc(email);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return false;
  const data = docSnap.data();
  if (data.otp !== otp) return false;
  if (Date.now() > data.expiresAt) return false;
  await docRef.delete(); // Invalidate OTP after use
  return true;
}

module.exports = { generateOTP, storeOTP, verifyOTP };