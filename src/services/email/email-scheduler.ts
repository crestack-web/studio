// Add the proper import for cron
import * as cron from 'node-cron';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { sendDailyBusinessSummaryEmail, sendTrialReminderEmail } from './subscription-emails';
import { sendWeeklyBusinessReportEmail, sendMonthlyBusinessReportEmail } from './business-activity-emails';
import { sendTrialExpiredEmail } from './subscription-lifecycle-emails';
import {
  sendGraceExtensionEmail,
  sendGraceReminderEmail,
  sendRenewalDueReminderEmail,
} from './retention-emails';

interface ScheduledTask {
  name: string;
  cronExpression: string;
  task: () => Promise<void>;
  enabled: boolean;
}

interface BusinessData {
  businessId: string;
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  trialStartDate?: Timestamp;
  trialEndDate?: Timestamp;
  graceEndDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  subscriptionStatus: string;
  planName?: string;
  planAmount?: number;
}

const GRACE_PERIOD_DAYS = 3;

class EmailScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ [Email Scheduler] Already initialized');
      return;
    }

    console.log('🚀 [Email Scheduler] Initializing...');

    this.registerDailyBusinessSummary();
    this.registerWeeklyBusinessReport();
    this.registerMonthlyBusinessReport();
    this.registerTrialReminders();
    this.registerGraceReminders();
    this.registerRenewalReminders();

    this.isInitialized = true;
    console.log('✅ [Email Scheduler] Initialized successfully');
  }

  private registerTask(task: ScheduledTask) {
    if (!task.enabled) {
      console.log(`⏭️ [Email Scheduler] Skipping disabled task: ${task.name}`);
      return;
    }

    const scheduledTask = cron.schedule(task.cronExpression, async () => {
      console.log(`⏰ [Email Scheduler] Running task: ${task.name}`);
      try {
        await task.task();
        console.log(`✅ [Email Scheduler] Task completed: ${task.name}`);
      } catch (error) {
        console.error(`❌ [Email Scheduler] Task failed: ${task.name}`, error);
      }
    });

    this.tasks.set(task.name, scheduledTask);
    console.log(`📅 [Email Scheduler] Registered task: ${task.name} (${task.cronExpression})`);
  }

  private registerDailyBusinessSummary() {
    this.registerTask({
      name: 'daily-business-summary',
      cronExpression: '0 18 * * *',
      enabled: true,
      task: async () => {
        const businesses = await this.getActiveBusinesses();
        for (const business of businesses) {
          try {
            const salesData = await this.getDailySalesData(business.businessId);
            await sendDailyBusinessSummaryEmail({
              email: business.ownerEmail,
              name: business.ownerName,
              businessName: business.businessName,
              date: new Date().toISOString().split('T')[0],
              totalSales: salesData.totalSales,
              totalProfit: salesData.totalProfit,
              totalExpenses: salesData.totalExpenses,
              transactionCount: salesData.transactionCount,
              topProducts: salesData.topProducts,
              insights: salesData.insights,
              currency: 'NGN',
            });
          } catch (error) {
            console.error(`Failed to send daily summary for ${business.businessName}:`, error);
          }
        }
      },
    });
  }

  private registerWeeklyBusinessReport() {
    this.registerTask({
      name: 'weekly-business-report',
      cronExpression: '0 9 * * 1',
      enabled: true,
      task: async () => {
        const businesses = await this.getActiveBusinesses();
        for (const business of businesses) {
          try {
            const weekData = await this.getWeeklyBusinessData(business.businessId);
            await sendWeeklyBusinessReportEmail({
              email: business.ownerEmail,
              name: business.ownerName,
              businessName: business.businessName,
              weekStartDate: weekData.weekStartDate,
              weekEndDate: weekData.weekEndDate,
              totalRevenue: weekData.totalRevenue,
              totalProfit: weekData.totalProfit,
              totalExpenses: weekData.totalExpenses,
              transactionCount: weekData.transactionCount,
              topProducts: weekData.topProducts,
              insights: weekData.insights,
              currency: 'NGN',
            });
          } catch (error) {
            console.error(`Failed to send weekly report for ${business.businessName}:`, error);
          }
        }
      },
    });
  }

  private registerMonthlyBusinessReport() {
    this.registerTask({
      name: 'monthly-business-report',
      cronExpression: '0 9 1 * *',
      enabled: true,
      task: async () => {
        const businesses = await this.getActiveBusinesses();
        for (const business of businesses) {
          try {
            const monthData = await this.getMonthlyBusinessData(business.businessId);
            await sendMonthlyBusinessReportEmail({
              email: business.ownerEmail,
              name: business.ownerName,
              businessName: business.businessName,
              month: monthData.month,
              year: monthData.year,
              totalRevenue: monthData.totalRevenue,
              totalProfit: monthData.totalProfit,
              totalExpenses: monthData.totalExpenses,
              transactionCount: monthData.transactionCount,
              growthRate: monthData.growthRate,
              topProducts: monthData.topProducts,
              aiRecommendations: monthData.aiRecommendations,
              currency: 'NGN',
            });
          } catch (error) {
            console.error(`Failed to send monthly report for ${business.businessName}:`, error);
          }
        }
      },
    });
  }

  /** Trial retention: days 3, 2, 1 of trial; day 0 sends expired + free extension. */
  private registerTrialReminders() {
    this.registerTask({
      name: 'trial-reminders',
      cronExpression: '0 10 * * *',
      enabled: true,
      task: async () => {
        const businesses = await this.getTrialBusinesses();
        for (const business of businesses) {
          if (!business.trialEndDate) continue;
          const daysRemaining = this.getDaysRemaining(business.trialEndDate);

          if ([3, 2, 1].includes(daysRemaining)) {
            try {
              await sendTrialReminderEmail({
                email: business.ownerEmail,
                name: business.ownerName,
                businessName: business.businessName,
                daysRemaining,
                trialEndDate: business.trialEndDate.toDate().toISOString().split('T')[0],
              });
            } catch (error) {
              console.error(`Failed to send trial reminder for ${business.businessName}:`, error);
            }
          }

          if (daysRemaining === 0) {
            const trialEndStr = business.trialEndDate.toDate().toISOString().split('T')[0];
            const graceEnd = new Date(
              business.trialEndDate.toDate().getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
            );
            const graceEndStr = graceEnd.toISOString().split('T')[0];

            try {
              await sendTrialExpiredEmail({
                email: business.ownerEmail,
                name: business.ownerName,
                businessName: business.businessName,
                trialEndDate: trialEndStr,
              });
            } catch (error) {
              console.error(`Failed to send trial expired for ${business.businessName}:`, error);
            }

            try {
              await sendGraceExtensionEmail({
                email: business.ownerEmail,
                name: business.ownerName,
                businessName: business.businessName,
                trialEndDate: trialEndStr,
                graceEndDate: graceEndStr,
                daysRemainingInGrace: GRACE_PERIOD_DAYS,
              });
            } catch (error) {
              console.error(`Failed to send grace extension for ${business.businessName}:`, error);
            }
          }
        }
      },
    });
  }

  /** Grace reminders: 2, 1, 0 days left before dashboard gate. */
  private registerGraceReminders() {
    this.registerTask({
      name: 'grace-reminders',
      cronExpression: '0 11 * * *',
      enabled: true,
      task: async () => {
        const businesses = await this.getGraceBusinesses();
        for (const business of businesses) {
          if (!business.graceEndDate) continue;
          const daysRemaining = this.getDaysRemaining(business.graceEndDate);
          if ([2, 1, 0].includes(daysRemaining)) {
            try {
              await sendGraceReminderEmail({
                email: business.ownerEmail,
                name: business.ownerName,
                businessName: business.businessName,
                graceEndDate: business.graceEndDate.toDate().toISOString().split('T')[0],
                daysRemaining: Math.max(0, daysRemaining),
              });
            } catch (error) {
              console.error(`Failed to send grace reminder for ${business.businessName}:`, error);
            }
          }
        }
      },
    });
  }

  /** Renewal: 3, 1, 0 days before due; -1, -3 after if unpaid. */
  private registerRenewalReminders() {
    this.registerTask({
      name: 'renewal-reminders',
      cronExpression: '0 9 * * *',
      enabled: true,
      task: async () => {
        const businesses = await this.getRenewalCandidateBusinesses();
        for (const business of businesses) {
          if (!business.subscriptionEndDate) continue;
          const daysUntilDue = this.getSignedDaysUntil(business.subscriptionEndDate);
          if (![3, 1, 0, -1, -3].includes(daysUntilDue)) continue;
          try {
            await sendRenewalDueReminderEmail({
              email: business.ownerEmail,
              name: business.ownerName,
              businessName: business.businessName,
              planName: business.planName || 'Busmo Plan',
              amount: business.planAmount ?? 0,
              currency: 'NGN',
              dueDate: business.subscriptionEndDate.toDate().toISOString().split('T')[0],
              daysUntilDue,
            });
          } catch (error) {
            console.error(`Failed to send renewal reminder for ${business.businessName}:`, error);
          }
        }
      },
    });
  }

  private async enrichWithOwner(
    businessId: string,
    data: Record<string, unknown>
  ): Promise<BusinessData | null> {
    const { firestore } = initializeFirebase();
    const usersRef = collection(firestore, 'users');
    const ownerQuery = query(usersRef, where('businessId', '==', businessId));
    const ownerSnapshot = await getDocs(ownerQuery);
    if (ownerSnapshot.empty) return null;

    const ownerData = ownerSnapshot.docs[0].data();
    const trialEndDate =
      (ownerData.trialEndDate as Timestamp | undefined) ||
      (data.trialEndDate as Timestamp | undefined);
    const graceEndDate =
      (ownerData.graceEndDate as Timestamp | undefined) ||
      (data.graceEndDate as Timestamp | undefined);
    const subscriptionEndDate =
      (ownerData.subscriptionEndDate as Timestamp | undefined) ||
      (data.subscriptionEndDate as Timestamp | undefined);
    const subscriptionStatus =
      (ownerData.subscriptionStatus as string) ||
      (data.subscriptionStatus as string) ||
      'trial';

    return {
      businessId,
      businessName: (data.businessName as string) || 'Unknown Business',
      ownerEmail: ownerData.email,
      ownerName:
        ownerData.displayName || ownerData.email?.split('@')[0] || 'Business Owner',
      trialStartDate: data.trialStartDate as Timestamp | undefined,
      trialEndDate,
      graceEndDate,
      subscriptionEndDate,
      subscriptionStatus,
      planName: (ownerData.planName as string) || (data.planName as string),
      planAmount: (ownerData.planAmount as number) || (data.planAmount as number),
    };
  }

  private async getActiveBusinesses(): Promise<BusinessData[]> {
    try {
      const { firestore } = initializeFirebase();
      const querySnapshot = await getDocs(collection(firestore, 'businesses'));
      const businesses: BusinessData[] = [];
      for (const docSnap of querySnapshot.docs) {
        const enriched = await this.enrichWithOwner(docSnap.id, docSnap.data());
        if (enriched && enriched.subscriptionStatus === 'active') businesses.push(enriched);
      }
      return businesses;
    } catch (error) {
      console.error('Error fetching active businesses:', error);
      return [];
    }
  }

  private async getTrialBusinesses(): Promise<BusinessData[]> {
    try {
      const { firestore } = initializeFirebase();
      const querySnapshot = await getDocs(collection(firestore, 'businesses'));
      const businesses: BusinessData[] = [];
      for (const docSnap of querySnapshot.docs) {
        const enriched = await this.enrichWithOwner(docSnap.id, docSnap.data());
        if (enriched && enriched.subscriptionStatus === 'trial' && enriched.trialEndDate) {
          businesses.push(enriched);
        }
      }
      return businesses;
    } catch (error) {
      console.error('Error fetching trial businesses:', error);
      return [];
    }
  }

  private async getGraceBusinesses(): Promise<BusinessData[]> {
    try {
      const { firestore } = initializeFirebase();
      const querySnapshot = await getDocs(collection(firestore, 'businesses'));
      const businesses: BusinessData[] = [];
      for (const docSnap of querySnapshot.docs) {
        const enriched = await this.enrichWithOwner(docSnap.id, docSnap.data());
        if (enriched && enriched.subscriptionStatus === 'grace' && enriched.graceEndDate) {
          businesses.push(enriched);
        }
      }
      return businesses;
    } catch (error) {
      console.error('Error fetching grace businesses:', error);
      return [];
    }
  }

  private async getRenewalCandidateBusinesses(): Promise<BusinessData[]> {
    try {
      const { firestore } = initializeFirebase();
      const querySnapshot = await getDocs(collection(firestore, 'businesses'));
      const businesses: BusinessData[] = [];
      for (const docSnap of querySnapshot.docs) {
        const enriched = await this.enrichWithOwner(docSnap.id, docSnap.data());
        if (
          enriched &&
          enriched.subscriptionEndDate &&
          (enriched.subscriptionStatus === 'active' ||
            enriched.subscriptionStatus === 'pending_payment' ||
            enriched.subscriptionStatus === 'expired')
        ) {
          businesses.push(enriched);
        }
      }
      return businesses;
    } catch (error) {
      console.error('Error fetching renewal candidates:', error);
      return [];
    }
  }

  private async getDailySalesData(_businessId: string) {
    return {
      totalSales: 0,
      totalProfit: 0,
      totalExpenses: 0,
      transactionCount: 0,
      topProducts: [] as Array<{ name: string; quantity: number; revenue: number }>,
      insights: [] as string[],
    };
  }

  private async getWeeklyBusinessData(_businessId: string) {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      weekStartDate: weekAgo.toISOString().split('T')[0],
      weekEndDate: today.toISOString().split('T')[0],
      totalRevenue: 0,
      totalProfit: 0,
      totalExpenses: 0,
      transactionCount: 0,
      topProducts: [],
      insights: [],
    };
  }

  private async getMonthlyBusinessData(_businessId: string) {
    const today = new Date();
    return {
      month: today.toLocaleString('default', { month: 'long' }),
      year: today.getFullYear(),
      totalRevenue: 0,
      totalProfit: 0,
      totalExpenses: 0,
      transactionCount: 0,
      growthRate: 0,
      topProducts: [],
      aiRecommendations: [],
    };
  }

  private getDaysRemaining(endDate: Timestamp): number {
    const now = new Date();
    const end = endDate.toDate();
    const diffTime = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  private getSignedDaysUntil(endDate: Timestamp): number {
    const now = new Date();
    const end = endDate.toDate();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  stopTask(taskName: string) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      console.log(`⏹️ [Email Scheduler] Stopped task: ${taskName}`);
    }
  }

  startTask(taskName: string) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      console.log(`▶️ [Email Scheduler] Started task: ${taskName}`);
    }
  }

  stopAll() {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`⏹️ [Email Scheduler] Stopped task: ${name}`);
    });
  }

  startAll() {
    this.tasks.forEach((task, name) => {
      task.start();
      console.log(`▶️ [Email Scheduler] Started task: ${name}`);
    });
  }

  getRunningTasks(): string[] {
    return Array.from(this.tasks.keys());
  }
}

export const emailScheduler = new EmailScheduler();
export default emailScheduler;
