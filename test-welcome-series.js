// Test script for welcome email series
// Sends all 5 emails to test the formatting and delivery

require('dotenv').config();
const { sendWelcomeEmail1, sendWelcomeEmail2, sendWelcomeEmail3, sendWelcomeEmail4, sendWelcomeEmail5 } = require('./src/services/email/welcome-series');

const TEST_EMAIL = 'crestack@gmail.com';
const TEST_NAME = 'Test User';
const TEST_BUSINESS = 'Test Business';

async function testWelcomeSeries() {
  console.log('🚀 Starting Welcome Email Series Test...\n');
  console.log(`Sending to: ${TEST_EMAIL}\n`);

  try {
    // Email 1 - Welcome
    console.log('1️⃣  Sending Email 1: Welcome...');
    await sendWelcomeEmail1({
      email: TEST_EMAIL,
      name: TEST_NAME,
      businessName: TEST_BUSINESS
    });
    console.log('✅ Email 1 sent successfully\n');

    // Wait 2 seconds before next email
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Email 2 - Pro Tip
    console.log('2️⃣  Sending Email 2: Pro Tip...');
    await sendWelcomeEmail2({
      email: TEST_EMAIL,
      name: TEST_NAME
    });
    console.log('✅ Email 2 sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Email 3 - Ask Mo AI
    console.log('3️⃣  Sending Email 3: Ask Mo AI...');
    await sendWelcomeEmail3({
      email: TEST_EMAIL,
      name: TEST_NAME
    });
    console.log('✅ Email 3 sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Email 4 - Track Growth
    console.log('4️⃣  Sending Email 4: Track Growth...');
    await sendWelcomeEmail4({
      email: TEST_EMAIL,
      name: TEST_NAME
    });
    console.log('✅ Email 4 sent successfully\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Email 5 - You're All Set
    console.log('5️⃣  Sending Email 5: You\'re All Set...');
    await sendWelcomeEmail5({
      email: TEST_EMAIL,
      name: TEST_NAME
    });
    console.log('✅ Email 5 sent successfully\n');

    console.log('🎉 All 5 welcome emails sent successfully!');
    console.log(`\nPlease check ${TEST_EMAIL} for the emails.`);
    console.log('\nEmail Schedule:');
    console.log('  - Email 1: Day 0 (Welcome)');
    console.log('  - Email 2: Day 1 (Pro Tip)');
    console.log('  - Email 3: Day 3 (Ask Mo AI)');
    console.log('  - Email 4: Day 5 (Track Growth)');
    console.log('  - Email 5: Day 7 (You\'re All Set)');

  } catch (error) {
    console.error('❌ Error sending emails:', error);
    process.exit(1);
  }
}

// Run the test
testWelcomeSeries();