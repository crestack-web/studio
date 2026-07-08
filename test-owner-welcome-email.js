// Test script for owner welcome email series
import { initializeFirebase } from './src/firebase/index.ts';
import { sendOwnerWelcomeEmailSeries } from './src/services/email/owner-welcome-series.ts';

async function testOwnerWelcomeEmail() {
  try {
    console.log('🚀 Sending owner welcome email series to majnun@busmo.io...\n');
    
    const result = await sendOwnerWelcomeEmailSeries({
      email: 'majnun@busmo.io',
      name: 'Majnun',
      businessName: 'Test Business'
    });
    
    console.log('\n✅ All 5 emails sent successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Failed to send email series:', error);
  }
}

// Initialize Firebase (required for email service)
initializeFirebase()
  .then(() => {
    console.log('✓ Firebase initialized\n');
    return testOwnerWelcomeEmail();
  })
  .catch((error) => {
    console.error('❌ Firebase initialization failed:', error);
  });