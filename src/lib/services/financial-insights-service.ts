/**
 * Financial Insights Service
 * Provides cash flow analysis, revenue vs expenses comparison, and payment tracking
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface CashFlowData {
  period: string;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  inflowBySource: Record<string, number>;
  outflowByCategory: Record<string, number>;
  dailyBreakdown: Array<{
    date: string;
    inflow: number;
    outflow: number;
    netFlow: number;
  }>;
}

export interface RevenueVsExpenses {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  expenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
  }>;
  expenseTrend: Array<{
    date: string;
    expenses: number;
  }>;
}

export interface OutstandingPayment {
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  paymentMethod: string;
}

/**
 * Get cash flow analysis
 */
export async function getCashFlowAnalysis(businessId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{ success: boolean; data?: CashFlowData; error?: string }> {
  try {
    const db = getAdminDb();

    // Calculate date range
    const now = new Date();
    let start: Date;
    
    if (period === 'week') {
      start = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      start = new Date(now.setMonth(now.getMonth() - 1));
    } else if (period === 'year') {
      start = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
      start = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Fetch sales (inflow)
    const salesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('sales')
      .where('createdAt', '>=', start)
      .get();

    // Fetch expenses (outflow)
    const expensesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('expenses')
      .where('createdAt', '>=', start)
      .get();

    // Fetch payments received
    const paymentsSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('payments')
      .where('createdAt', '>=', start)
      .get();

    let totalInflow = 0;
    let totalOutflow = 0;
    const inflowBySource: Record<string, number> = {};
    const outflowByCategory: Record<string, number> = {};
    const dailyBreakdown: Record<string, { inflow: number; outflow: number }> = {};

    // Process sales
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const items = sale.items || [];
      const revenue = items.reduce((sum: number, item: any) => sum + ((item.price || item.sellingPrice || 0) * (item.quantity || 0)), 0);
      
      totalInflow += revenue;
      
      const method = sale.paymentType || 'cash';
      inflowBySource[method] = (inflowBySource[method] || 0) + revenue;

      const dateKey = sale.createdAt?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = { inflow: 0, outflow: 0 };
      }
      dailyBreakdown[dateKey].inflow += revenue;
    });

    // Process payments
    paymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      const amount = payment.amount || 0;
      
      totalInflow += amount;
      
      const method = payment.method || 'cash';
      inflowBySource[method] = (inflowBySource[method] || 0) + amount;

      const dateKey = payment.createdAt?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = { inflow: 0, outflow: 0 };
      }
      dailyBreakdown[dateKey].inflow += amount;
    });

    // Process expenses
    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      const amount = expense.amount || 0;
      const category = expense.category || 'General';
      
      totalOutflow += amount;
      outflowByCategory[category] = (outflowByCategory[category] || 0) + amount;

      const dateKey = expense.createdAt?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = { inflow: 0, outflow: 0 };
      }
      dailyBreakdown[dateKey].outflow += amount;
    });

    // Format daily breakdown
    const dailyBreakdownArray = Object.entries(dailyBreakdown)
      .map(([date, data]) => ({
        date,
        inflow: data.inflow,
        outflow: data.outflow,
        netFlow: data.inflow - data.outflow,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const cashFlowData: CashFlowData = {
      period,
      totalInflow,
      totalOutflow,
      netCashFlow: totalInflow - totalOutflow,
      inflowBySource,
      outflowByCategory,
      dailyBreakdown: dailyBreakdownArray,
    };

    return { success: true, data: cashFlowData };
  } catch (error: any) {
    console.error('Error getting cash flow analysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get revenue vs expenses comparison
 */
export async function getRevenueVsExpenses(businessId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{ success: boolean; data?: RevenueVsExpenses; error?: string }> {
  try {
    const db = getAdminDb();

    // Calculate date range
    const now = new Date();
    let start: Date;
    
    if (period === 'week') {
      start = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      start = new Date(now.setMonth(now.getMonth() - 1));
    } else if (period === 'year') {
      start = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
      start = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Fetch sales
    const salesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('sales')
      .where('createdAt', '>=', start)
      .get();

    // Fetch expenses
    const expensesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('expenses')
      .where('createdAt', '>=', start)
      .get();

    let totalRevenue = 0;
    let totalExpenses = 0;
    const expenseCategories: Record<string, number> = {};
    const revenueTrend: Record<string, number> = {};
    const expenseTrend: Record<string, number> = {};

    // Process sales
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const items = sale.items || [];
      const revenue = items.reduce((sum: number, item: any) => sum + ((item.price || item.sellingPrice || 0) * (item.quantity || 0)), 0);
      
      totalRevenue += revenue;

      const dateKey = sale.createdAt?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      revenueTrend[dateKey] = (revenueTrend[dateKey] || 0) + revenue;
    });

    // Process expenses
    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      const amount = expense.amount || 0;
      const category = expense.category || 'General';
      
      totalExpenses += amount;
      expenseCategories[category] = (expenseCategories[category] || 0) + amount;

      const dateKey = expense.createdAt?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      expenseTrend[dateKey] = (expenseTrend[dateKey] || 0) + amount;
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Format expense categories with percentages
    const expenseCategoriesArray = Object.entries(expenseCategories)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Format trends
    const revenueTrendArray = Object.entries(revenueTrend)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const expenseTrendArray = Object.entries(expenseTrend)
      .map(([date, expenses]) => ({ date, expenses }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const data: RevenueVsExpenses = {
      period,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      expenseCategories: expenseCategoriesArray,
      revenueTrend: revenueTrendArray,
      expenseTrend: expenseTrendArray,
    };

    return { success: true, data };
  } catch (error: any) {
    console.error('Error getting revenue vs expenses:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get outstanding payments (credit sales)
 */
export async function getOutstandingPayments(businessId: string): Promise<{ success: boolean; data?: OutstandingPayment[]; error?: string }> {
  try {
    const db = getAdminDb();

    // Fetch sales with credit payment
    const salesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('sales')
      .where('paymentType', '==', 'credit')
      .get();

    const outstandingPayments: OutstandingPayment[] = [];
    const now = new Date();

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const items = sale.items || [];
      const amount = items.reduce((sum: number, item: any) => sum + ((item.price || item.sellingPrice || 0) * (item.quantity || 0)), 0);
      
      const dueDate = sale.dueDate || sale.createdAt?.toDate?.() || now;
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      outstandingPayments.push({
        customerId: sale.customerId || 'unknown',
        customerName: sale.customerName || 'Unknown Customer',
        amount,
        dueDate: dueDate.toISOString().split('T')[0],
        daysOverdue,
        paymentMethod: 'credit',
      });
    });

    // Sort by days overdue (most overdue first)
    outstandingPayments.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return { success: true, data: outstandingPayments };
  } catch (error: any) {
    console.error('Error getting outstanding payments:', error);
    return { success: false, error: error.message };
  }
}
