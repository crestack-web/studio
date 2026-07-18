// ═══════════════════════════════════════════
//  Email Scheduler Service
// ═══════════════════════════════════════════
//  Automated email scheduling using node-cron
// ═══════════════════════════════════════════

import cron from 'node-cron';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { sendDailyBusinessSummaryEmail, sendBusinessInsightsEmail, sendTrialReminderEmail } from './subscription-emails';
import { sendWeeklyBusinessReportEmail, sendMonthlyBusinessReportEmail } from './business-activity-emails';

// ═══════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════

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
  subscriptionStatus: string;
}

// ═══════════════════════════════════════════
//  Scheduler State
// ═══════════════════════════════════════════

class EmailScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  // ═══════════════════════════════════════════
  //  Initialization
  // ═══════════════════════════════════════════

  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ [Email Scheduler] Already initialized');
      return;
    }

    console.log('🚀 [Email Scheduler] Initializing...');
    
    // Register all scheduled tasks
    this.registerDailyBusinessSummary();
    this.registerWeeklyBusinessReport();
    this.registerMonthlyBusinessReport();
    this.registerTrialReminders();
    
    this.isInitialized = true;
    console.log('✅ [Email Scheduler] Initialized successfully');
  }

  // ═══════════════════════════════════════════
  //  Task Registration
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  //  Scheduled Tasks
  // ═══════════════════════════════════════════

  private registerDailyBusinessSummary() {
    this.registerTask({
      name: 'daily-business-summary',
      cronExpression: '0 18 * * *', // 6:00 PM daily
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
      cronExpression: '0 9 * * 1', // 9:00 AM every Monday
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
      cronExpression: '0 9 1 * *', // 9:00 AM on 1st of every month
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

  private registerTrialReminders() {
    this.registerTask({
      name: 'trial-reminders',
      cronExpression: '0 10 * * *', // 10:00 AM daily
      enabled: true,
      task: async () => {
        const businesses = await this.getTrialBusinesses();
        
        for (const business of businesses) {
          if (!business.trialEndDate) continue;
          
          const daysRemaining = this.getDaysRemaining(business.trialEndDate);
          
          // Send reminders at 3 days, 2 days, 1 day, and 0 days remaining
          if ([3, 2, 1, 0].includes(daysRemaining)) {
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
        }
      },
    });
  }

  // ═══════════════════════════════════════════
  //  Data Retrieval Helpers
  // ═══════════════════════════════════════════

  private async getActiveBusinesses(): Promise<BusinessData[]> {
    try {
      const { firestore } = initializeFirebase();
      const businessesRef = collection(firestore, 'businesses');
      const querySnapshot = await getDocs(businessesRef);
      
      const businesses: BusinessData[] = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Get owner info
        const usersRef = collection(firestore, 'users');
        const ownerQuery = query(usersRef, where('businessId', '==', doc.id));
        const ownerSnapshot = await getDocs(ownerQuery);
        
        if (!ownerSnapshot.empty) {
          const ownerData = ownerSnapshot.docs[0].data();
          businesses.push({
            businessId: doc.id,
            businessName: data.businessName || 'Unknown Business',
            ownerEmail: ownerData.email,
            ownerName: ownerData.displayName || ownerData.email?.split('@')[0] || 'Business Owner',
            trialStartDate: data.trialStartDate,
            trialEndDate: data.trialEndDate,
            subscriptionStatus: data.subscriptionStatus || 'trial',
          });
        }
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
      const businessesRef = collection(firestore, 'businesses');
      const querySnapshot = await getDocs(businessesRef);
      
      const businesses: BusinessData[] = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        if (data.subscriptionStatus === 'trial' && data.trialEndDate) {
          // Get owner info
          const usersRef = collection(firestore, 'users');
          const ownerQuery = query(usersRef, where('businessId', '==', doc.id));
          const ownerSnapshot = await getDocs(ownerQuery);
          
          if (!ownerSnapshot.empty) {
            const ownerData = ownerSnapshot.docs[0].data();
            businesses.push({
              businessId: doc.id,
              businessName: data.businessName || 'Unknown Business',
              ownerEmail: ownerData.email,
              ownerName: ownerData.displayName || ownerData.email?.split('@')[0] || 'Business Owner',
              trialStartDate: data.trialStartDate,
              trialEndDate: data.trialEndDate,
              subscriptionStatus: data.subscriptionStatus,
            });
          }
        }
      }
      
      return businesses;
    } catch (error) {
      console.error('Error fetching trial businesses:', error);
      return [];
    }
  }

  private async getDailySalesData(businessId: string) {
    // Mock implementation - replace with actual data retrieval
    return {
      totalSales: 0,
      totalProfit: 0,
      totalExpenses: 0,
      transactionCount: 0,
      topProducts: [],
      insights: [],
    };
  }

  private async getWeeklyBusinessData(businessId: string) {
    // Mock implementation - replace with actual data retrieval
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

  private async getMonthlyBusinessData(businessId: string) {
    // Mock implementation - replace with actual data retrieval
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

  private getDaysRemaining(trialEndDate: Timestamp): number {
    const now = new Date();
    const endDate = trialEndDate.toDate();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // ═══════════════════════════════════════════
  //  Task Management
  // ═══════════════════════════════════════════

  stopTask(taskName: string) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      console.log(`⏹️ [Email Scheduler] Stopped task: ${taskName}`);
    } else {
      console.warn(`⚠️ [Email Scheduler] Task not found: ${taskName}`);
    }
  }

  startTask(taskName: string) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      console.log(`▶️ [Email Scheduler] Started task: ${taskName}`);
    } else {
      console.warn(`⚠️ [Email Scheduler] Task not found: ${taskName}`);
    }
  }

  stopAll() {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`⏹️ [Email Scheduler] Stopped task: ${name}`);
    });
    console.log('🛑 [Email Scheduler] All tasks stopped');
  }

  startAll() {
    this.tasks.forEach((task, name) => {
      task.start();
      console.log(`▶️ [Email Scheduler] Started task: ${name}`);
    });
    console.log('▶️ [Email Scheduler] All tasks started');
  }

  getRunningTasks(): string[] {
    return Array.from(this.tasks.keys());
  }
}

// ═══════════════════════════════════════════
//  Export singleton instance
// ═══════════════════════════════════════════

export const emailScheduler = new EmailScheduler();

export default emailScheduler;
