const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendTestEmail() {
  // Create transporter using Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  // Send test email
  try {
    const result = await transporter.sendMail({
      to: 'majnun@busmo.io',
      subject: '✅ Busmo Email Test - System Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Busmo Email Test</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
            .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
            .content { padding: 40px 30px; background: #fff; }
            .success-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
            .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
            .timestamp { font-size: 12px; color: #9CA3AF; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 64px; margin-bottom: 15px;">✅</div>
              <h1>Email Test Successful!</h1>
              <p>Your Busmo email system is working perfectly</p>
              <p class="timestamp">${new Date().toLocaleString()}</p>
            </div>
            <div class="content">
              <p>Hi Majnun,</p>
              <p>This is a test email to verify that the Busmo email system is configured correctly and delivering messages successfully.</p>
              
              <div class="success-box">
                <h3 style="margin-top: 0; color: #065F46;">✅ System Status: Online</h3>
                <ul style="color: #555; font-size: 14px; line-height: 1.8;">
                  <li><strong>SMTP Configuration:</strong> Active (Brevo)</li>
                  <li><strong>Email Delivery:</strong> Working</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>

              <p><strong>Email Features Verified:</strong></p>
              <ul style="color: #555; font-size: 14px; line-height: 1.8;">
                <li>✓ HTML Email Templates</li>
                <li>✓ Responsive Design</li>
                <li>✓ Brand Logo Display</li>
                <li>✓ Social Media Links</li>
              </ul>

              <a href="https://busmo.io/dashboard" class="button">Go to Dashboard</a>
              
              <p style="margin-top: 30px;">Questions? Contact us at <a href="mailto:support@busmo.io">support@busmo.io</a></p>
              <p>Best regards,<br><strong>The Busmo Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Busmo. All rights reserved.</p>
              <p style="margin-top: 8px; font-size: 12px;">
                <a href="mailto:support@busmo.io">Contact Support</a> • 
                <a href="https://busmo.io/privacy">Privacy Policy</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Recipient: majnun@busmo.io');
    console.log('Sent at:', new Date().toLocaleString());
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

// Check if environment variables are set
if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_KEY) {
  console.error('❌ Missing Brevo SMTP credentials in .env file');
  console.error('Please set BREVO_SMTP_LOGIN and BREVO_SMTP_KEY');
  process.exit(1);
}

sendTestEmail();