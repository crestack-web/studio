import { sendSolutionStaffInvitationEmail } from '@/services/email/brevo-service';

type NotifyStaffInviteArgs = {
  email: string;
  staffName: string;
  businessName?: string | null;
  suiteName: string;
};

type NotifyStaffInviteResult = {
  emailSent: boolean;
  emailError?: string;
};

/**
 * Best-effort invitation delivery for industry solution workspaces.
 *
 * The workspace record is already saved before this runs. Email failures are
 * returned to the caller (and surfaced in the UI) instead of failing the whole
 * add-staff request.
 */
export async function notifySolutionStaffInvite({
  email,
  staffName,
  businessName,
  suiteName,
}: NotifyStaffInviteArgs): Promise<NotifyStaffInviteResult> {
  const to = String(email || '').trim().toLowerCase();
  if (!to) {
    return { emailSent: false, emailError: 'No email address supplied' };
  }

  try {
    await sendSolutionStaffInvitationEmail(
      to,
      String(staffName || 'there').trim() || 'there',
      String(businessName || 'your workspace').trim() || 'your workspace',
      suiteName
    );
    return { emailSent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${suiteName}] staff invitation email failed for ${to}:`, message);
    return { emailSent: false, emailError: message };
  }
}
