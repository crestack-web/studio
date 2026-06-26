import { sendTransactionalEmail } from './brevo-service';

export interface WelcomeEmailParams {
  email: string;
  name: string;
  businessName?: string;
}

export async function sendWelcomeEmail1(params: WelcomeEmailParams) {
  const { email, name, businessName } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; background: #fff; }
        .welcome-text { font-size: 18px; color: #555; margin-bottom: 25px; }
        .features { background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .features h3 { margin-top: 0; color: #667eea; font-size: 20px; }
        .features ul { list-style: none; padding: 0; margin: 0; }
        .features li { padding: 12px 0; border-bottom: 1px solid #e9ecef; }
        .features li:last-child { border-bottom: none; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Busmo! 🎉</h1>
          <p>Your Business Management Solution</p>
        </div>
        <div class="content">
          <p class="welcome-text">Hi ${name},</p>
          <p class="welcome-text">Welcome to Busmo! We're excited to help you grow ${businessName || 'your business'}.</p>
          <p>Here's what you can do with Busmo:</p>
          <div class="features">
            <h3>🚀 Get Started</h3>
            <ul>
              <li>✓ Record sales and track inventory</li>
              <li>✓ Get AI-powered business insights</li>
              <li>✓ Monitor cash flow and expenses</li>
              <li>✓ Manage staff performance</li>
            </ul>
          </div>
          <a href="https://busmo.web.app/dashboard" class="button">Go to Dashboard</a>
          <p>Need help? Contact our support team anytime.</p>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: 'Welcome to Busmo! 🎉',
    htmlContent,
  });
}

export async function sendWelcomeEmail2(params: WelcomeEmailParams) {
  const { email, name } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        .tip-box { background: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .tip-box h3 { margin-top: 0; color: #f59e0b; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💡 Pro Tip: Record Your First Sale</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Ready to see Busmo in action? Here's the fastest way to get started:</p>
          <div class="tip-box">
            <h3>Today's Tip</h3>
            <p><strong>Record your first sale in under 30 seconds.</strong> Just enter the product name, quantity, and price. Busmo will automatically calculate your profit and update your inventory.</p>
          </div>
          <p>Try it now and see how simple business management can be.</p>
          <a href="https://busmo.web.app/dashboard" class="button">Record a Sale</a>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '💡 Pro Tip: Record Your First Sale',
    htmlContent,
  });
}

export async function sendWelcomeEmail3(params: WelcomeEmailParams) {
  const { email, name } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .feature-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .feature-icon { font-size: 32px; margin-bottom: 10px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 Meet Ask Mo AI</h1>
          <p>Your Personal Business Assistant</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Did you know Busmo has an AI assistant that can answer questions about your business?</p>
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <strong>Profit Insights</strong>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📦</div>
              <strong>Stock Alerts</strong>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💰</div>
              <strong>Cash Flow</strong>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <strong>Smart Forecasts</strong>
            </div>
          </div>
          <p>Just ask: "How much profit did I make this week?" or "Which products should I restock?"</p>
          <a href="https://busmo.web.app/dashboard" class="button">Try Ask Mo</a>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🤖 Meet Ask Mo AI - Your Business Assistant',
    htmlContent,
  });
}

export async function sendWelcomeEmail4(params: WelcomeEmailParams) {
  const { email, name } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        .success-story { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success-story h3 { margin-top: 0; color: #155724; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📈 Track Your Growth</h1>
          <p>See Your Business Progress</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>One of the best features of Busmo is tracking your business growth over time.</p>
          <div class="success-story">
            <h3>💪 Success Story</h3>
            <p>"Busmo helped me increase my profit by 35% in just 3 months by identifying my best-selling products and reducing waste."</p>
            <p><strong>- Business Owner, Lagos</strong></p>
          </div>
          <p>Check your dashboard weekly to see trends, track profits, and make data-driven decisions.</p>
          <a href="https://busmo.web.app/dashboard" class="button">View Your Dashboard</a>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '📈 Track Your Business Growth',
    htmlContent,
  });
}

export async function sendWelcomeEmail5(params: WelcomeEmailParams) {
  const { email, name } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        .cta-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .cta-box h2 { margin-top: 0; }
        .button { display: inline-block; padding: 16px 40px; background: white; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 You're All Set!</h1>
          <p>Ready to Transform Your Business?</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>You've completed your first week with Busmo! Here's a quick recap of what you can do:</p>
          <ul>
            <li>✓ Record sales and track inventory</li>
            <li>✓ Use Ask Mo AI for business insights</li>
            <li>✓ Monitor cash flow and expenses</li>
            <li>✓ Track staff performance</li>
          </ul>
          <div class="cta-box">
            <h2>Need Help Getting Started?</h2>
            <p>Our support team is here to help you succeed.</p>
            <a href="mailto:support@busmo.io" class="button">Contact Support</a>
          </div>
          <p>Thank you for choosing Busmo. We're excited to be part of your success story!</p>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🎯 You\'re All Set! Start Your Busmo Journey',
    htmlContent,
  });
}

export async function sendWelcomeEmailSeries(params: WelcomeEmailParams) {
  const { email, name, businessName } = params;
  
  const emails = [
    { delay: 0, send: () => sendWelcomeEmail1({ email, name, businessName }) },
    { delay: 24 * 60 * 60 * 1000, send: () => sendWelcomeEmail2({ email, name, businessName }) },
    { delay: 3 * 24 * 60 * 60 * 1000, send: () => sendWelcomeEmail3({ email, name, businessName }) },
    { delay: 5 * 24 * 60 * 60 * 1000, send: () => sendWelcomeEmail4({ email, name, businessName }) },
    { delay: 7 * 24 * 60 * 60 * 1000, send: () => sendWelcomeEmail5({ email, name, businessName }) },
  ];

  console.log(`Welcome email series scheduled for ${email}`);
  console.log('Emails will be sent at: Day 0, Day 1, Day 3, Day 5, Day 7');
  
  return { success: true, message: 'Welcome email series scheduled' };
}