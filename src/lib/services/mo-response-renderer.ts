/**
 * MO Response Renderer
 * Transforms ActionResult into UI-ready data structures
 * NO business logic - only presentation formatting
 */

import { ActionResult } from './mo-action-router';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'mo';
  timestamp: Date;
  type?: 'text' | 'action' | 'error';
  actionResult?: ActionResult;
}

// Define the RenderedResponse type
export interface RenderedResponse {
  text: string;
  card?: SaleCard | ProductCard | ExpenseCard;
  alerts?: Array<{ type: 'success' | 'warning' | 'error' | 'info'; message: string }>;
  suggestions?: string[];
}

// Define card types
interface SaleCard {
  type: 'sale';
  items: Array<{ name: string; quantity: number; price: number; costPrice?: number }>;
  totalRevenue: number;
  totalProfit?: number;
  timestamp: Date;
}

interface ProductCard {
  type: 'product';
  name: string;
  price: number;
  cost: number;
  stock: number;
  sku?: string;
  message: string;
}

interface ExpenseCard {
  type: 'expense';
  category: string;
  amount: number;
  description?: string;
  date?: string;
  message: string;
}

/**
 * Render MO response with enhanced feedback for text command issues
 */
export function renderResponse(
  message: string,
  actionResult?: ActionResult,
  intent?: { intent: string; data: Record<string, any> }
): Message {
  const baseMessage: Message = {
    id: Date.now().toString(),
    content: message,
    sender: 'mo',
    timestamp: new Date(),
    type: 'text',
  };

  if (actionResult) {
    baseMessage.actionResult = actionResult;
    
    // Enhance error messages with guidance for better text commands
    if (!actionResult.success) {
      baseMessage.type = 'error';
      
      // If it's a parsing or validation error, provide specific guidance
      if (actionResult.error?.includes('Product not found') || 
          actionResult.message.includes('not found')) {
        baseMessage.content = `${actionResult.message}\n\n💡 Tip: Make sure to spell product names exactly as they appear in your inventory. You can check the ${PAGE_NAMES.products} page for correct names.`;
      } else if (actionResult.error?.includes('Invalid amount') || 
                 actionResult.error?.includes('Amount')) {
        baseMessage.content = `${actionResult.message}\n\n💡 Tip: Include currency symbols with amounts (e.g., "₦5000" instead of just "5000").`;
      } else if (actionResult.error?.includes('Category')) {
        baseMessage.content = `${actionResult.message}\n\n💡 Tip: Use standard expense categories like "Rent", "Utilities", "Payroll", "Transportation", etc.`;
      } else {
        baseMessage.content = `${actionResult.message}\n\n💡 Tip: Try using more structured commands like "Record sale: 5 items at ₦200 each" or "Add expense: Rent ₦5000".`;
      }
    } else {
      baseMessage.type = 'action';
    }
  }

  return baseMessage;
}

// Define the actual page names for navigation guidance
const PAGE_NAMES = {
  dashboard: "Dashboard",
  products: "Products",
  inventory: "Inventory",
  sales: "Record Sale",
  expenses: "Expenses",
  reports: "Reports",
  analytics: "Analytics",
  customers: "Customers",
  suppliers: "Suppliers",
  staff: "Staff",
  ask_mo: "Ask MO",
  settings: "Settings"
};

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