import { NextResponse } from 'next/server';
import { emailScheduler } from '@/services/email/email-scheduler';

/**
 * Optional: start in-process node-cron (long-lived Node only).
 * Prefer external cron → GET/POST /api/cron/retention-emails for serverless.
 */
export async function GET() {
  try {
    emailScheduler.initialize();
    const runningTasks = emailScheduler.getRunningTasks();
    return NextResponse.json({
      success: true,
      message:
        'Email scheduler initialized (Supabase). Prefer /api/cron/retention-emails for serverless.',
      runningTasks,
    });
  } catch (error) {
    console.error('Failed to initialize email scheduler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize email scheduler' },
      { status: 500 }
    );
  }
}
