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

  // Update product patterns
  const updateProductPatterns = [
    /^(?:update|edit|modify|change)\s+(?:the\s+)?(?:product|item|inventory)/i,
    /^(?:change|set|update)\s+(?:price|cost|stock|name)\s+(?:of|for)/i,
  ];

  // Delete product patterns
  const deleteProductPatterns = [
    /^(?:delete|remove|archive)\s+(?:the\s+)?(?:product|item|inventory)/i,
  ];

  // Customer patterns
  const customerPatterns = [
    /^(?:add|create|new|register)\s+(?:a\s+)?(?:customer|client|buyer)/i,
  ];

  // Supplier patterns
  const supplierPatterns = [
    /^(?:add|create|new|register)\s+(?:a\s+)?(?:supplier|vendor|distributor)/i,
  ];

  // Payment patterns
  const paymentPatterns = [
    /^(?:record|log)\s+(?:a\s+)?(?:payment|collection|receipt)/i,
    /^(?:received|collected|got)\s+(?:payment|money|cash)/i,
  ];

  // Purchase patterns
  const purchasePatterns = [
    /^(?:record|log)\s+(?:a\s+)?(?:purchase|stock|restock|replenishment)/i,
    /^(?:bought|purchased|ordered)\s+(?:stock|inventory|items)/i,
  ];

  // Inventory adjustment patterns
  const inventoryPatterns = [
    /^(?:adjust|update|correct|modify)\s+(?:inventory|stock)/i,
    /^(?:add|remove)\s+(?:stock|inventory|quantity)/i,
  ];

  // Navigation patterns (explicit navigation requests)
  const navigationPatterns = [
    /^(?:open|go|take\s+me|navigate)\s+(?:to|the)?\s*(?:sales|products|inventory|customers|suppliers|expenses|dashboard|reports)/i,
    /^(?:show|display)\s+(?:the\s+)?(?:sales|products|inventory|customers|suppliers|expenses)\s+page/i,
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

  // Check for navigation intent (explicit navigation requests)
  for (const pattern of navigationPatterns) {
    if (pattern.test(lower)) {
      return {
        intent: 'navigate',
        confidence: 0.9,
        data: parseNavigationData(message),
        requiresConfirmation: false,
      };
    }
  }

  // Check for update product intent
  for (const pattern of updateProductPatterns) {
    if (pattern.test(lower)) {
      const productData = parseProductData(message);
      if (productData.name) {
        return {
          intent: 'update_product',
          confidence: 0.85,
          data: { ...productData, originalMessage: message },
          requiresConfirmation: true,
        };
      }
    }
  }

  // Check for delete product intent
  for (const pattern of deleteProductPatterns) {
    if (pattern.test(lower)) {
      const productName = message.match(/(?:delete|remove|archive)\s+(?:the\s+)?(?:product|item|inventory)?[:\s]+(.+?)(?:$|\.|,)/i)?.[1];
      if (productName) {
        return {
          intent: 'delete_product',
          confidence: 0.85,
          data: { productName: productName.trim() },
          requiresConfirmation: true,
        };
      }
    }
  }

  // Check for customer intent
  for (const pattern of customerPatterns) {
    if (pattern.test(lower)) {
      const customerData = parseCustomerData(message);
      return {
        intent: 'add_customer',
        confidence: 0.85,
        data: customerData,
        requiresConfirmation: true,
      };
    }
  }

  // Check for supplier intent
  for (const pattern of supplierPatterns) {
    if (pattern.test(lower)) {
      const supplierData = parseSupplierData(message);
      return {
        intent: 'add_supplier',
        confidence: 0.85,
        data: supplierData,
        requiresConfirmation: true,
      };
    }
  }

  // Check for payment intent
  for (const pattern of paymentPatterns) {
    if (pattern.test(lower)) {
      const paymentData = parsePaymentData(message);
      return {
        intent: 'record_payment',
        confidence: 0.85,
        data: paymentData,
        requiresConfirmation: true,
      };
    }
  }

  // Check for purchase intent
  for (const pattern of purchasePatterns) {
    if (pattern.test(lower)) {
      const purchaseData = parsePurchaseData(message);
      return {
        intent: 'record_purchase',
        confidence: 0.85,
        data: purchaseData,
        requiresConfirmation: true,
      };
    }
  }

  // Check for inventory adjustment intent
  for (const pattern of inventoryPatterns) {
    if (pattern.test(lower)) {
      const inventoryData = parseInventoryData(message);
      return {
        intent: 'adjust_inventory',
        confidence: 0.85,
        data: inventoryData,
        requiresConfirmation: true,
      };
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

  // Extract payment method
  const methodKeywords: Record<string, string> = {
    'transfer': 'transfer',
    'bank': 'transfer',
    'cash': 'cash',
    'pos': 'pos',
    'card': 'pos',
    'credit': 'credit',
    'on credit': 'credit',
    'later': 'credit',
  };

  let paymentType = 'cash'; // Default to cash
  for (const [keyword, method] of Object.entries(methodKeywords)) {
    if (lower.includes(keyword)) {
      paymentType = method;
      break;
    }
  }

  return {
    items,
    productName: items[0]?.productName,
    quantity: items[0]?.quantity,
    price: items[0]?.price,
    paymentType,
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

  // Remove the action words first to get the product name
  let cleanedMessage = message
    .replace(/^(?:add|create|new|register)\s+(?:a\s+)?(?:product|item|inventory)?[:\s]*/i, '')
    .trim();

  // Extract price first (to remove it from the name)
  const priceMatch = message.match(/(?:price|selling\s+price|sell|for|@)[:\s]+(?:₦?(\d+(?:,\d+)*))/i);
  if (priceMatch) {
    result.price = parseInt(priceMatch[1].replace(/,/g, ''));
    // Remove price pattern from cleaned message
    cleanedMessage = cleanedMessage.replace(/(?:price|selling\s+price|sell|for|@)[:\s]+(?:₦?\d+(?:,\d+)*)/i, '').trim();
  }

  // Extract cost
  const costMatch = message.match(/(?:cost|cost\s+price|buying\s+price|buy)[:\s]+(?:₦?(\d+(?:,\d+)*))/i);
  if (costMatch) {
    result.costPrice = parseInt(costMatch[1].replace(/,/g, ''));
    // Remove cost pattern from cleaned message
    cleanedMessage = cleanedMessage.replace(/(?:cost|cost\s+price|buying\s+price|buy)[:\s]+(?:₦?\d+(?:,\d+)*)/i, '').trim();
  }

  // Extract stock
  const stockMatch = message.match(/(?:stock|quantity|qty)[:\s]+(\d+)/i);
  if (stockMatch) {
    result.stock = parseInt(stockMatch[1]);
    // Remove stock pattern from cleaned message
    cleanedMessage = cleanedMessage.replace(/(?:stock|quantity|qty)[:\s]+\d+/i, '').trim();
  }

  // Extract category
  const categoryMatch = message.match(/(?:category|type)[:\s]+(.+?)(?:,|$)/i);
  if (categoryMatch) {
    result.category = categoryMatch[1].trim();
    // Remove category pattern from cleaned message
    cleanedMessage = cleanedMessage.replace(/(?:category|type)[:\s]+.+?(?:,|$)/i, '').trim();
  }

  // Extract SKU
  const skuMatch = message.match(/(?:sku|code)[:\s]+([A-Z0-9-]+)/i);
  if (skuMatch) {
    result.sku = skuMatch[1];
    // Remove SKU pattern from cleaned message
    cleanedMessage = cleanedMessage.replace(/(?:sku|code)[:\s]+[A-Z0-9-]+/i, '').trim();
  }

  // What's left is the product name
  result.name = cleanedMessage.replace(/[,，]/g, '').trim();

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
 * Parse navigation data from message
 */
function parseNavigationData(message: string): Record<string, any> {
  const lower = message.toLowerCase();
  
  // Extract target page
  const pageKeywords: Record<string, string> = {
    'sales': '/owner/dashboard/sales',
    'products': '/owner/dashboard/products',
    'inventory': '/owner/dashboard/inventory',
    'customers': '/owner/dashboard/customers',
    'suppliers': '/owner/dashboard/suppliers',
    'expenses': '/owner/dashboard/expenses',
    'dashboard': '/owner/dashboard',
    'reports': '/owner/dashboard/reports',
  };

  for (const [keyword, route] of Object.entries(pageKeywords)) {
    if (lower.includes(keyword)) {
      return { target: route, keyword };
    }
  }

  return { target: '/owner/dashboard' };
}

/**
 * Parse customer data from message
 */
function parseCustomerData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    name: '',
    phone: '',
    email: '',
    address: '',
  };

  // Extract name
  const nameMatch = message.match(/(?:add|create|new)\s+(?:customer|client|buyer)?[:\s]+(.+?)(?:,|$|phone|email|address)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Extract phone
  const phoneMatch = message.match(/(?:phone|mobile|contact)[:\s]+(\d+)/i);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
  }

  // Extract email
  const emailMatch = message.match(/(?:email|mail)[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    result.email = emailMatch[1];
  }

  // Extract address
  const addressMatch = message.match(/(?:address|location)[:\s]+(.+?)(?:,|$)/i);
  if (addressMatch) {
    result.address = addressMatch[1].trim();
  }

  return result;
}

/**
 * Parse supplier data from message
 */
function parseSupplierData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    name: '',
    phone: '',
    email: '',
    address: '',
  };

  // Extract name
  const nameMatch = message.match(/(?:add|create|new)\s+(?:supplier|vendor|distributor)?[:\s]+(.+?)(?:,|$|phone|email|address)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // Extract phone
  const phoneMatch = message.match(/(?:phone|mobile|contact)[:\s]+(\d+)/i);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
  }

  // Extract email
  const emailMatch = message.match(/(?:email|mail)[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    result.email = emailMatch[1];
  }

  // Extract address
  const addressMatch = message.match(/(?:address|location)[:\s]+(.+?)(?:,|$)/i);
  if (addressMatch) {
    result.address = addressMatch[1].trim();
  }

  return result;
}

/**
 * Parse payment data from message
 */
function parsePaymentData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    amount: 0,
    method: 'cash',
    customer: '',
    reference: '',
  };

  // Extract amount
  const amountMatch = message.match(/(?:₦?(\d+(?:,\d+)*)|(\d+)\s*(?:naira|n))/i);
  if (amountMatch) {
    result.amount = parseInt((amountMatch[1] || amountMatch[2]).replace(/,/g, ''));
  }

  // Extract payment method
  const methodKeywords: Record<string, string> = {
    'transfer': 'transfer',
    'bank': 'transfer',
    'cash': 'cash',
    'pos': 'pos',
    'card': 'card',
  };

  for (const [keyword, method] of Object.entries(methodKeywords)) {
    if (message.toLowerCase().includes(keyword)) {
      result.method = method;
      break;
    }
  }

  // Extract customer name
  const customerMatch = message.match(/(?:from|customer|client)[:\s]+(.+?)(?:,|$|₦|₦?\d)/i);
  if (customerMatch) {
    result.customer = customerMatch[1].trim();
  }

  return result;
}

/**
 * Parse purchase data from message
 */
function parsePurchaseData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    items: [],
    supplier: '',
    totalAmount: 0,
    paymentMethod: 'cash',
  };

  // Remove action words first
  let cleanedMessage = message
    .replace(/^(?:record|log)\s+(?:a\s+)?(?:purchase|stock|restock|replenishment)[:\s]*/i, '')
    .trim();

  // Extract supplier
  const supplierMatch = message.match(/(?:from|supplier|vendor)[:\s]+(.+?)(?:,|$|for|₦|₦?\d)/i);
  if (supplierMatch) {
    result.supplier = supplierMatch[1].trim();
    cleanedMessage = cleanedMessage.replace(/(?:from|supplier|vendor)[:\s]+.+?(?:,|$|for|₦|₦?\d)/i, '').trim();
  }

  // Extract payment method
  const methodKeywords: Record<string, string> = {
    'transfer': 'transfer',
    'bank': 'transfer',
    'cash': 'cash',
    'pos': 'pos',
    'card': 'card',
    'credit': 'credit',
  };

  for (const [keyword, method] of Object.entries(methodKeywords)) {
    if (message.toLowerCase().includes(keyword)) {
      result.paymentMethod = method;
      break;
    }
  }

  // Extract items - look for pattern: "10 Coca-Cola", "5 bags rice", etc.
  const itemPattern = /(\d+)\s+(.+?)(?:\s+(?:for|@|₦)\s+?(?:\d+(?:,\d+)*))?(?:,|$)/gi;
  let match;
  while ((match = itemPattern.exec(cleanedMessage)) !== null) {
    const quantity = parseInt(match[1]);
    let productName = match[2].trim();
    
    // Remove price if it got captured in the product name
    productName = productName.replace(/(?:for|@|₦)\s+?\d+(?:,\d+)*/gi, '').trim();
    
    if (productName && quantity > 0) {
      result.items.push({
        productName,
        quantity,
        price: undefined,
      });
    }
  }

  // If no items found with pattern, try simpler approach
  if (result.items.length === 0) {
    // Look for "bought X product" pattern
    const boughtMatch = message.match(/(?:bought|purchased|ordered)\s+(\d+)\s+(.+?)(?:,|$|for|@)/i);
    if (boughtMatch) {
      result.items.push({
        productName: boughtMatch[2].trim(),
        quantity: parseInt(boughtMatch[1]),
        price: undefined,
      });
    }
  }

  // Extract total amount
  const amountMatch = message.match(/(?:total|for|amount)[:\s]+(?:₦?(\d+(?:,\d+)*))/i);
  if (amountMatch) {
    result.totalAmount = parseInt(amountMatch[1].replace(/,/g, ''));
  }

  return result;
}

/**
 * Parse inventory adjustment data from message
 */
function parseInventoryData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    productName: '',
    adjustment: 0,
    reason: '',
  };

  // Remove action words first
  let cleanedMessage = message
    .replace(/^(?:adjust|update|correct|modify|add|remove)\s+(?:inventory|stock|quantity)\s+(?:of|for|to|by)?[:\s]*/i, '')
    .trim();

  // Extract adjustment amount (positive for add, negative for remove)
  const addMatch = message.match(/(?:add|increase)\s+(\d+)/i);
  const removeMatch = message.match(/(?:remove|decrease|reduce)\s+(\d+)/i);
  const byMatch = message.match(/(?:by|to)\s+([+-]?\d+)/i);
  
  if (addMatch) {
    result.adjustment = parseInt(addMatch[1]);
    cleanedMessage = cleanedMessage.replace(/(?:add|increase)\s+\d+/i, '').trim();
  } else if (removeMatch) {
    result.adjustment = -parseInt(removeMatch[1]);
    cleanedMessage = cleanedMessage.replace(/(?:remove|decrease|reduce)\s+\d+/i, '').trim();
  } else if (byMatch) {
    result.adjustment = parseInt(byMatch[1]);
    cleanedMessage = cleanedMessage.replace(/(?:by|to)\s+[+-]?\d+/i, '').trim();
  }

  // Extract reason
  const reasonMatch = message.match(/(?:reason|because|due to|for)[:\s]+(.+?)(?:,|$)/i);
  if (reasonMatch) {
    result.reason = reasonMatch[1].trim();
    cleanedMessage = cleanedMessage.replace(/(?:reason|because|due to|for)[:\s]+.+?(?:,|$)/i, '').trim();
  }

  // What's left is the product name
  result.productName = cleanedMessage.replace(/[,，]/g, '').trim();

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