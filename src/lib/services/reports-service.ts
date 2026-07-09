/**
 * Reports and Analytics Service
 * Generates sales reports, profit/loss summaries, and product performance insights
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface ReportParams {
  businessId: string;
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  transactionCount: number;
  averageTransactionValue: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  salesByPaymentMethod: Record<string, { count: number; amount: number }>;
  dailyBreakdown: Array<{
    date: string;
    sales: number;
    revenue: number;
    profit: number;
  }>;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  currentStock: number;
  stockTurnover: number;
  revenueGrowth: number;
}

/**
 * Generate sales report for a given period
 */
export async function generateSalesReport(params: ReportParams): Promise<{ success: boolean; data?: SalesReport; error?: string }> {
  const { businessId, period = 'month', startDate, endDate } = params;

  try {
    const db = getAdminDb();

    // Calculate date range
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (period === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
      start = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      start = new Date(now.setMonth(now.getMonth() - 1));
    } else if (period === 'year') {
      start = new Date(now.setFullYear(now.getFullYear() - 1));
    } else if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      start = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Fetch sales within date range
    const salesQuery = db
      .collection('businesses')
      .doc(businessId)
      .collection('sales')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end);

    const salesSnapshot = await salesQuery.get();

    let totalSales = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let transactionCount = salesSnapshot.size;
    const productSales: Record<string, { name: string; quantity: number; revenue: number; cost: number }> = {};
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    const dailyBreakdown: Record<string, { sales: number; revenue: number; profit: number }> = {};

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const items = sale.items || [];
      
      totalSales += items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      
      const saleRevenue = items.reduce((sum: number, item: any) => sum + ((item.price || item.sellingPrice || 0) * (item.quantity || 0)), 0);
      const saleCost = items.reduce((sum: number, item: any) => sum + ((item.costPrice || 0) * (item.quantity || 0)), 0);
      
      totalRevenue += saleRevenue;
      totalCost += saleCost;

      // Track product sales
      items.forEach((item: any) => {
        const key = item.productId || item.name;
        if (!productSales[key]) {
          productSales[key] = { name: item.name, quantity: 0, revenue: 0, cost: 0 };
        }
        productSales[key].quantity += item.quantity || 0;
        productSales[key].revenue += (item.price || item.sellingPrice || 0) * (item.quantity || 0);
        productSales[key].cost += (item.costPrice || 0) * (item.quantity || 0);
      });

      // Track payment methods
      const method = sale.paymentType || 'cash';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += saleRevenue;

      // Track daily breakdown
      const dateKey = sale.createdAt?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = { sales: 0, revenue: 0, profit: 0 };
      }
      dailyBreakdown[dateKey].sales += items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      dailyBreakdown[dateKey].revenue += saleRevenue;
      dailyBreakdown[dateKey].profit += saleRevenue - saleCost;
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Get top selling products
    const topSellingProducts = Object.values(productSales)
      .map(p => ({
        name: p.name,
        quantity: p.quantity,
        revenue: p.revenue,
        profit: p.revenue - p.cost,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Format daily breakdown
    const dailyBreakdownArray = Object.entries(dailyBreakdown)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const report: SalesReport = {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      transactionCount,
      averageTransactionValue,
      topSellingProducts,
      salesByPaymentMethod: paymentMethods,
      dailyBreakdown: dailyBreakdownArray,
    };

    return { success: true, data: report };
  } catch (error: any) {
    console.error('Error generating sales report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get product performance analysis
 */
export async function getProductPerformance(params: ReportParams): Promise<{ success: boolean; data?: ProductPerformance[]; error?: string }> {
  const { businessId, period = 'month' } = params;

  try {
    const db = getAdminDb();

    // Calculate date range
    const now = new Date();
    let start: Date;
    
    if (period === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
      start = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      start = new Date(now.setMonth(now.getMonth() - 1));
    } else if (period === 'year') {
      start = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
      start = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Fetch all products
    const productsSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .get();

    // Fetch sales for the period
    const salesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('sales')
      .where('createdAt', '>=', start)
      .get();

    // Calculate product performance
    const productPerformance: Record<string, ProductPerformance> = {};

    productsSnapshot.forEach(doc => {
      const product = doc.data();
      productPerformance[doc.id] = {
        productId: doc.id,
        name: product.name,
        totalSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        currentStock: product.stock || product.quantity || 0,
        stockTurnover: 0,
        revenueGrowth: 0,
      };
    });

    // Aggregate sales data
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const items = sale.items || [];
      
      items.forEach((item: any) => {
        const key = item.productId;
        if (productPerformance[key]) {
          const quantity = item.quantity || 0;
          const revenue = (item.price || item.sellingPrice || 0) * quantity;
          const cost = (item.costPrice || 0) * quantity;
          
          productPerformance[key].totalSold += quantity;
          productPerformance[key].totalRevenue += revenue;
          productPerformance[key].totalCost += cost;
          productPerformance[key].totalProfit += revenue - cost;
        }
      });
    });

    // Calculate derived metrics
    Object.values(productPerformance).forEach(perf => {
      perf.profitMargin = perf.totalRevenue > 0 ? (perf.totalProfit / perf.totalRevenue) * 100 : 0;
      perf.stockTurnover = perf.currentStock > 0 ? perf.totalSold / perf.currentStock : 0;
    });

    const performanceArray = Object.values(productPerformance)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return { success: true, data: performanceArray };
  } catch (error: any) {
    console.error('Error getting product performance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate profit/loss summary
 */
export async function generateProfitLossSummary(params: ReportParams): Promise<{ success: boolean; data?: any; error?: string }> {
  const { businessId, period = 'month' } = params;

  try {
    const db = getAdminDb();

    // Calculate date range
    const now = new Date();
    let start: Date;
    
    if (period === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
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

    // Calculate totals
    let totalRevenue = 0;
    let totalCostOfGoods = 0;

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const items = sale.items || [];
      
      totalRevenue += items.reduce((sum: number, item: any) => sum + ((item.price || item.sellingPrice || 0) * (item.quantity || 0)), 0);
      totalCostOfGoods += items.reduce((sum: number, item: any) => sum + ((item.costPrice || 0) * (item.quantity || 0)), 0);
    });

    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};

    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      const amount = expense.amount || 0;
      totalExpenses += amount;
      
      const category = expense.category || 'General';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    });

    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      success: true,
      data: {
        period,
        totalRevenue,
        totalCostOfGoods,
        grossProfit,
        grossProfitMargin,
        totalExpenses,
        expensesByCategory,
        netProfit,
        netProfitMargin,
      },
    };
  } catch (error: any) {
    console.error('Error generating profit/loss summary:', error);
    return { success: false, error: error.message };
  }
}
