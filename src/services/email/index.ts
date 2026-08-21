// Core email service (Resend — file kept as brevo-service for import paths)
export {
  sendTransactionalEmail,
  sendCampaign,
  createCampaign,
  scheduleCampaign,
  addContact,
  createContactList,
  sendWelcomeEmail,
  sendStaffInvitationEmail,
  sendPasswordResetEmail,
  sendLowStockAlertEmail,
  sendDailySalesSummaryEmail,
  sendCreditPaymentReminderEmail,
} from './brevo-service';

// Welcome Email Series
export {
  sendWelcomeEmail1,
  sendWelcomeEmail2,
  sendWelcomeEmail3,
  sendWelcomeEmail4,
  sendWelcomeEmail5,
  sendWelcomeEmailSeries,
} from './welcome-series';

// Owner Welcome Series
export {
  sendOwnerWelcomeEmail1,
  sendOwnerWelcomeEmail2,
  sendOwnerWelcomeEmail3,
  sendOwnerWelcomeEmail4,
  sendOwnerWelcomeEmail5,
  sendOwnerWelcomeEmailSeries,
} from './owner-welcome-series';

// Subscription Emails
export {
  sendTrialReminderEmail,
  sendSubscriptionReceiptEmail,
  sendDailyBusinessSummaryEmail,
  sendBusinessInsightsEmail,
  sendPasswordResetConfirmationEmail,
} from './subscription-emails';

// Business Activity Emails
export {
  sendFirstSaleCelebrationEmail,
  sendStatementDownloadedEmail,
  sendWeeklyBusinessReportEmail,
  sendMonthlyBusinessReportEmail,
} from './business-activity-emails';

// Inventory Emails
export {
  sendOutOfStockAlertEmail,
  sendOverstockWarningEmail,
  sendInventoryValueSummaryEmail,
} from './inventory-emails';

// Cashflow Emails
export {
  sendLargeExpenseAlertEmail,
  sendUnusualSpendingAlertEmail,
  sendNegativeCashflowWarningEmail,
  sendPositiveCashflowAchievementEmail,
} from './cashflow-emails';

// Credit Emails
export {
  sendCustomerPaymentOverdueEmail,
  sendSupplierPaymentDueEmail,
  sendSupplierPaymentOverdueEmail,
} from './credit-emails';

// Team Management Emails
export {
  sendStaffAcceptedInvitationEmail,
  sendStaffRoleUpdatedEmail,
  sendStaffRemovedEmail,
} from './team-management-emails';

// Security Emails
export {
  sendLoginAlertEmail,
  sendEmailChangedEmail,
  sendPhoneNumberChangedEmail,
  sendAPIKeyCreatedEmail,
  sendTwoFactorEnabledEmail,
  sendTwoFactorDisabledEmail,
} from './security-emails';

// Subscription Lifecycle Emails
export {
  sendPaymentFailedEmail,
  sendRetryPaymentReminderEmail,
  sendTrialExpiredEmail,
  sendSubscriptionRenewedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionExpiredEmail,
  sendCardExpiringSoonEmail,
} from './subscription-lifecycle-emails';

// Referral Emails
export {
  sendReferralInvitationSentEmail,
  sendReferralJoinedEmail,
  sendReferralStartedTrialEmail,
  sendReferralConvertedToPaidEmail,
  sendReferralRewardEarnedEmail,
  sendReferralRewardPaidEmail,
} from './referral-emails';

// Marketing & Retention Emails
export {
  sendBusinessHealthScoreEmail,
  sendInactivityReminderEmail,
  sendBusinessMilestoneCelebrationEmail,
  sendTipsForGrowingBusinessEmail,
  sendNewFeatureReleasedEmail,
} from './marketing-retention-emails';

// Administrative Emails
export {
  sendTermsOfServiceUpdatedEmail,
  sendPrivacyPolicyUpdatedEmail,
  sendScheduledMaintenanceEmail,
  sendServiceIncidentEmail,
  sendServiceRestoredEmail,
} from './administrative-emails';
