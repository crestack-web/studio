// Test script to trigger sendOtpLogin and verify email delivery
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const FUNCTION_URL = process.env.OTP_FUNCTION_URL || 'https://us-central1-bizassistant2-62305643.cloudfunctions.net/sendOtpLogin'; // Updated with your deployed function URL
const TEST_EMAIL = process.env.TEST_EMAIL || 'your_verified_support@busmo.io';

async function sendTestOtp() {
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, role: 'Admin' }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      console.error('Failed to send OTP:', result.error || 'Unknown error');
      process.exit(1);
    }
    console.log('OTP sent successfully. Check your inbox and Firestore emailLogs for delivery status.');
  } catch (error) {
    console.error('Error sending OTP:', error);
    process.exit(1);
  }
}

sendTestOtp();
