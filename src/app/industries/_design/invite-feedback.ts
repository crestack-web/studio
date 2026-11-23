import type { MutateResult } from './live';

type InviteFeedbackOptions = {
  staffName: string;
  email: string;
  result: MutateResult;
  addedLabel?: string;
};

/** Consistent messaging for add-staff flows after the record has been saved. */
export function toastInviteResult(
  toast: (message: string) => void,
  { staffName, email, result, addedLabel = 'added' }: InviteFeedbackOptions
): void {
  if (result.preview) {
    toast(`${staffName} ${addedLabel} in preview. No email was sent.`);
    return;
  }

  if (result.data?.emailSent) {
    toast(`${staffName} ${addedLabel}. Invitation sent to ${email}.`);
    return;
  }

  const detail = String(result.data?.emailError || '').trim();
  toast(
    `${staffName} ${addedLabel}, but the invitation email failed${
      detail ? `: ${detail.slice(0, 120)}` : ''
    }. Share access manually.`
  );
}
