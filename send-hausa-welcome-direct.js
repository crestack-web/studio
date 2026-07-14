/**
 * Send Hausa Welcome Email for Upgraded User
 * From: Starter Plan → Standard Plan
 * Using Brevo REST API directly with axios
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Email configuration from environment
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.Brevo_API_key || process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3';

if (!BREVO_API_KEY) {
  console.error('❌ Brevo API key not found in environment variables!');
  console.log('Please set one of these in your .env.local file:');
  console.log('  - BREVO_API_KEY');
  console.log('  - Brevo_API_key');
  console.log('\nAvailable environment variables:', Object.keys(process.env).filter(k => k.includes('BREVO') || k.includes('brevo') || k.includes('API')).join(', '));
  process.exit(1);
}

// Hausa welcome email content
const hausaWelcomeEmail = {
  to: [
    {
      email: 'shehubashir647@gmail.com',
      name: 'Shehu Bashir'
    }
  ],
  from: {
    email: 'noreply@busmo.io',
    name: 'Busmo Team'
  },
  subject: '🎉 Barka da Zuwa Busmo! - An Minku Zuwa Shakarwa (Standard) Plan',
  htmlContent: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Barka da Zuwa Busmo!</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4; 
          margin: 0; 
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); 
          padding: 40px 30px; 
          text-align: center; 
          color: white;
        }
        .header h1 { 
          margin: 0; 
          font-size: 32px; 
          font-weight: 700;
        }
        .header p { 
          margin: 10px 0 0; 
          font-size: 18px; 
          opacity: 0.95;
        }
        .content { 
          padding: 40px 30px; 
          background: #fff;
        }
        .welcome-box {
          background: #F3EFFE;
          padding: 25px;
          border-radius: 12px;
          margin: 25px 0;
          border-left: 4px solid #6B3FE7;
        }
        .welcome-box h2 {
          color: #6B3FE7;
          margin-top: 0;
          font-size: 24px;
        }
        .features {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .features h3 {
          color: #6B3FE7;
          margin-top: 0;
          font-size: 20px;
        }
        .features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .features li {
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
          color: #555;
        }
        .features li:last-child {
          border-bottom: none;
        }
        .features li:before {
          content: "✓ ";
          color: #6B3FE7;
          font-weight: bold;
          margin-right: 8px;
        }
        .button { 
          display: inline-block; 
          padding: 16px 40px; 
          background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px; 
          margin: 25px 0;
        }
        .highlight {
          background: #F0FDF4;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #10B981;
        }
        .highlight h3 {
          color: #065F46;
          margin-top: 0;
        }
        .footer { 
          background: #f8f9fa; 
          padding: 30px; 
          text-align: center; 
          font-size: 14px; 
          color: #6c757d; 
          border-top: 1px solid #e9ecef;
        }
        .hausa-text {
          font-size: 16px;
          color: #555;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Barka da Zuwa Busmo!</h1>
          <p>An Minku Zuwa Shakarwa (Standard) Plan</p>
        </div>
        <div class="content">
          <p class="hausa-text">Sannu Shehu Bashir,</p>
          
          <div class="welcome-box">
            <h2>🥳 Murna Muku!</h2>
            <p class="hausa-text">
              Muna murna domin ka / ki haɗa da Busmo! An haɓaka asusun ka / ki daga 
              <strong>Starter Plan</strong> zuwa <strong>Standard Plan</strong>.
            </p>
            <p class="hausa-text">
              Yanzu kana / kina da damar samun abubuwa masu yawa da za su taimaka 
              kasuwancin ka / ki ya ci gaba.
            </p>
          </div>

          <div class="highlight">
            <h3>⭐ Abubuwan da Ka / Ki Samu:</h3>
            <p class="hausa-text">Da Standard Plan, yanzu kana / kina da:</p>
          </div>

          <div class="features">
            <h3>🌟 Dā Mabiyoyin Busmo</h3>
            <ul>
              <li>Rikodi sayarwa da kuma bin diddigin kaya</li>
              <li>Nemi MO AI mai zurfin nesa ( unlimited messages )</li>
              <li>Lilami koɗo da kuma kiyaye bayanan kasuwanci</li>
              <li>Samun rahoto mai zurfi da bayanan kasuwanci</li>
              <li>Hawakan samun ƙarfin kasuwanci tare da Bukatun Credit</li>
              <li>Sarrafa ma'aikata da goyon bayansu</li>
              <li>Adana bayanan kasuwanci tare da Backup</li>
              <li>Tallafi mussamman mai girma</li>
            </ul>
          </div>

          <div class="hausa-text">
            <strong>Ta yaya za a fara?</strong> Shiga dashboard ɗin ka / ki ka fara 
            rijistar sayarwa, ƙara kayayyaki, da neman MO AI don samun shawara 
            game da kasuwancin ka / ki.
          </div>

          <div style="text-align: center;">
            <a href="https://busmo.io/dashboard" class="button">
              Shiga Dashboard → 
            </a>
          </div>

          <div class="hausa-text">
            Ina / Ina bukatar taimako? Tuntuɓi ƙungiyar tallafin mu a 
            <a href="mailto:support@busmo.io">support@busmo.io</a> ko kai wa 
            <a href="https://busmo.io/support">shafin tallafi</a>.
          </div>

          <p class="hausa-text" style="margin-top: 30px;">
            <strong>Na gode da zaɓar Busmo!</strong><br>
            Muna godiya da kasancewarmu a cikin nasarar kasuwancin ka / ki.
          </p>

          <p class="hausa-text">
            <strong>Ƙungiyar Busmo</strong><br>
            <em>Mũnin kasuwanci na Afirka</em>
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
          <p style="margin-top: 10px;">
            <a href="https://x.com/busmohq" style="color: #6B3FE7;">@busmohq</a> •
            <a href="https://instagram.com/busmodotio" style="color: #6B3FE7;">@busmodotio</a> •
            <a href="https://tiktok.com/@busmohq" style="color: #6B3FE7;">@busmohq</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
};

// Function to send email via Brevo API
async function sendEmail(emailData) {
  try {
    console.log('Sending email via Brevo API...');
    console.log('To:', emailData.to.map(t => t.email).join(', '));
    console.log('Subject:', emailData.subject);
    
    const sendSmtpEmail = {
      to: emailData.to,
      subject: emailData.subject,
      htmlContent: emailData.htmlContent,
      sender: emailData.from,
    };

    const response = await axios.post(`${BREVO_API_URL}/smtp/email`, sendSmtpEmail, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', response.data.messageId);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.data || error.message);
    throw error;
  }
}

// Send welcome email to the upgraded user
async function sendWelcomeEmail() {
  return sendEmail(hausaWelcomeEmail);
}

// Send sample email
async function sendSampleEmail() {
  console.log('\nSending sample email to crestack@gmail.com...');
  
  const sampleEmail = {
    ...hausaWelcomeEmail,
    to: [
      {
        email: 'crestack@gmail.com',
        name: 'Crestack Team'
      }
    ],
    subject: '[SAMPLE] ' + hausaWelcomeEmail.subject,
    htmlContent: `
      <div style="background: #FFF3CD; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #FFC107;">
        <h2 style="color: #856404; margin-top: 0;">📋 SAMPLE EMAIL - FOR crestack@gmail.com</h2>
        <p style="color: #856404;">This is a sample of the Hausa welcome email sent to shehubashir647@gmail.com</p>
        <p style="color: #856404;"><strong>Original recipient:</strong> shehubashir647@gmail.com (Shehu Bashir)</p>
        <p style="color: #856404;"><strong>Context:</strong> Upgraded from Starter Plan to Standard Plan</p>
      </div>
      ${hausaWelcomeEmail.htmlContent}
    `
  };

  return sendEmail(sampleEmail);
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('HAUSA WELCOME EMAIL - UPGRADE NOTIFICATION');
  console.log('From: Starter Plan → Standard Plan');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Send welcome email to the upgraded user
    await sendWelcomeEmail();
    
    console.log('\n' + '-'.repeat(60));
    
    // Send sample to crestack@gmail.com
    await sendSampleEmail();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL EMAILS SENT SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log('1. Hausa welcome email sent to: shehubashir647@gmail.com');
    console.log('2. Sample email sent to: crestack@gmail.com');
    console.log('\nThe Hausa welcome email includes:');
    console.log('✓ Warm congratulatory message in Hausa');
    console.log('✓ Notification of upgrade from Starter to Standard Plan');
    console.log('✓ List of Standard Plan features in Hausa');
    console.log('✓ Call-to-action button to access dashboard');
    console.log('✓ Support contact information');
    
  } catch (error) {
    console.error('\n❌ FAILED TO SEND EMAILS:', error);
    process.exit(1);
  }
}

// Run the script
main();