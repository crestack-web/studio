import { sendTransactionalEmail } from './brevo-service';
import { BUSMO_LOGO, getEmailHeader as sharedGetEmailHeader } from './email-constants';

const getEmailHeader = (icon: string, title: string, subtitle: string) =>
  sharedGetEmailHeader(title, subtitle, icon);

export interface OutOfStockAlertParams {
  email: string;
  name: string;
  businessName: string;
  outOfStockItems: Array<{ name: string; lastSaleDate?: string }>;
}

export interface OverstockWarningParams {
  email: string;
  name: string;
  businessName: string;
  overstockItems: Array<{ name: string; currentStock: number; optimalStock: number; daysSinceLastSale: number }>;
}

export interface InventoryValueSummaryParams {
  email: string;
  name: string;
  businessName: string;
  totalInventoryValue: number;
  totalItems: number;
  lowValueItems: number;
  highValueItems: number;
  topValueItems: Array<{ name: string; value: number; quantity: number }>;
  currency?: string;
  period: string;
}

// Out of Stock Alert Email
export async function sendOutOfStockAlertEmail(params: OutOfStockAlertParams): Promise<any> {
  const { email, name, businessName, outOfStockItems } = params;
  
  const itemsList = outOfStockItems.map(item => 
    `<li><strong>${item.name}</strong>${item.lastSaleDate ? ` (last sold: ${item.lastSaleDate})` : ''}</li>`
  ).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🚨 Out of Stock Alert</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #DC2626; }
        .items-list { list-style: none; padding: 0; }
        .items-list li { padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .items-list li:last-child { border-bottom: none; }
        .impact-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .impact-box h3 { margin-top: 0; color: #D97706; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🚨', 'Out of Stock Alert', 'Action required to prevent lost sales')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>The following items in <strong>${businessName}</strong> are currently out of stock:</p>
          
          <div class="alert-box">
            <h2>⚠️ Items Need Immediate Restocking</h2>
            <ul class="items-list">
              ${itemsList}
            </ul>
          </div>

          <div class="impact-box">
            <h3>💰 Business Impact</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Out-of-stock items mean:</p>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Lost sales and revenue</li>
              <li>Disappointed customers</li>
              <li>Potential damage to business reputation</li>
              <li>Customers may seek alternatives</li>
            </ul>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Recommended Actions</h3>
            <ol style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Contact suppliers immediately to restock</li>
              <li>Consider temporary substitutions if available</li>
              <li>Set up automatic reordering for fast-moving items</li>
              <li>Review your reorder points to prevent future stockouts</li>
            </ol>
          </div>

          <a href="https://busmo.io/dashboard/inventory" class="button">Manage Inventory</a>
          
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
    subject: `🚨 Out of Stock Alert - ${businessName}`,
    htmlContent,
  });
}

// Overstock Warning Email
export async function sendOverstockWarningEmail(params: OverstockWarningParams): Promise<any> {
  const { email, name, businessName, overstockItems } = params;
  
  const itemsList = overstockItems.map(item => 
    `<li><strong>${item.name}</strong>: ${item.currentStock} units (optimal: ${item.optimalStock}) - ${item.daysSinceLastSale} days since last sale</li>`
  ).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚠️ Overstock Warning</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .warning-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .warning-box h2 { margin-top: 0; color: #D97706; }
        .items-list { list-style: none; padding: 0; }
        .items-list li { padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .items-list li:last-child { border-bottom: none; }
        .impact-box { background: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .impact-box h3 { margin-top: 0; color: #1E40AF; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('⚠️', 'Overstock Warning', 'Excess inventory tying up capital')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>The following items in <strong>${businessName}</strong> are overstocked and may be tying up your capital:</p>
          
          <div class="warning-box">
            <h2>📦 Items With Excess Stock</h2>
            <ul class="items-list">
              ${itemsList}
            </ul>
          </div>

          <div class="impact-box">
            <h3>💰 Business Impact</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Overstock can lead to:</p>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Tied-up capital that could be used elsewhere</li>
              <li>Increased storage costs</li>
              <li>Risk of product expiration or obsolescence</li>
              <li>Reduced cash flow flexibility</li>
            </ul>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Recommended Actions</h3>
            <ol style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Consider discounts or promotions to move excess stock</li>
              <li>Bundle slow-moving items with popular products</li>
              <li>Review purchase orders and reduce future ordering</li>
              <li>Return items to suppliers if possible</li>
            </ol>
          </div>

          <a href="https://busmo.io/dashboard/inventory" class="button">Manage Inventory</a>
          
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
    subject: `⚠️ Overstock Warning - ${businessName}`,
    htmlContent,
  });
}

// Inventory Value Summary Email
export async function sendInventoryValueSummaryEmail(params: InventoryValueSummaryParams): Promise<any> {
  const { email, name, businessName, totalInventoryValue, totalItems, lowValueItems, highValueItems, topValueItems, currency = 'NGN', period } = params;
  
  const topValueList = topValueItems.map((item, index) => `
    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
      <div style="flex: 1;">
        <span style="font-weight: 600; color: #6B3FE7;">#${index + 1}</span>
        <span style="margin-left: 8px; color: #0A0A0F;">${item.name}</span>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 600; color: #0A0A0F;">${item.quantity} units</div>
        <div style="font-size: 12px; color: #6B7280;">${currency === 'NGN' ? '₦' : '$'}${item.value.toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📦 Inventory Value Summary</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .metric-value { font-size: 24px; font-weight: 700; color: #6B3FE7; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .products-box { background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .products-box h3 { margin-top: 0; color: #0A0A0F; font-size: 18px; }
        .insight-box { background: #F3EFFE; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #6B3FE7; }
        .insight-box h3 { margin-top: 0; color: #6B3FE7; font-size: 16px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('📦', 'Inventory Value Summary', `${businessName} • ${period}`)}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Here's your inventory value summary for <strong>${businessName}</strong>:</p>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${currency === 'NGN' ? '₦' : '$'}${totalInventoryValue.toLocaleString()}</div>
              <div class="metric-label">Total Inventory Value</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${totalItems}</div>
              <div class="metric-label">Total Items</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #10B981;">${highValueItems}</div>
              <div class="metric-label">High-Value Items</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #F59E0B;">${lowValueItems}</div>
              <div class="metric-label">Low-Value Items</div>
            </div>
          </div>

          <div class="insight-box">
            <h3>💡 Inventory Insights</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">
              Your inventory is valued at <strong>${currency === 'NGN' ? '₦' : '$'}${totalInventoryValue.toLocaleString()}</strong> across ${totalItems} items. 
              ${highValueItems} items account for significant value, so focus on optimizing their stock levels.
            </p>
          </div>

          ${topValueItems.length > 0 ? `
          <div class="products-box">
            <h3>🏆 Top Value Items</h3>
            ${topValueList}
          </div>
          ` : ''}

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">💡 Optimization Tips</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Review high-value items regularly to ensure optimal stock levels</li>
              <li>Consider just-in-time ordering for slow-moving high-value items</li>
              <li>Monitor expiration dates for perishable inventory</li>
              <li>Use Ask Mo to identify inventory optimization opportunities</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/inventory" class="button">Manage Inventory</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
            This is an automated inventory summary. You can adjust the frequency in Settings.
          </p>
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
    subject: `📦 Inventory Value Summary - ${businessName}`,
    htmlContent,
  });
}


export interface StaffStockAlertParams {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  staffName: string;
  staffEmail?: string;
  staffRole?: string;
  products: Array<{
    name: string;
    stock: number;
    lowStockThreshold?: number;
    status?: 'out' | 'low' | 'lost';
  }>;
  note?: string;
  alertType?: 'low_stock' | 'lost_stock';
}

/**
 * Email the business owner when a staff member alerts about low / lost stock.
 * Includes staff identity and the affected products.
 */
export async function sendStaffStockAlertToOwner(params: StaffStockAlertParams): Promise<any> {
  const {
    ownerEmail,
    ownerName,
    businessName,
    staffName,
    staffEmail,
    staffRole,
    products,
    note,
    alertType = 'low_stock',
  } = params;

  const isLost = alertType === 'lost_stock';
  const title = isLost ? 'Lost Stock Alert' : 'Stock Alert from Staff';
  const subtitle = isLost
    ? `${staffName} reported lost stock at ${businessName}`
    : `${staffName} flagged inventory that needs attention`;

  const itemsList = products
    .map((p) => {
      const status =
        p.status === 'out' || p.stock === 0
          ? 'Out of stock'
          : p.status === 'lost'
            ? 'Reported lost'
            : `Only ${p.stock} left` +
              (p.lowStockThreshold != null ? ` (threshold ${p.lowStockThreshold})` : '');
      return `<li style="padding:10px 0;border-bottom:1px solid #E5E7EB;">
        <strong>${p.name}</strong>
        <span style="display:block;color:#6B7280;font-size:13px;margin-top:4px;">${status}</span>
      </li>`;
    })
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      ${getEmailHeader('🚨', title, subtitle)}
      <div style="padding:32px 28px;">
        <p style="margin:0 0 12px;color:#111827;font-size:15px;">Hi ${ownerName || 'there'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
          <strong>${staffName}</strong>${staffRole ? ` (${staffRole})` : ''}${staffEmail ? ` &lt;${staffEmail}&gt;` : ''}
          alerted you about stock at <strong>${businessName}</strong>.
        </p>

        <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;padding:14px 16px;margin:16px 0;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6B3FE7;margin-bottom:6px;">Reported by</div>
          <div style="font-size:15px;color:#111827;font-weight:600;">${staffName}</div>
          ${staffEmail ? `<div style="font-size:13px;color:#6B7280;margin-top:2px;">${staffEmail}</div>` : ''}
          ${staffRole ? `<div style="font-size:13px;color:#6B7280;margin-top:2px;">Role: ${staffRole}</div>` : ''}
        </div>

        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin:16px 0;">
          <h2 style="margin:0 0 10px;font-size:16px;color:#B91C1C;">Affected products</h2>
          <ul style="list-style:none;padding:0;margin:0;">${itemsList}</ul>
        </div>

        ${
          note
            ? `<div style="background:#FFFBEB;border-left:4px solid #F59E0B;padding:12px 14px;margin:16px 0;border-radius:6px;">
                <div style="font-size:12px;font-weight:700;color:#B45309;margin-bottom:4px;">Staff note</div>
                <div style="font-size:14px;color:#78350F;">${note}</div>
              </div>`
            : ''
        }

        <p style="margin:20px 0 8px;color:#374151;font-size:14px;">
          Open inventory in Busmo to restock or investigate.
        </p>
        <a href="${(process.env.NEXT_PUBLIC_APP_URL || 'https://busmo.io').replace(/\/$/, '')}/owner"
           style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6B3FE7,#8B5CF6);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;margin-top:8px;">
          Open dashboard
        </a>
      </div>
      <div style="background:#F9FAFB;padding:20px;text-align:center;font-size:12px;color:#6B7280;border-top:1px solid #E5E7EB;">
        Sent by Busmo · Staff inventory alert
      </div>
    </div>
  </body>
</html>`;

  return sendTransactionalEmail({
    to: [{ email: ownerEmail, name: ownerName }],
    subject: `🚨 ${title}: ${products.length} product${products.length === 1 ? '' : 's'} · ${businessName}`,
    htmlContent,
    params: staffEmail ? { replyTo: staffEmail } : undefined,
  });
}
