import { NextResponse } from 'next/server';
import { emailScheduler } from '@/services/email/email-scheduler';

export async function GET() {
  try {
    // Initialize the email scheduler
    emailScheduler.initialize();
    
    const runningTasks = emailScheduler.getRunningTasks();
    
    return NextResponse.json({
      success: true,
      message: 'Email scheduler initialized',
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
