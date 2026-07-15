const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc } = require('firebase/firestore');
const axios = require('axios');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3';

if (!BREVO_API_KEY) {
  console.warn('BREVO_API_KEY not found in environment variables');
}

// Brevo API instance
const brevoApi = axios.create({
  baseURL: BREVO_API_URL,
  headers: {
    'api-key': BREVO_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Send transactional email function
async function sendTransactionalEmail(email) {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  try {
    const sendSmtpEmail = {
      to: email.to,
      subject: email.subject,
      htmlContent: email.htmlContent,
      sender: email.sender || {
        name: 'Busmo Support',
        email: 'support@busmo.io',
      },
      params: email.params,
    };

    const response = await brevoApi.post('/smtp/email', sendSmtpEmail);
    console.log('Transactional email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending transactional email:', error);
    throw new Error('Failed to send transactional email');
  }
}

const BUSMO_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAtGVYSWZJSSoACAAAAAYAEgEDAAEAAAABAAAAGgEFAAEAAABWAAAAGwEFAAEAAABeAAAAKAEDAAEAAAACAAAAEwIDAAEAAAABAAAAaYcEAAEAAABmAAAAAAAAAGAAAAABAAAAYAAAAAEAAAAGAACQBwAEAAAAMDIxMAGRBwAEAAAAAQIDAACgBwAEAAAAMDEwMAGgAwABAAAA//8AAAKgBAABAAAA9AEAAAOgBAABAAAA9AEAAAAAAAAA4cNEAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF1mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zJyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTAyLTA3PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUctd2xCT0lvMCZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBR3kzUUpfNGlZJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0JBR3kzZTVObENvJnF1b3Q7LCZxdW90O3RlbXBsYXRlJnF1b3Q7OiZxdW90O09yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyZxdW90O308L0F0dHJpYjpEYXRhPgogICAgIDxBdHRyaWI6RXh0SWQ+M2YyZTNkNTEtOTA0OS00YmM4LTkwZjAtMTcxMGZmYzFkYjQ2PC9BdHRyaWI6RXh0SWQ+CiAgICAgPEF0dHJpYjpGYklkPjUyNTI2NTkxNDE3OTU4MDwvQXR0cmFiOkZiSWQ+CiAgICAgPEF0dHJpYjpUb3VjaFR5cGU+MjwvQXR0cmFiOlRvdWNoVHlwZT4KICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPk9yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyAtIDI8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnBkZj0naHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyc+CiAgPHBkZjpBdXRob3I+dGFoZWVyYXRmb29kczwvcGRmOkF1dGhvcj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6eGlmPSdodHRwOi8vbnMuYWRvYmUuY29tL3hpZi8xLjAvJz4KICA8eGlmOk9yaWVudGF0aW9uPjE8L3hpZjpPcmllbnRhdGlvbj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKPC9yZGY6UkRGPgo8L3htcDpDcmVhdG9yQ29udGVudD4KPC94bXBwLzppbWFnZT4+';

const getEmailHeader = (icon, title, subtitle) => `
  <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); position: relative; overflow: hidden;">
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('${BUSMO_LOGO}') no-repeat center center; background-size: 200px; opacity: 0.1;"></div>
    <div style="position: relative; z-index: 1;">
      <img src="${BUSMO_LOGO}" alt="Busmo Logo" style="width: 80px; height: 80px; margin-bottom: 16px; display: inline-block; border-radius: 16px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h1 style="margin: 16px 0 8px; font-size: 28px; font-weight: 700; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.95; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${subtitle}</p>
    </div>
  </div>
`;

const SOCIAL_LINKS = `
  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
    <p style="font-size: 12px; color: #6B7280; margin-bottom: 12px;">Follow us on social media</p>
    <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
      <a href="https://x.com/busmohq" target="_blank" rel="noreferrer" style="display: inline-flex; align-items: center; gap: 6px; color: #6B3FE7; text-decoration: none; font-size: 12px; padding: 6px 12px; background: #F3EFFE; border-radius: 6px;">
        @busmohq
      </a>
      <a href="https://instagram.com/busmodotio" target="_blank" rel="noreferrer" style="display: inline-flex; align-items: center; gap: 6px; color: #6B3FE7; text-decoration: none; font-size: 12px; padding: 6px 12px; background: #F3EFFE; border-radius: 6px;">
        @busmodotio
      </a>
    </div>
  </div>
`;

async function findUserByEmail(email) {
  console.log(`Searching for user with email: ${email}`);
  
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    console.log('User not found in users collection, checking businesses collection...');
    
    // Also check businesses collection
    const businessesRef = collection(firestore, 'businesses');
    const bq = query(businessesRef, where('ownerEmail', '==', email));
    const businessSnapshot = await getDocs(bq);
    
    if (!businessSnapshot.empty) {
      const businessDoc = businessSnapshot.docs[0];
      console.log('Found business:', businessDoc.id);
      return {
        id: businessDoc.id,
        type: 'business',
        data: businessDoc.data()
      };
    }
    
    return null;
  }
  
  const userDoc = querySnapshot.docs[0];
  console.log('Found user:', userDoc.id);
  return {
    id: userDoc.id,
    type: 'user',
    data: userDoc.data()
  };
}

async function extendTrial(userId, userType) {
  console.log(`Extending trial for ${userType}: ${userId}`);
  
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  
  const collectionName = userType === 'business' ? 'businesses' : 'users';
  const docRef = doc(firestore, collectionName, userId);
  
  await updateDoc(docRef, {
    trialEndsAt: oneWeekFromNow,
    plan: 'trial',
    trialExtended: true,
    trialExtensionReason: 'Sorry for errors during trial - 1 week extension granted'
  });
  
  console.log(`Trial extended to: ${oneWeekFromNow.toISOString()}`);
  return oneWeekFromNow;
}

async function sendSorryEmail(userEmail, userName, businessName, newTrialEndDate) {
  console.log(`Sending sorry email to: ${userEmail}`);
  
  const formattedDate = newTrialEndDate.toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>We're Sorry - Your Busmo Trial Has Been Extended</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .apology-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 25px; margin: 25px 0; border-radius: 8px; }
        .extension-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 25px; margin: 25px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🙏', 'We\'re Sorry', 'Your trial has been extended')}
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          
          <div class="apology-box">
            <h3 style="margin-top: 0; color: #DC2626;">We Apologize for the Issues</h3>
            <p style="color: #555; font-size: 14px;">We understand that you encountered errors during your trial period, and we're truly sorry for the inconvenience this caused. Your experience with Busmo should have been seamless, and we fell short.</p>
          </div>
          
          <p>We want to make this right. As a gesture of goodwill, we've extended your trial access by <strong>one full week</strong> so you can properly test all our features.</p>
          
          <div class="extension-box">
            <h3 style="margin-top: 0; color: #065F46;">✨ Your Trial Extended</h3>
            <p style="color: #555; font-size: 14px;"><strong>New Trial End Date:</strong> ${formattedDate}</p>
            <p style="color: #555; font-size: 14px;">You now have 7 additional days to explore everything Busmo has to offer.</p>
          </div>
          
          <p><strong>What you can do during your extended trial:</strong></p>
          <ul style="color: #555; font-size: 14px; line-height: 1.8;">
            <li>✓ Record sales and track inventory</li>
            <li>✓ Manage expenses and suppliers</li>
            <li>✓ Use Ask MO AI for business insights</li>
            <li>✓ Generate reports and analytics</li>
            <li>✓ Add staff members</li>
          </ul>
          
          <a href="https://busmo.io/dashboard" class="button">Continue Your Trial</a>
          
          <p>If you experienced any specific issues, please reply to this email and let us know. We're committed to making Busmo work perfectly for you.</p>
          
          <p>Thank you for your patience and for giving Busmo a try.</p>
          
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
          ${SOCIAL_LINKS}
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    await sendTransactionalEmail({
      to: [{ email: userEmail, name: userName || 'User' }],
      subject: '🙏 We\'re Sorry - Your Busmo Trial Has Been Extended',
      htmlContent
    });
    console.log('Email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function sendCopyToAdmin(originalEmail, userName, businessName, newTrialEndDate) {
  console.log('Sending copy to admin: crestack@gmail.com');
  
  const formattedDate = newTrialEndDate.toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>COPY: Trial Extension Email Sent</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .info-box { background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%);">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📋 COPY: Trial Extension Email</h1>
        </div>
        <div class="content">
          <p><strong>ADMIN COPY - Trial Extension Notification</strong></p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #6B3FE7;">User Details</h3>
            <p><strong>Email:</strong> ${originalEmail}</p>
            <p><strong>Name:</strong> ${userName || 'N/A'}</p>
            <p><strong>Business:</strong> ${businessName || 'N/A'}</p>
            <p><strong>New Trial End Date:</strong> ${formattedDate}</p>
            <p><strong>Extension Reason:</strong> Sorry for errors during trial - 1 week extension granted</p>
          </div>
          
          <p>A sorry email has been sent to the user extending their trial by 1 week due to errors encountered during their trial period.</p>
          
          <p><strong>Action taken:</strong></p>
          <ul style="color: #555; font-size: 14px; line-height: 1.8;">
            <li>✓ User trial extended by 7 days</li>
            <li>✓ Plan set to 'trial'</li>
            <li>✓ Sorry email sent to user</li>
          </ul>
          
          <p>Best regards,<br><strong>Busmo System</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Automated notification</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    await sendTransactionalEmail({
      to: [{ email: 'crestack@gmail.com', name: 'Admin' }],
      subject: `COPY: Trial Extension - ${originalEmail}`,
      htmlContent
    });
    console.log('Copy sent successfully to admin');
  } catch (error) {
    console.error('Error sending copy to admin:', error);
    throw error;
  }
}

async function main() {
  const userEmail = 'muhammadtahirsani@gmail.com';
  
  try {
    console.log('=== Starting Trial Extension Process ===');
    
    // Step 1: Find user
    const user = await findUserByEmail(userEmail);
    if (!user) {
      console.error('User not found:', userEmail);
      return;
    }
    
    const userName = user.data.fullName || user.data.name || user.data.displayName || 'User';
    const businessName = user.data.businessName || 'Business';
    
    console.log('User found:', userName);
    console.log('Business:', businessName);
    
    // Step 2: Extend trial
    const newTrialEndDate = await extendTrial(user.id, user.type);
    
    // Step 3: Send sorry email to user
    await sendSorryEmail(userEmail, userName, businessName, newTrialEndDate);
    
    // Step 4: Send copy to admin
    await sendCopyToAdmin(userEmail, userName, businessName, newTrialEndDate);
    
    console.log('=== Trial Extension Process Completed Successfully ===');
    console.log('User:', userEmail);
    console.log('New trial end date:', newTrialEndDate.toISOString());
    
  } catch (error) {
    console.error('Error in main process:', error);
    throw error;
  }
}

// Run the script
main().catch(console.error);
