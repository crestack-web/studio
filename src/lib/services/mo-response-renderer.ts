/**
 * MO Response Renderer
 * Transforms ActionResult into UI-ready data structures
 * NO business logic - only presentation formatting
 */

import { ActionResult } from './mo-action-router';

export interface RenderedResponse {
  text: string;
  card?: SaleCard | ProductCard | ExpenseCard;
  metrics?: Array<{ label: string; value: string; trend?: string }>;
  alerts?: Array<{ type: 'warning' | 'info' | 'success' | 'error'; message: string }>;
  suggestions?: string[];
  quickActions?: Array<{ label: string; action: string }>;
}

export interface SaleCard {
  type: 'sale';
  items: Array<{ name: string; quantity: number; price: number; costPrice?: number }>;
  totalRevenue: number;
  totalProfit?: number;
  timestamp: Date;
}

export interface ProductCard {
  type: 'product';
  name: string;
  price: number;
  cost: number;
  stock: number;
  sku?: string;
  message: string;
}

export interface ExpenseCard {
  type: 'expense';
  category: string;
  amount: number;
  date: string;
  message: string;
}

/**
 * Render action result into UI-friendly format
 */
export function renderResponse(result: ActionResult): RenderedResponse {
  if (!result.success) {
    return {
      text: result.message,
      alerts: [
        {
          type: 'error',
          message: result.message,
        },
      ],
    };
  }

  switch (result.action) {
    case 'record_sale':
      return renderSaleResponse(result);
    
    case 'add_product':
      return renderProductResponse(result);
    
    case 'add_expense':
      return renderExpenseResponse(result);
    
    case 'ask_question':
      return {
        text: result.message || 'Here\'s what I found:',
        suggestions: generateFollowUpSuggestions(result.data),
      };
    
    default:
      return {
        text: result.message,
      };
  }
}

/**
 * Render sale response
 */
function renderSaleResponse(result: ActionResult): RenderedResponse {
  const data = result.data;
  const items = data?.items || [];
  const totalRevenue = data?.totalRevenue || 0;
  const totalProfit = data?.profit || 0;

  // Build item summaries
  const itemSummaries = items
    .map((item: any) => `${item.quantity}x ${item.name}`)
    .join(', ');

  // Build text response
  let text = `✅ Sale recorded successfully!\n\n${itemSummaries}\n\nTotal: ₦${totalRevenue.toLocaleString()}`;

  // Add insights
  const insights: string[] = [];
  if (items.length > 0) {
    const remainingStocks = items.map((item: any) => item.remainingStock).filter((stock: number) => stock >= 0);
    if (remainingStocks.length > 0) {
      const minRemaining = Math.min(...remainingStocks);
      if (minRemaining <= 5) {
        insights.push('⚠️ Low stock alert: some items are running low');
      } else if (minRemaining <= 10) {
        insights.push('📦 Keep an eye on stock levels');
      }
    }
  }

  if (totalProfit > 0) {
    insights.push(`💰 Profit: ₦${totalProfit.toLocaleString()}`);
  }

  if (insights.length > 0) {
    text += '\n\n' + insights.join('\n');
  }

  // Build sale card
  const card: SaleCard = {
    type: 'sale',
    items: items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      costPrice: item.costPrice,
    })),
    totalRevenue,
    totalProfit,
    timestamp: new Date(),
  };

  return {
    text,
    card,
    alerts: [
      {
        type: 'success',
        message: 'Inventory updated',
      },
      {
        type: 'success',
        message: 'Profit logged',
      },
      {
        type: 'success',
        message: 'Dashboard updated',
      },
    ],
    suggestions: [
      'Record another sale',
      'View inventory',
      'Check analytics',
    ],
  };
}

/**
 * Render product response
 */
function renderProductResponse(result: ActionResult): RenderedResponse {
  const data = result.data;
  const product = data?.product || {};

  const text = `✅ Product added successfully!\n\n${product.name || 'Product'} has been added to your inventory.\n\nStock: ${product.stock || 0} units\nSelling Price: ₦${(product.price || 0).toLocaleString()}\nCost Price: ₦${(product.cost || 0).toLocaleString()}`;

  const card: ProductCard = {
    type: 'product',
    name: product.name || 'Product',
    price: product.price || 0,
    cost: product.cost || 0,
    stock: product.stock || 0,
    sku: product.sku,
    message: text,
  };

  return {
    text,
    card,
    alerts: [
      {
        type: 'success',
        message: 'Product added to inventory',
      },
      {
        type: 'success',
        message: 'SKU generated',
      },
    ],
    suggestions: [
      'Add another product',
      'View inventory',
      'Record a sale',
    ],
  };
}

/**
 * Render expense response
 */
function renderExpenseResponse(result: ActionResult): RenderedResponse {
  const data = result.data;
  const expense = data?.expense || {};

  const text = `✅ Expense recorded successfully!\n\nCategory: ${expense.category || 'General'}\nAmount: ₦${(expense.amount || 0).toLocaleString()}\nDate: ${expense.date || new Date().toISOString().split('T')[0]}`;

  const card: ExpenseCard = {
    type: 'expense',
    category: expense.category || 'General',
    amount: expense.amount || 0,
    date: expense.date || new Date().toISOString().split('T')[0],
    message: text,
  };

  return {
    text,
    card,
    alerts: [
      {
        type: 'info',
        message: 'Expense tracked',
      },
      {
        type: 'success',
        message: 'Cashflow updated',
      },
    ],
    suggestions: [
      'Add another expense',
      'View expenses',
      'Check cashflow',
    ],
  };
}

/**
 * Generate follow-up suggestions based on context
 */
function generateFollowUpSuggestions(data: any): string[] {
  if (!data) {
    return [
      'Analyze my sales',
      'Show inventory insights',
      'Check cashflow',
    ];
  }

  // Context-aware suggestions
  if (data.category === 'sales') {
    return [
      'Show top products',
      'Compare with last month',
      'View profit trends',
    ];
  }

  if (data.category === 'inventory') {
    return [
      'Show low stock items',
      'Restock suggestions',
      'Inventory valuation',
    ];
  }

  return [
    'Tell me more',
    'Show me the data',
    'Give me recommendations',
  ];
}

/**
 * Format currency in Naira
 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/**
 * Format number with abbreviation
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Calculate percentage change
 */
export function calculateTrend(current: number, previous: number): string {
  if (previous === 0) return '+0%';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}