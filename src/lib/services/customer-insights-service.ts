/**
 * Customer Management Insights Service
 * Provides customer purchase history analysis, loyalty identification, and segmentation
 */

import { getAdminDb } from '@/lib/firebase-admin';

export interface CustomerInsight {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  daysSinceLastPurchase: number;
  purchaseFrequency: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  topProducts: Array<{
    name: string;
    quantity: number;
    amount: number;
  }>;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  averageRevenue: number;
  characteristics: string[];
}

/**
 * Get customer insights and analysis
 */
export async function getCustomerInsights(businessId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{ success: boolean; data?: CustomerInsight[]; error?: string }> {
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

    // Fetch sales within period
    const salesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('sales')
      .where('createdAt', '>=', start)
      .get();

    // Fetch all customers
    const customersSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('customers')
      .get();

    const customerData: Record<string, CustomerInsight> = {};

    // Initialize customer data
    customersSnapshot.forEach(doc => {
      const customer = doc.data();
      customerData[doc.id] = {
        customerId: doc.id,
        name: customer.name || 'Unknown',
        email: customer.email,
        phone: customer.phone,
        totalPurchases: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        firstPurchaseDate: '',
        lastPurchaseDate: '',
        daysSinceLastPurchase: 0,
        purchaseFrequency: 0,
        loyaltyTier: 'bronze',
        topProducts: [],
      };
    });

    // Process sales data
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const customerId = sale.customerId;
      
      if (!customerId || !customerData[customerId]) {
        return;
      }

      const items = sale.items || [];
      const totalAmount = items.reduce((sum: number, item: any) => sum + ((item.price || item.sellingPrice || 0) * (item.quantity || 0)), 0);
      
      customerData[customerId].totalPurchases += 1;
      customerData[customerId].totalSpent += totalAmount;

      // Track top products
      items.forEach((item: any) => {
        const existingProduct = customerData[customerId].topProducts.find(p => p.name === item.name);
        if (existingProduct) {
          existingProduct.quantity += item.quantity || 0;
          existingProduct.amount += (item.price || item.sellingPrice || 0) * (item.quantity || 0);
        } else {
          customerData[customerId].topProducts.push({
            name: item.name,
            quantity: item.quantity || 0,
            amount: (item.price || item.sellingPrice || 0) * (item.quantity || 0),
          });
        }
      });

      // Track purchase dates
      const saleDate = sale.createdAt?.toDate?.() || new Date();
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (!customerData[customerId].firstPurchaseDate || saleDate < new Date(customerData[customerId].firstPurchaseDate)) {
        customerData[customerId].firstPurchaseDate = dateStr;
      }
      
      if (!customerData[customerId].lastPurchaseDate || saleDate > new Date(customerData[customerId].lastPurchaseDate)) {
        customerData[customerId].lastPurchaseDate = dateStr;
        customerData[customerId].daysSinceLastPurchase = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    });

    // Calculate derived metrics
    Object.values(customerData).forEach(customer => {
      customer.averageOrderValue = customer.totalPurchases > 0 ? customer.totalSpent / customer.totalPurchases : 0;
      
      // Calculate purchase frequency (purchases per month)
      if (customer.firstPurchaseDate && customer.lastPurchaseDate) {
        const firstDate = new Date(customer.firstPurchaseDate);
        const lastDate = new Date(customer.lastPurchaseDate);
        const monthsDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        customer.purchaseFrequency = customer.totalPurchases / monthsDiff;
      }

      // Determine loyalty tier
      if (customer.totalSpent >= 100000) {
        customer.loyaltyTier = 'platinum';
      } else if (customer.totalSpent >= 50000) {
        customer.loyaltyTier = 'gold';
      } else if (customer.totalSpent >= 20000) {
        customer.loyaltyTier = 'silver';
      } else {
        customer.loyaltyTier = 'bronze';
      }

      // Sort top products by quantity
      customer.topProducts.sort((a, b) => b.quantity - a.quantity);
      customer.topProducts = customer.topProducts.slice(0, 5);
    });

    const insightsArray = Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return { success: true, data: insightsArray };
  } catch (error: any) {
    console.error('Error getting customer insights:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Segment customers based on behavior
 */
export async function segmentCustomers(businessId: string): Promise<{ success: boolean; data?: CustomerSegment[]; error?: string }> {
  try {
    const insightsResult = await getCustomerInsights(businessId, 'year');
    
    if (!insightsResult.success || !insightsResult.data) {
      return { success: false, error: insightsResult.error || 'Failed to get customer insights' };
    }

    const customers = insightsResult.data;
    const now = new Date();

    // Define segments
    const segments: Record<string, { count: number; totalRevenue: number; customers: CustomerInsight[] }> = {
      'VIP Customers': { count: 0, totalRevenue: 0, customers: [] },
      'Loyal Customers': { count: 0, totalRevenue: 0, customers: [] },
      'At-Risk Customers': { count: 0, totalRevenue: 0, customers: [] },
      'New Customers': { count: 0, totalRevenue: 0, customers: [] },
      'Inactive Customers': { count: 0, totalRevenue: 0, customers: [] },
    };

    customers.forEach(customer => {
      const daysSinceLastPurchase = customer.daysSinceLastPurchase;
      const loyaltyTier = customer.loyaltyTier;
      
      if (loyaltyTier === 'platinum' || loyaltyTier === 'gold') {
        segments['VIP Customers'].count += 1;
        segments['VIP Customers'].totalRevenue += customer.totalSpent;
        segments['VIP Customers'].customers.push(customer);
      } else if (daysSinceLastPurchase <= 30 && customer.totalPurchases >= 3) {
        segments['Loyal Customers'].count += 1;
        segments['Loyal Customers'].totalRevenue += customer.totalSpent;
        segments['Loyal Customers'].customers.push(customer);
      } else if (daysSinceLastPurchase > 30 && daysSinceLastPurchase <= 60 && customer.totalSpent > 0) {
        segments['At-Risk Customers'].count += 1;
        segments['At-Risk Customers'].totalRevenue += customer.totalSpent;
        segments['At-Risk Customers'].customers.push(customer);
      } else if (daysSinceLastPurchase <= 30 && customer.totalPurchases <= 2) {
        segments['New Customers'].count += 1;
        segments['New Customers'].totalRevenue += customer.totalSpent;
        segments['New Customers'].customers.push(customer);
      } else if (daysSinceLastPurchase > 60) {
        segments['Inactive Customers'].count += 1;
        segments['Inactive Customers'].totalRevenue += customer.totalSpent;
        segments['Inactive Customers'].customers.push(customer);
      }
    });

    const segmentArray: CustomerSegment[] = Object.entries(segments).map(([segment, data]) => ({
      segment,
      count: data.count,
      totalRevenue: data.totalRevenue,
      averageRevenue: data.count > 0 ? data.totalRevenue / data.count : 0,
      characteristics: getSegmentCharacteristics(segment),
    }));

    return { success: true, data: segmentArray };
  } catch (error: any) {
    console.error('Error segmenting customers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get characteristics for a customer segment
 */
function getSegmentCharacteristics(segment: string): string[] {
  const characteristics: Record<string, string[]> = {
    'VIP Customers': ['High spenders', 'Frequent purchases', 'Gold/Platinum tier', 'High lifetime value'],
    'Loyal Customers': ['Regular purchases', 'Active within 30 days', 'Good retention', 'Medium-high spend'],
    'At-Risk Customers': ['Purchased 30-60 days ago', 'Declining activity', 'Need re-engagement', 'Churn risk'],
    'New Customers': ['Recent first purchase', 'Active within 30 days', 'Low purchase count', 'Growth potential'],
    'Inactive Customers': ['No purchase in 60+ days', 'Low engagement', 'Reactivation needed', 'High churn risk'],
  };

  return characteristics[segment] || [];
}

/**
 * Identify customers for rewards
 */
export async function identifyRewardEligibleCustomers(businessId: string): Promise<{ success: boolean; data?: CustomerInsight[]; error?: string }> {
  try {
    const insightsResult = await getCustomerInsights(businessId, 'year');
    
    if (!insightsResult.success || !insightsResult.data) {
      return { success: false, error: insightsResult.error || 'Failed to get customer insights' };
    }

    const customers = insightsResult.data;

    // Filter for reward-eligible customers
    const eligibleCustomers = customers.filter(customer => {
      return customer.loyaltyTier === 'gold' || customer.loyaltyTier === 'platinum';
    });

    return { success: true, data: eligibleCustomers };
  } catch (error: any) {
    console.error('Error identifying reward-eligible customers:', error);
    return { success: false, error: error.message };
  }
}
