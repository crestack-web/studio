import { NextRequest, NextResponse } from 'next/server';
import { BrevoService } from '@/services/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'sendWelcome':
        await BrevoService.sendWelcomeEmail(
          data.email,
          data.name,
          data.businessName
        );
        return NextResponse.json({ success: true, message: 'Welcome email sent' });

      case 'sendStaffInvitation':
        await BrevoService.sendStaffInvitationEmail(
          data.email,
          data.staffName,
          data.businessName,
          data.tempPassword
        );
        return NextResponse.json({ success: true, message: 'Staff invitation email sent' });

      case 'sendPasswordReset':
        await BrevoService.sendPasswordResetEmail(
          data.email,
          data.name,
          data.resetLink
        );
        return NextResponse.json({ success: true, message: 'Password reset email sent' });

      case 'sendLowStockAlert':
        await BrevoService.sendLowStockAlertEmail(
          data.email,
          data.businessName,
          data.lowStockItems
        );
        return NextResponse.json({ success: true, message: 'Low stock alert email sent' });

      case 'sendDailySalesSummary':
        await BrevoService.sendDailySalesSummaryEmail(
          data.email,
          data.businessName,
          data.salesData
        );
        return NextResponse.json({ success: true, message: 'Daily sales summary email sent' });

      case 'sendCreditPaymentReminder':
        await BrevoService.sendCreditPaymentReminderEmail(
          data.email,
          data.customerName,
          data.businessName,
          data.amount,
          data.dueDate
        );
        return NextResponse.json({ success: true, message: 'Credit payment reminder email sent' });

      case 'addContact':
        await BrevoService.addContact(data);
        return NextResponse.json({ success: true, message: 'Contact added' });

      case 'createContactList':
        await BrevoService.createContactList(data);
        return NextResponse.json({ success: true, message: 'Contact list created' });

      default:
        return NextResponse.json({ success: false, message: 'Unknown email type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
