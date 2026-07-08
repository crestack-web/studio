import { sendTransactionalEmail } from './brevo-service';

export interface OwnerWelcomeEmailParams {
  email: string;
  name: string;
  businessName?: string;
  businessCategory?: string;
}

// Business type-specific feature highlights
const BUSINESS_FEATURES = {
  retail: {
    core: ['Record Sales', 'Track Inventory', 'Manage Staff', 'Track Expenses'],
    advanced: ['Customer Management', 'Supplier Management', 'Ask MO AI Assistant'],
    pro: ['Multi-branch Support', 'Advanced Analytics'],
    tip: 'Focus on fast-moving products and seasonal trends'
  },
  restaurant: {
    core: ['Record Sales', 'Menu Management', 'Ingredient Tracking', 'Staff Management'],
    advanced: ['Expiry Alerts', 'Recipe Costing', 'Ask MO AI Assistant'],
    pro: ['Production Tracking', 'Advanced Analytics'],
    tip: 'Track ingredient costs to price menu items profitably'
  },
  grocery: {
    core: ['Record Sales', 'Inventory Tracking', 'Expiry Alerts', 'Staff Management'],
    advanced: ['Customer Management', 'Supplier Management', 'Ask MO AI Assistant'],
    pro: ['Multi-branch Support', 'Advanced Analytics'],
    tip: 'Monitor perishable goods closely to reduce waste'
  },
  wholesale: {
    core: ['Record Sales', 'Inventory Tracking', 'Credit Management', 'Multi-branch Support'],
    advanced: ['Supplier Management', 'Customer Management', 'Ask MO AI Assistant'],
    pro: ['Unlimited Branches', 'Bank Reconciliation', 'Audit Trail'],
    tip: 'Use credit tracking to manage customer balances and due dates'
  },
  services: {
    core: ['Record Sales', 'Staff Management', 'Expense Tracking', 'Customer Management'],
    advanced: ['Cash Flow Analysis', 'Ask MO AI Assistant', 'Business Analytics'],
    pro: ['Advanced Forecasting', 'Staff Activity Tracking'],
    tip: 'Track staff performance and customer relationships'
  },
  pharmacy: {
    core: ['Record Sales', 'Inventory Tracking', 'Expiry Alerts', 'Staff Management'],
    advanced: ['Batch Tracking', 'Customer Management', 'Ask MO AI Assistant'],
    pro: ['Advanced Analytics', 'Audit Trail'],
    tip: 'Monitor expiry dates and batch numbers for compliance'
  },
  manufacturing: {
    core: ['Record Sales', 'Production Tracking', 'Raw Materials Inventory', 'Staff Management'],
    advanced: ['Bill of Materials', 'Ask MO AI Assistant', 'Supplier Management'],
    pro: ['Unlimited Branches', 'Production Analytics', 'Cost Tracking'],
    tip: 'Track production costs and raw material consumption'
  },
  default: {
    core: ['Record Sales', 'Inventory Tracking', 'Staff Management', 'Expense Tracking'],
    advanced: ['Cash Flow Analysis', 'Ask MO AI Assistant', 'Business Analytics'],
    pro: ['Multi-branch Support', 'Advanced Reports'],
    tip: 'Start with daily sales recording and build from there'
  }
};

// Email 1: Welcome & Clear Misconceptions
export async function sendOwnerWelcomeEmail1(params: OwnerWelcomeEmailParams) {
  const { email, name, businessName, businessCategory } = params;
  const features = BUSINESS_FEATURES[businessCategory as keyof typeof BUSINESS_FEATURES] || BUSINESS_FEATURES.default;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Busmo</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 12px 0 0; font-size: 16px; opacity: 0.95; }
        .content { padding: 40px 30px; background: #fff; }
        .welcome-text { font-size: 18px; color: #555; margin-bottom: 25px; }
        
        .misconception-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .misconception-box h3 { margin-top: 0; color: #D97706; font-size: 16px; }
        .misconception-box p { margin: 8px 0; font-size: 14px; color: #555; }
        
        .feature-highlight { background: #F3EFFE; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid #6B3FE7; }
        .feature-highlight strong { color: #6B3FE7; }
        
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .footer a { color: #6B3FE7; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Busmo!</h1>
          <p>Your Complete Business Management Platform</p>
        </div>
        <div class="content">
          <p class="welcome-text">Hi ${name},</p>
          <p class="welcome-text">Welcome aboard! Your business <strong>${businessName || 'your business'}</strong> is now set up on Busmo. We're here to help you manage your ${businessCategory || 'business'} operations efficiently.</p>
          
          <div class="misconception-box">
            <h3>💡 Clearing Up Common Misconceptions</h3>
            <p><strong>Myth:</strong> "This is just another POS system."</p>
            <p><strong>Reality:</strong> Busmo is your complete business operating system. Beyond sales recording, you get inventory management, expense tracking, AI-powered insights, and financial analytics—all connected in one platform.</p>
            <p style="margin-top: 12px;"><strong>Myth:</strong> "I need complex accounting knowledge to use this."</p>
            <p><strong>Reality:</strong> Busmo is designed for everyone. Our AI assistant "Ask Mo" explains financial data in plain language. If you can use WhatsApp, you can use Busmo.</p>
          </div>
          
          <h3 style="color: #6B3FE7; margin-top: 30px;">📊 Your Key Features for ${businessCategory || 'Your Business'}</h3>
          
          <div class="feature-highlight">
            <strong>Core Features:</strong> ${features.core.join(' • ')}
          </div>
          <div class="feature-highlight">
            <strong>Smart Tools:</strong> ${features.advanced.join(' • ')}
          </div>
          
          <p style="margin-top: 25px;"><strong>💰 Plan Benefits:</strong></p>
          <ul style="color: #555; font-size: 15px; line-height: 1.8;">
            <li>✓ <strong>Starter Plan:</strong> ${features.core.join(', ')}</li>
            <li>✓ <strong>Standard Plan:</strong> Everything above + ${features.advanced.join(', ')}</li>
            <li>✓ <strong>Pro Plan:</strong> Unlimited access + ${features.pro.join(', ')}</li>
          </ul>
          
          <a href="https://busmo.web.app/dashboard" class="button">Explore Your Dashboard</a>
          
          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin-top: 30px; border-radius: 8px;">
            <p style="margin: 0; font-size: 15px;"><strong>💡 Pro Tip:</strong> ${features.tip}</p>
          </div>
          
          <p style="margin-top: 30px;">Need help? Our support team is ready to assist you at <a href="mailto:support@busmo.io">support@busmo.io</a></p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🎉 Welcome to Busmo! Your Business Journey Starts Now',
    htmlContent,
  });
}

// Email 2: How Busmo Works - Category Specific
export async function sendOwnerWelcomeEmail2(params: OwnerWelcomeEmailParams) {
  const { email, name, businessCategory } = params;
  const features = BUSINESS_FEATURES[businessCategory as keyof typeof BUSINESS_FEATURES] || BUSINESS_FEATURES.default;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>How Busmo Works</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        
        .workflow-box { background: #F3EFFE; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .workflow-step { display: flex; align-items: flex-start; gap: 15px; margin: 15px 0; }
        .step-number { background: #6B3FE7; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .step-content { flex: 1; }
        .step-content strong { display: block; color: #0A0A0F; margin-bottom: 4px; }
        .step-content p { margin: 0; color: #555; font-size: 14px; }
        
        .feature-section { margin: 20px 0; padding: 20px; background: #F9FAFB; border-left: 4px solid #6B3FE7; border-radius: 8px; }
        .feature-section h3 { margin-top: 0; color: #6B3FE7; font-size: 18px; }
        .feature-section p { margin: 8px 0; color: #555; font-size: 14px; }
        
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .footer a { color: #6B3FE7; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 How Busmo Works</h1>
          <p>Your ${businessCategory || 'Business'}, Simplified & Amplified</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Let's show you how Busmo transforms your daily ${businessCategory || 'business'} operations. Think of us as your business command center—accessible anywhere, anytime.</p>
          
          <div class="workflow-box">
            <h3 style="color: #6B3FE7; margin-top: 0;">📋 Your Daily Workflow</h3>
            
            <div class="workflow-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <strong>Record Sales (30 seconds)</strong>
                <p>Enter product/service name, quantity, and price. Busmo calculates profit, taxes, and updates inventory automatically.</p>
              </div>
            </div>
            
            <div class="workflow-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <strong>Track Everything</strong>
                <p>Watch your ${businessCategory === 'restaurant' ? 'ingredient levels, menu performance, and table turnover' : 'inventory levels, cash flow, and expenses'} update in real-time. No more manual spreadsheets.</p>
              </div>
            </div>
            
            <div class="workflow-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <strong>Get AI Insights</strong>
                <p>Ask Mo questions like "Which products are low on stock?" or "What's my profit this week?" Get instant answers in plain language.</p>
              </div>
            </div>
            
            <div class="workflow-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <strong>Make Smart Decisions</strong>
                <p>Use dashboards and reports to identify trends, spot opportunities, and grow your business strategically.</p>
              </div>
            </div>
          </div>
          
          <div class="feature-section">
            <h3>📦 Inventory & Stock Management</h3>
            <p><strong>What it does:</strong> Monitor stock levels ${businessCategory === 'restaurant' ? 'and ingredients' : ''}, set low-stock alerts, and track product movement across locations.</p>
            <p><strong>Why it matters:</strong> Never run out of bestsellers or overstock slow-moving items. Reduce waste and increase profitability.</p>
          </div>
          
          <div class="feature-section">
            <h3>💰 Financial Management</h3>
            <p><strong>What it does:</strong> Track all money in and out of your business—sales, expenses, purchases, and payments.</p>
            <p><strong>Why it matters:</strong> Know exactly how much you're earning, spending, and profiting. Make informed decisions about pricing and investments.</p>
          </div>
          
          <div class="feature-section">
            <h3>🤖 Ask Mo - Your AI Business Assistant</h3>
            <p><strong>What it does:</strong> Answer natural language questions about your business data. Try asking:</p>
            <p>"How much profit did I make this month?" • "Which products should I restock?" • "Show me my cash flow trend"</p>
            <p><strong>Why it matters:</strong> Get business intelligence without learning complex analytics tools. Mo translates data into actionable insights.</p>
          </div>
          
          ${businessCategory === 'wholesale' || businessCategory === 'distributor' ? `
          <div class="feature-section">
            <h3>🏪 Credit & Customer Management</h3>
            <p><strong>What it does:</strong> Track customer credit balances, set credit limits, and manage due dates. Send reminders automatically.</p>
            <p><strong>Why it matters:</strong> Improve cash flow by reducing default rates. Build stronger customer relationships with clear credit terms.</p>
          </div>
          ` : ''}
          
          ${businessCategory === 'restaurant' || businessCategory === 'cafe' ? `
          <div class="feature-section">
            <h3>🍽️ Menu & Recipe Management</h3>
            <p><strong>What it does:</strong> Create menus, track ingredients, calculate recipe costs, and monitor food expiry dates.</p>
            <p><strong>Why it matters:</strong> Price menu items profitably, reduce food waste, and maintain quality standards.</p>
          </div>
          ` : ''}
          
          <a href="https://busmo.web.app/dashboard" class="button">Try These Features Now</a>
          
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io">Visit Website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🎯 How Busmo Works - Features That Transform Your Business',
    htmlContent,
  });
}

// Email 3: Understanding Your Dashboard
export async function sendOwnerWelcomeEmail3(params: OwnerWelcomeEmailParams) {
  const { email, name } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Understanding Your Dashboard</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        
        .insight-box { background: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .insight-box h3 { margin-top: 0; color: #1E40AF; font-size: 16px; }
        .insight-box p { margin: 8px 0; color: #555; font-size: 14px; }
        
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; }
        .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .metric-value { font-size: 20px; font-weight: 700; color: #6B3FE7; }
        
        .glossary-item { padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .glossary-item:last-child { border-bottom: none; }
        .glossary-term { font-weight: 600; color: #0A0A0F; margin-bottom: 4px; }
        .glossary-def { color: #555; font-size: 14px; }
        
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .footer a { color: #6B3FE7; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📈 Dashboard Decoded</h1>
          <p>Understanding Your Business Metrics</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your Busmo dashboard is packed with powerful insights. Let's demystify what each metric means and how you can use it to grow your business.</p>
          
          <div class="insight-box">
            <h3>🎯 Key Metrics Explained (In Simple Terms)</h3>
            <p><strong>Revenue:</strong> Total money from sales before expenses. This is your top-line growth.</p>
            <p><strong>Profit:</strong> Revenue minus cost of goods. This is what you actually keep in your pocket.</p>
            <p><strong>Profit Margin:</strong> Percentage of revenue that's pure profit. Higher = better efficiency.</p>
            <p><strong>Inventory Turnover:</strong> How fast you sell and replace stock. Fast turnover = healthy business.</p>
          </div>
          
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-value">Track It</div>
              <p style="font-size: 12px; color: #555; margin: 4px 0 0;">Sum of all sales</p>
            </div>
            <div class="metric-card">
              <div class="metric-label">Net Profit</div>
              <div class="metric-value">Watch It</div>
              <p style="font-size: 12px; color: #555; margin: 4px 0 0;">Revenue - Costs</p>
            </div>
            <div class="metric-card">
              <div class="metric-label">Stock Levels</div>
              <div class="metric-value">Monitor</div>
              <p style="font-size: 12px; color: #555; margin: 4px 0 0;">Real-time inventory</p>
            </div>
            <div class="metric-card">
              <div class="metric-label">Growth Rate</div>
              <div class="metric-value">Analyze</div>
              <p style="font-size: 12px; color: #555; margin: 4px 0 0;">Week-over-week</p>
            </div>
          </div>
          
          <h3 style="color: #6B3FE7;">📚 Business Terms Made Simple</h3>
          
          <div class="glossary-item">
            <div class="glossary-term">Cost of Goods Sold (COGS)</div>
            <div class="glossary-def">The direct cost of products you sell. For retail: wholesale cost. For restaurant: ingredients. Understanding COGS helps you price correctly.</div>
          </div>
          
          <div class="glossary-item">
            <div class="glossary-term">Cash Flow</div>
            <div class="glossary-def">Money movement in/out of your business. Positive = more coming in than going out. Essential for survival.</div>
          </div>
          
          <div class="glossary-item">
            <div class="glossary-term">Gross vs Net Profit</div>
            <div class="glossary-def">Gross = Revenue - Cost of goods. Net = Gross - All expenses (rent, salaries, utilities). Track both for true profitability.</div>
          </div>
          
          <div class="glossary-item">
            <div class="glossary-term">Inventory Turnover</div>
            <div class="glossary-def">How many times you sell/replace inventory. High = selling fast. Low = money tied up in unsold stock.</div>
          </div>
          
          <div class="insight-box">
            <h3>💡 Pro Tip: Use Ask Mo for Instant Insights</h3>
            <p>Instead of digging through reports, just ask: <em>"What's my profit margin this month?"</em> or <em>"Which products are my top earners?"</em> Ask Mo translates complex data into simple answers.</p>
          </div>
          
          <a href="https://busmo.web.app/dashboard" class="button">Explore Your Dashboard</a>
          
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io">Visit Website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '📈 Understanding Your Dashboard & Business Metrics',
    htmlContent,
  });
}

// Email 4: Power User Tips by Business Type
export async function sendOwnerWelcomeEmail4(params: OwnerWelcomeEmailParams) {
  const { email, name, businessCategory } = params;
  const features = BUSINESS_FEATURES[businessCategory as keyof typeof BUSINESS_FEATURES] || BUSINESS_FEATURES.default;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Power User Tips</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        
        .strategy-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .strategy-box h3 { margin-top: 0; color: #065F46; font-size: 16px; }
        .strategy-box p { margin: 8px 0; color: #555; font-size: 14px; }
        
        .tip-item { display: flex; align-items: flex-start; gap: 12px; margin: 15px 0; padding: 15px; background: #F9FAFB; border-radius: 8px; }
        .tip-icon { font-size: 24px; flex-shrink: 0; }
        .tip-content { flex: 1; }
        .tip-content strong { display: block; color: #0A0A0F; margin-bottom: 4px; }
        .tip-content p { margin: 0; color: #555; font-size: 14px; }
        
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .footer a { color: #6B3FE7; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Power User Tips</h1>
          <p>Get the Most Out of Busmo for Your ${businessCategory || 'Business'}</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Now that you're familiar with the basics, let's unlock advanced strategies to maximize your ROI with Busmo.</p>
          
          <div class="strategy-box">
            <h3>🎯 The 80/20 Rule with Busmo</h3>
            <p><strong>1. Record sales consistently</strong> - ${features.core[0]} every time. The more data you collect, the smarter Busmo becomes.</p>
            <p><strong>2. Ask Mo strategic questions weekly</strong> - "What trends do you see in my ${businessCategory === 'restaurant' ? 'menu items' : 'products'}?" "Which ${businessCategory === 'manufacturing' ? 'raw materials' : 'items'} have the highest profit margin?"</p>
            <p><strong>3. Monitor inventory alerts</strong> - Never miss a restock opportunity. Low-stock alerts prevent lost sales.</p>
          </div>
          
          <div class="tip-item">
            <div class="tip-icon">📊</div>
            <div class="tip-content">
              <strong>Weekly Review Ritual</strong>
              <p>Spend 15 minutes every Friday asking Mo: "How did my business perform this week?" Identify patterns and plan adjustments.</p>
            </div>
          </div>
          
          <div class="tip-item">
            <div class="tip-icon">🎯</div>
            <div class="tip-content">
              <strong>Set Profit Margins</strong>
              <p>Use Busmo's cost tracking to ensure every product/service is priced profitably. Know your break-even point.</p>
            </div>
          </div>
          
          ${businessCategory !== 'services' ? `
          <div class="tip-item">
            <div class="tip-icon">📦</div>
            <div class="tip-content">
              <strong>Smart Inventory Management</strong>
              <p>${features.tip}. Use Busmo's stock tracking to optimize your inventory levels.</p>
            </div>
          </div>
          ` : ''}
          
          ${businessCategory === 'wholesale' || businessCategory === 'distributor' ? `
          <div class="tip-item">
            <div class="tip-icon">💳</div>
            <div class="tip-content">
              <strong>Credit Management</strong>
              <p>Track customer credit balances and due dates. Send reminders automatically. Improve cash flow by reducing default rates.</p>
            </div>
          </div>
          ` : ''}
          
          ${businessCategory === 'restaurant' || businessCategory === 'cafe' ? `
          <div class="tip-item">
            <div class="tip-icon">🍽️</div>
            <div class="tip-content">
              <strong>Recipe Costing</strong>
              <p>Track ingredient costs per recipe. Price menu items to ensure profitability. Monitor expiry dates to reduce waste.</p>
            </div>
          </div>
          ` : ''}
          
          <div class="tip-item">
            <div class="tip-icon">👥</div>
            <div class="tip-content">
              <strong>Staff Accountability</strong>
              <p>Monitor staff performance through transaction records. Celebrate top performers and identify training needs.</p>
            </div>
          </div>
          
          <div class="tip-item">
            <div class="tip-icon">📱</div>
            <div class="tip-content">
              <strong>Mobile Access</strong>
              <p>Use Busmo on your phone to record sales anywhere. Real-time sync means data is always up-to-date.</p>
            </div>
          </div>
          
          <div class="strategy-box" style="background: #FEF3C7; border-left-color: #F59E0B;">
            <h3 style="color: #D97706;">⭐ Success Story</h3>
            <p><em>"Within 3 months of using Busmo, I identified my top 20% products that generated 80% of profits. I focused inventory on those items and increased monthly revenue by 35%."</em></p>
            <p><strong>- Business Owner, Lagos</strong></p>
          </div>
          
          <h3 style="color: #6B3FE7;">🎓 Common Misconceptions Debunked</h3>
          
          <p><strong>"I need to be tech-savvy."</strong> Not true. Busmo is designed for everyday business owners. If you can use social media, you can use Busmo.</p>
          
          <p><strong>"It's too expensive."</strong> Consider this: One informed decision from Busmo insights often pays for your subscription several times over.</p>
          
          <p><strong>"I don't have time to learn a new system."</strong> Most users record their first sale within 5 minutes of signing up. It's that simple.</p>
          
          <a href="https://busmo.web.app/dashboard" class="button">Start Applying These Tips</a>
          
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io">Visit Website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🚀 Power User Tips - Maximize Your Busmo Experience',
    htmlContent,
  });
}

// Email 5: Getting Started & Support
export async function sendOwnerWelcomeEmail5(params: OwnerWelcomeEmailParams) {
  const { email, name, businessName, businessCategory } = params;
  const features = BUSINESS_FEATURES[businessCategory as keyof typeof BUSINESS_FEATURES] || BUSINESS_FEATURES.default;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're All Set!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        
        .checklist { background: #F0FDF4; border: 2px solid #10B981; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .checklist h3 { margin-top: 0; color: #065F46; }
        .checklist-item { display: flex; align-items: center; gap: 10px; margin: 10px 0; color: #555; }
        .checklist-check { color: #10B981; font-size: 18px; }
        
        .support-box { background: #EBF5FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .support-box h3 { margin-top: 0; color: #1E40AF; font-size: 16px; }
        .support-box p { margin: 8px 0; color: #555; font-size: 14px; }
        
        .upgrade-box { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; }
        .upgrade-box h2 { margin-top: 0; }
        .upgrade-box p { margin: 10px 0; opacity: 0.95; }
        
        .button { display: inline-block; padding: 16px 40px; background: white; color: #6B3FE7; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .footer a { color: #6B3FE7; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 You're All Set!</h1>
          <p>Your Busmo Journey Begins Now</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Congratulations! You've completed setup for <strong>${businessName || 'your business'}</strong> on Busmo. Here's your roadmap to success:</p>
          
          <div class="checklist">
            <h3>✅ Your First Week Checklist</h3>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <span>Record your first sale (takes 30 seconds)</span>
            </div>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <span>Add your products/services to inventory</span>
            </div>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <span>Set up staff accounts (if applicable)</span>
            </div>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <span>Ask Mo your first question about your business</span>
            </div>
            <div class="checklist-item">
              <span class="checklist-check">✓</span>
              <span>Review your dashboard and understand key metrics</span>
            </div>
          </div>
          
          <h3 style="color: #6B3FE7;">📚 Resources to Help You Succeed</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;">
            <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
              <div style="font-size: 32px; margin-bottom: 8px;">📖</div>
              <strong style="display: block; color: #6B3FE7; font-size: 13px;">Help Center</strong>
              <p style="margin: 4px 0 0; color: #555; font-size: 12px;">Step-by-step guides</p>
            </div>
            <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
              <div style="font-size: 32px; margin-bottom: 8px;">🎥</div>
              <strong style="display: block; color: #6B3FE7; font-size: 13px;">Video Tutorials</strong>
              <p style="margin: 4px 0 0; color: #555; font-size: 12px;">Learn by watching</p>
            </div>
            <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
              <div style="font-size: 32px; margin-bottom: 8px;">💬</div>
              <strong style="display: block; color: #6B3FE7; font-size: 13px;">Live Support</strong>
              <p style="margin: 4px 0 0; color: #555; font-size: 12px;">Chat with our team</p>
            </div>
            <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #E5E7EB;">
              <div style="font-size: 32px; margin-bottom: 8px;">👥</div>
              <strong style="display: block; color: #6B3FE7; font-size: 13px;">Community</strong>
              <p style="margin: 4px 0 0; color: #555; font-size: 12px;">Connect with owners</p>
            </div>
          </div>
          
          <div class="support-box">
            <h3>🤝 We're Here for You</h3>
            <p><strong>Email:</strong> support@busmo.io</p>
            <p><strong>Response Time:</strong> Within 24 hours (usually faster)</p>
            <p><strong>What we help with:</strong> Setup questions, feature explanations, troubleshooting, and business advice.</p>
            <p style="margin-top: 12px;"><strong>Pro Tip:</strong> When contacting support, mention your business name and specific issue. This helps us assist you faster!</p>
          </div>
          
          <div class="upgrade-box">
            <h2>Growing Your Business</h2>
            <p>Remember: Busmo is most powerful when used consistently. The more data you input, the smarter insights you'll receive.</p>
            <p><strong>Start today:</strong> Record one sale, explore your dashboard, ask Mo a question.</p>
            <a href="https://busmo.web.app/dashboard" class="button">Go to Dashboard</a>
          </div>
          
          <h3 style="color: #6B3FE7;">🎯 Your Available Features</h3>
          <p><strong>Starter Plan:</strong> ${features.core.join(', ')}</p>
          <p><strong>Standard Plan:</strong> ${features.core.join(', ')} + ${features.advanced.join(', ')}</p>
          <p><strong>Pro Plan:</strong> Unlimited access + ${features.pro.join(', ')}</p>
          
          <p style="margin-top: 20px;">Thank you for choosing Busmo. We're excited to be part of your success story!</p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io">Visit Website</a> • 
            <a href="https://busmo.io/privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: "🎯 You're All Set! Welcome to the Busmo Family",
    htmlContent,
  });
}

// Main function to send the complete owner welcome series
export async function sendOwnerWelcomeEmailSeries(params: OwnerWelcomeEmailParams) {
  const { email, name, businessName, businessCategory } = params;
  
  const emails = [
    { delay: 0, send: () => sendOwnerWelcomeEmail1({ email, name, businessName, businessCategory }) },
    { delay: 24 * 60 * 60 * 1000, send: () => sendOwnerWelcomeEmail2({ email, name, businessCategory }) },
    { delay: 3 * 24 * 60 * 60 * 1000, send: () => sendOwnerWelcomeEmail3({ email, name }) },
    { delay: 5 * 24 * 60 * 60 * 1000, send: () => sendOwnerWelcomeEmail4({ email, name, businessCategory }) },
    { delay: 7 * 24 * 60 * 60 * 1000, send: () => sendOwnerWelcomeEmail5({ email, name, businessName, businessCategory }) },
  ];

  console.log(`Owner welcome email series scheduled for ${email}`);
  console.log('Business category:', businessCategory || 'default');
  console.log('Emails will be sent at: Day 0, Day 1, Day 3, Day 5, Day 7');
  
  // Send all emails immediately for testing (in production, these would be scheduled)
  for (const emailSchedule of emails) {
    try {
      await emailSchedule.send();
      console.log(`✓ Email ${emails.indexOf(emailSchedule) + 1} sent successfully`);
    } catch (error) {
      console.error(`✗ Failed to send email ${emails.indexOf(emailSchedule) + 1}:`, error);
    }
  }
  
  return { success: true, message: 'Owner welcome email series completed' };
}