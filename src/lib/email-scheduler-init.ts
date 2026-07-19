// Email Scheduler Initialization
// This file initializes the email scheduler when the app starts

import { emailScheduler } from '@/services/email/email-scheduler';

// Initialize the email scheduler
if (typeof window === 'undefined') {
  // Only run on server side
  emailScheduler.initialize();
  console.log('📧 [Email Scheduler] Initialized on server startup');
}

export { emailScheduler };
