/**
 * MO Intent Router
 * Pure NLU layer - extracts structured intent from user messages
 * Does NOT execute actions or access business logic
 */

export interface IntentData {
  intent: string;
  confidence: number;
  data: Record<string, any>;
  requiresConfirmation: boolean;
  clarification?: {
    message: string;
    options?: Array<{ id: string; name: string; stock?: number }>;
  };
}

export interface SaleItemIntent {
  productName: string;
  quantity: number;
  price?: number;
  costPrice?: number;
}

export interface ProductIntent {
  name: string;
  price: number;
  costPrice: number;
  category?: string;
  stock?: number;
  description?: string;
  sku?: string;
  unit?: string;
  lowStockThreshold?: number;
  productType?: 'product' | 'dish' | 'ingredient';
}

export interface ExpenseIntent {
  category: string;
  amount: number;
  description?: string;
  date?: string;
  paymentMethod?: string;
}

/**
 * Detect user intent from message using pattern matching
 * This is a lightweight alternative to LLM-based intent detection
 * for common, structured actions
 */
export function detectIntent(
  message: string,
  businessContext?: any
): IntentData {
  const lower = message.toLowerCase().trim();

  // Sale patterns
  const salePatterns = [
    /^(?:record|log|add|make)\s+(?:a\s+)?(?:sale|sales|transaction)/i,
    /^(?:sold|sell)\s+/i,
    /(\d+)\s*(?:bags?|pcs?|pieces?|units?|kg|liters?|bottles?|cans?|boxes?|packs?|cartons?)/i,
    /^(?:customer\s+bought|buyer\s+purchased)/i,
  ];

  // Product patterns
  const productPatterns = [
    /^(?:add|create|new|register)\s+(?:a\s+)?(?:product|item|inventory)/i,
    /^(?:add|create)\s+\d+\s+(?:new\s+)?(?:products?|items?|inventory)/i,
  ];

  // Expense patterns
  const expensePatterns = [
    /^(?:record|log|add|track)\s+(?:an?\s+)?(?:expense|expenses|cost|spending|payment)/i,
    /^(?:spent|paid|payment)\s+(?:₦|naira|n\d+|\d+)/i,
  ];

  // Check for sale intent
  for (const pattern of salePatterns) {
    if (pattern.test(lower)) {
      const saleData = parseSaleData(message);
      if (saleData.items.length > 0 || saleData.productName) {
        return {
          intent: 'record_sale',
          confidence: 0.9,
          data: saleData,
          requiresConfirmation: true,
        };
      }
    }
  }

  // Check for product intent
  for (const pattern of productPatterns) {
    if (pattern.test(lower)) {
      const productData = parseProductData(message);
      if (productData.name) {
        return {
          intent: 'add_product',
          confidence: 0.85,
          data: productData,
          requiresConfirmation: true,
        };
      }
    }
  }

  // Check for expense intent
  for (const pattern of expensePatterns) {
    if (pattern.test(lower)) {
      const expenseData = parseExpenseData(message);
      if (expenseData.amount > 0) {
        return {
          intent: 'add_expense',
          confidence: 0.85,
          data: expenseData,
          requiresConfirmation: true,
        };
      }
    }
  }

  // Check for question/analysis intent
  const questionPatterns = [
    /^(?:what|how|why|when|where|who|show|tell|explain|analyze|summarize)/i,
    /\?/,
    /^(?:can you|could you|please|i want to know|help me)/i,
  ];

  for (const pattern of questionPatterns) {
    if (pattern.test(lower)) {
      return {
        intent: 'ask_question',
        confidence: 0.8,
        data: { question: message },
        requiresConfirmation: false,
      };
    }
  }

  // Default: no clear intent
  return {
    intent: 'unknown',
    confidence: 0.3,
    data: { message },
    requiresConfirmation: false,
  };
}

/**
 * Parse sale data from message
 */
function parseSaleData(message: string): Record<string, any> {
  const lower = message.toLowerCase();
  const items: SaleItemIntent[] = [];

  // Pattern: "Sold 2 Coca-Cola for 5000" or "Record sale: 3 rice @ 15000 each"
  const itemPatterns = [
    /(?:sold|sell|add|record|log)\s+(\d+)\s+(.+?)(?:\s+for\s+|\s+@\s+|\s+at\s+)?(?:₦?(\d+(?:,\d+)*))?/gi,
    /(\d+)\s+(bags?|pcs?|pieces?|units?|kg|liters?|bottles?|cans?|boxes?|packs?|cartons?)\s+(?:of\s+)?(.+?)(?:\s+for\s+|\s+@\s+)?(?:₦?(\d+(?:,\d+)*))?/gi,
  ];

  for (const pattern of itemPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const quantity = parseInt(match[1]) || 1;
      const productName = match[2] || match[3] || match[0];
      const priceStr = match[4] || match[3];
      const price = priceStr ? parseInt(priceStr.replace(/,/g, '')) : undefined;

      items.push({
        productName: productName.trim(),
        quantity,
        price,
      });
    }
  }

  // If no structured items found, try to extract any product mentions
  if (items.length === 0) {
    // Pattern: "3 Coca-Cola 5000"
    const simpleMatch = message.match(/(\d+)\s+(.+?)\s+(?:₦?(\d+(?:,\d+)*))/i);
    if (simpleMatch) {
      items.push({
        productName: simpleMatch[2].trim(),
        quantity: parseInt(simpleMatch[1]),
        price: simpleMatch[3] ? parseInt(simpleMatch[3].replace(/,/g, '')) : undefined,
      });
    }
  }

  return {
    items,
    productName: items[0]?.productName,
    quantity: items[0]?.quantity,
    price: items[0]?.price,
  };
}

/**
 * Parse product data from message
 */
function parseProductData(message: string): ProductIntent {
  const result: ProductIntent = {
    name: '',
    price: 0,
    costPrice: 0,
  };

  // Pattern: "Add product: Coca-Cola, price 500, cost 200, stock 100"
  const nameMatch = message.match(/(?:add|create|new)\s+(?:product|item)?[:\s]+(.+?)(?:,|$)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Extract price
  const priceMatch = message.match(/(?:price|selling\s+price|sell)[:\s]+(?:₦?(\d+(?:,\d+)*))/i);
  if (priceMatch) {
    result.price = parseInt(priceMatch[1].replace(/,/g, ''));
  }

  // Extract cost
  const costMatch = message.match(/(?:cost|cost\s+price|buying\s+price)[:\s]+(?:₦?(\d+(?:,\d+)*))/i);
  if (costMatch) {
    result.costPrice = parseInt(costMatch[1].replace(/,/g, ''));
  }

  // Extract stock
  const stockMatch = message.match(/(?:stock|quantity|qty)[:\s]+(\d+)/i);
  if (stockMatch) {
    result.stock = parseInt(stockMatch[1]);
  }

  // Extract category
  const categoryMatch = message.match(/(?:category|type)[:\s]+(.+?)(?:,|$)/i);
  if (categoryMatch) {
    result.category = categoryMatch[1].trim();
  }

  // Extract SKU
  const skuMatch = message.match(/(?:sku|code)[:\s]+([A-Z0-9-]+)/i);
  if (skuMatch) {
    result.sku = skuMatch[1];
  }

  return result;
}

/**
 * Parse expense data from message
 */
function parseExpenseData(message: string): ExpenseIntent {
  const result: ExpenseIntent = {
    category: 'General',
    amount: 0,
  };

  // Extract amount
  const amountMatch = message.match(/(?:₦?(\d+(?:,\d+)*)|(\d+)\s*(?:naira|n))/i);
  if (amountMatch) {
    result.amount = parseInt((amountMatch[1] || amountMatch[2]).replace(/,/g, ''));
  }

  // Extract category
  const categoryKeywords: Record<string, string> = {
    'rent': 'Rent',
    'electricity': 'Utilities',
    'electric': 'Utilities',
    'power': 'Utilities',
    'water': 'Utilities',
    'internet': 'Utilities',
    'salary': 'Payroll',
    'salaries': 'Payroll',
    'wages': 'Payroll',
    'transport': 'Transportation',
    'fuel': 'Transportation',
    'delivery': 'Transportation',
    'supplies': 'Supplies',
    'restock': 'Supplies',
    'inventory': 'Supplies',
    'marketing': 'Marketing',
    'advertising': 'Marketing',
    'repair': 'Maintenance',
    'maintenance': 'Maintenance',
    'office': 'Office Supplies',
  };

  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (message.toLowerCase().includes(keyword)) {
      result.category = category;
      break;
    }
  }

  // Extract description
  const descMatch = message.match(/(?:for|description|note)[:\s]+(.+?)(?:$|₦|₦?\d)/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  // Extract date
  const dateMatch = message.match(/(?:on|date)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/i);
  if (dateMatch) {
    result.date = dateMatch[1];
  }

  return result;
}

/**
 * Validate intent against business context
 * Returns clarification request if data is ambiguous
 */
export function validateIntent(
  intent: IntentData,
  businessContext?: any
): IntentData | { requiresClarification: true; message: string; options?: any[] } {
  if (intent.intent === 'record_sale' && intent.data.items) {
    // Check if product names are too generic
    const genericTerms = ['item', 'product', 'thing', 'stuff'];
    for (const item of intent.data.items) {
      if (genericTerms.includes(item.productName.toLowerCase())) {
        return {
          requiresClarification: true,
          message: `I found multiple products matching "${item.productName}". Please specify which product you want to sell.`,
          options: [], // Would be populated with actual product matches
        };
      }
    }
  }

  return intent;
}