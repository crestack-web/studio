import { sendTransactionalEmail } from './brevo-service';

const BUSMO_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAtGVYSWZJSSoACAAAAAYAEgEDAAEAAAABAAAAGgEFAAEAAABWAAAAGwEFAAEAAABeAAAAKAEDAAEAAAACAAAAEwIDAAEAAAABAAAAaYcEAAEAAABmAAAAAAAAAGAAAAABAAAAYAAAAAEAAAAGAACQBwAEAAAAMDIxMAGRBwAEAAAAAQIDAACgBwAEAAAAMDEwMAGgAwABAAAA//8AAAKgBAABAAAA9AEAAAOgBAABAAAA9AEAAAAAAAAA4cNEAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF1mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTAyLTA3PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUctd2xCT0lvMCZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBR3kzUUpfNGlZJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0JBR3kzZTVObENvJnF1b3Q7LCZxdW90O3RlbXBsYXRlJnF1b3Q7OiZxdW90O09yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyZxdW90O308L0F0dHJpYjpEYXRhPgogICAgIDxBdHRyaWI6RXh0SWQ+M2YyZTNkNTEtOTA0OS00YmM4LTkwZjAtMTcxMGZmYzFkYjQ2PC9BdHRyaWI6RXh0SWQ+CiAgICAgPEF0dHJpYjpGYklkPjUyNTI2NTkxNDE3OTU4MDwvQXR0cmliOkZiSWQ+CiAgICAgPEF0dHJpYjpUb3VjaFR5cGU+MjwvQXR0cmliOlRvdWNoVHlwZT4KICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPk9yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyAtIDI8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnBkZj0naHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyc+CiAgPHBkZjpBdXRob3I+dGFoZWVyYXRmb29kczwvcGRmOkF1dGhvcj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoK';

const getEmailHeader = (icon: string, title: string, subtitle: string) => `
  <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); position: relative; overflow: hidden;">
    <div style="position: relative; z-index: 1;">
      <img src="${BUSMO_LOGO}" alt="Busmo Logo" style="width: 80px; height: 80px; margin-bottom: 16px; display: inline-block; border-radius: 16px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h1 style="margin: 16px 0 8px; font-size: 28px; font-weight: 700; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.95; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${subtitle}</p>
    </div>
  </div>
`;

export interface StaffAcceptedInvitationParams {
  email: string;
  ownerName: string;
  businessName: string;
  staffName: string;
  staffRole: string;
  acceptedDate: string;
}

export interface StaffRoleUpdatedParams {
  email: string;
  staffName: string;
  businessName: string;
  oldRole: string;
  newRole: string;
  updatedDate: string;
}

export interface StaffRemovedParams {
  email: string;
  staffName: string;
  businessName: string;
  role: string;
  removedDate: string;
  reason?: string;
}

// Staff Accepted Invitation Email (sent to owner)
export async function sendStaffAcceptedInvitationEmail(params: StaffAcceptedInvitationParams): Promise<any> {
  const { email, ownerName, businessName, staffName, staffRole, acceptedDate } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>✅ Staff Invitation Accepted</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .success-box { background: #F0FDF4; border: 2px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .success-box h2 { margin-top: 0; color: #065F46; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('✅', 'Invitation Accepted', 'New team member joined')}
        <div class="content">
          <p>Hi ${ownerName},</p>
          <p>Great news! <strong>${staffName}</strong> has accepted your invitation to join <strong>${businessName}</strong> on Busmo.</p>
          
          <div class="success-box">
            <h2>🎉 Welcome to the Team!</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your team is growing. ${staffName} can now help you manage your business operations.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Staff Name:</span>
              <span class="detail-value">${staffName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Role:</span>
              <span class="detail-value">${staffRole}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Accepted On:</span>
              <span class="detail-value">${acceptedDate}</span>
            </div>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Next Steps</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Review ${staffName}'s permissions based on their role</li>
              <li>Provide training on Busmo features they'll use</li>
              <li>Set up any specific tasks or responsibilities</li>
              <li>Monitor their activity in the staff dashboard</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/staff" class="button">Manage Team</a>
          
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
    to: [{ email, name: ownerName }],
    subject: `✅ Staff Invitation Accepted - ${staffName}`,
    htmlContent,
  });
}

// Staff Role Updated Email
export async function sendStaffRoleUpdatedEmail(params: StaffRoleUpdatedParams): Promise<any> {
  const { email, staffName, businessName, oldRole, newRole, updatedDate } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔄 Role Updated</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .update-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .update-box h2 { margin-top: 0; color: #1E40AF; }
        .role-change { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; text-align: center; }
        .role-arrow { font-size: 32px; color: #6B3FE7; margin: 15px 0; }
        .old-role { font-size: 18px; color: #6B7280; }
        .new-role { font-size: 24px; font-weight: 700; color: #10B981; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🔄', 'Role Updated', 'Your role has been changed')}
        <div class="content">
          <p>Hi ${staffName},</p>
          <p>Your role at <strong>${businessName}</strong> has been updated.</p>
          
          <div class="update-box">
            <h2>📋 Role Change Notification</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">This change affects your permissions and access within Busmo.</p>
          </div>

          <div class="role-change">
            <div class="old-role">Previous Role</div>
            <div style="font-weight: 600; color: #0A0A0F; margin: 8px 0;">${oldRole}</div>
            <div class="role-arrow">↓</div>
            <div class="new-role">New Role</div>
            <div style="font-weight: 700; color: #10B981; font-size: 20px; margin: 8px 0;">${newRole}</div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ What This Means</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Your permissions have been updated based on your new role</li>
              <li>You may have access to new features or restricted access to others</li>
              <li>Please review your dashboard to see available options</li>
              <li>Contact your business owner if you have questions</li>
            </ul>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">⚠️ Important</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">If you did not request this change, please contact your business owner immediately.</p>
          </div>

          <a href="https://busmo.io/dashboard" class="button">Go to Dashboard</a>
          
          <p>Updated on: ${updatedDate}</p>
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
    to: [{ email, name: staffName }],
    subject: `🔄 Role Updated - ${businessName}`,
    htmlContent,
  });
}

// Staff Removed Email
export async function sendStaffRemovedEmail(params: StaffRemovedParams): Promise<any> {
  const { email, staffName, businessName, role, removedDate, reason } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>👋 Account Access Removed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .notice-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .notice-box h2 { margin-top: 0; color: #DC2626; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('👋', 'Access Removed', 'Your account access has been revoked')}
        <div class="content">
          <p>Hi ${staffName},</p>
          <p>Your access to <strong>${businessName}</strong> on Busmo has been removed.</p>
          
          <div class="notice-box">
            <h2>🔒 Account Access Revoked</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">You no longer have access to this business account on Busmo.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Business:</span>
              <span class="detail-value">${businessName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Previous Role:</span>
              <span class="detail-value">${role}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Removed On:</span>
              <span class="detail-value">${removedDate}</span>
            </div>
            ${reason ? `
            <div class="detail-row">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">${reason}</span>
            </div>
            ` : ''}
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">📋 What This Means</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>You can no longer access this business account</li>
              <li>Your data and permissions have been revoked</li>
              <li>If you believe this is an error, contact the business owner</li>
              <li>You can still use Busmo with other businesses if invited</li>
            </ul>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">❓ Questions?</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">If you have questions about this action, please contact the business owner directly.</p>
          </div>
          
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
    to: [{ email, name: staffName }],
    subject: `👋 Access Removed - ${businessName}`,
    htmlContent,
  });
}
