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

  // Enhanced sale patterns with more flexible matching
  const salePatterns = [
    /^(?:record|log|add|make)\s+(?:a\s+)?(?:sale|sales|transaction)/i,
    /^(?:sold|sell)\s+/i,
    /(\d+)\s*(?:bags?|pcs?|pieces?|units?|kg|liters?|bottles?|cans?|boxes?|packs?|cartons?)/i,
    /^(?:customer\s+bought|buyer\s+purchased)/i,
    /(?:record|add|log)\s+(?:sale|sales):\s*/i,  // Explicit sale prefix
    /(?:sold|just\s+sold)\s+\d+.+for/i,  // "sold 5 items for..."
    /(?:made|did)\s+a\s+sale/i,  // "made a sale"
  ];

  // Enhanced product patterns with more flexible matching
  const productPatterns = [
    /^(?:add|create|new|register)\s+(?:a\s+)?(?:product|item|inventory)/i,
    /^(?:add|create)\s+\d+\s+(?:new\s+)?(?:products?|items?|inventory)/i,
    /(?:add|create|register)\s+(?:product|item):\s*/i,  // Explicit product prefix
    /(?:new|create)\s+(?:product|item)\s+named/i,  // "create product named..."
  ];

  // Enhanced expense patterns with more flexible matching
  const expensePatterns = [
    /^(?:record|log|add|track)\s+(?:an?\s+)?(?:expense|expenses|cost|spending|payment)/i,
    /^(?:spent|paid|payment)\s+(?:₦|naira|n\d+|\d+)/i,
    /(?:add|record|log)\s+(?:expense|cost):\s*/i,  // Explicit expense prefix
    /(?:paid|spent)\s+₦?\d+/i,  // "paid ₦5000" or "spent 5000"
    /(?:expense|cost)\s+of\s+₦?\d+/i,  // "expense of ₦5000"
  ];

  // Update product patterns
  const updateProductPatterns = [
    /^(?:update|edit|modify|change)\s+(?:the\s+)?(?:product|item|inventory)/i,
    /^(?:change|set|update)\s+(?:price|cost|stock|name)\s+(?:of|for)/i,
    /(?:update|modify)\s+(?:product|item):\s*/i,  // Explicit update prefix
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
    /^(?:add|remove|restock|replenish)\s+(?:stock|inventory|quantity)/i,
  ];

  // Reports and analytics patterns
  const reportPatterns = [
    /^(?:generate|create|show|get|give me)\s+(?:a\s+)?(?:report|sales report|analytics)/i,
    /^(?:show|what are|tell me about)\s+(?:sales|revenue|profit|performance)/i,
    /^(?:how much|what's the)\s+(?:sales|revenue|profit)/i,
    /^(?:best\s+selling|top\s+products|product\s+performance)/i,
    /^(?:profit\s+and\s+loss|p&l|income\s+statement)/i,
  ];

  // Low stock patterns
  const lowStockPatterns = [
    /^(?:show|get|check)\s+(?:low\s+stock|out of stock|stock alerts)/i,
    /^(?:what\s+products|which products)\s+(?:are|is)\s+(?:low|out of stock)/i,
    /^(?:reorder|restock)\s+(?:suggestions|recommendations)/i,
  ];

  // Expiry management patterns
  const expiryPatterns = [
    /^(?:show|get|check)\s+(?:expiring|expiry|expir(ed|ing))/i,
    /^(?:what\s+products|which products)\s+(?:are|is)\s+(?:expiring|expired)/i,
    /^(?:waste|spoilage|expired\s+items)/i,
  ];

  // Financial insights patterns
  const financialPatterns = [
    /^(?:show|get|check)\s+(?:cash flow|financials|finances)/i,
    /^(?:revenue\s+vs|revenue\s+and\s+expenses)/i,
    /^(?:outstanding|unpaid|credit)\s+(?:payments|debts)/i,
    /^(?:how much|what's the)\s+(?:cash flow|net cash)/i,
  ];

  // Customer insights patterns
  const customerInsightsPatterns = [
    /^(?:show|get|check)\s+(?:customers|customer\s+insights|customer\s+data)/i,
    /^(?:best\s+customers|top\s+customers|loyal customers)/i,
    /^(?:customer\s+segmentation|segment\s+customers)/i,
  ];

  // Price optimization patterns
  const pricePatterns = [
    /^(?:show|get|check)\s+(?:price\s+optimization|price\s+suggestions)/i,
    /^(?:optimize|adjust|change)\s+(?:prices|pricing)/i,
    /^(?:bulk\s+price|price\s+update)/i,
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

  // Check for report intent
  for (const pattern of reportPatterns) {
    if (pattern.test(lower)) {
      const reportData = parseReportData(message);
      return {
        intent: 'generate_report',
        confidence: 0.85,
        data: reportData,
        requiresConfirmation: false,
      };
    }
  }

  // Check for low stock intent
  for (const pattern of lowStockPatterns) {
    if (pattern.test(lower)) {
      return {
        intent: 'get_low_stock',
        confidence: 0.85,
        data: { message },
        requiresConfirmation: false,
      };
    }
  }

  // Check for expiry intent
  for (const pattern of expiryPatterns) {
    if (pattern.test(lower)) {
      const expiryData = parseExpiryData(message);
      return {
        intent: 'get_expiry_info',
        confidence: 0.85,
        data: expiryData,
        requiresConfirmation: false,
      };
    }
  }

  // Check for financial insights intent
  for (const pattern of financialPatterns) {
    if (pattern.test(lower)) {
      const financialData = parseFinancialData(message);
      return {
        intent: 'get_financial_insights',
        confidence: 0.85,
        data: financialData,
        requiresConfirmation: false,
      };
    }
  }

  // Check for customer insights intent
  for (const pattern of customerInsightsPatterns) {
    if (pattern.test(lower)) {
      const customerData = parseCustomerInsightsData(message);
      return {
        intent: 'get_customer_insights',
        confidence: 0.85,
        data: customerData,
        requiresConfirmation: false,
      };
    }
  }

  // Check for price optimization intent
  for (const pattern of pricePatterns) {
    if (pattern.test(lower)) {
      const priceData = parsePriceData(message);
      return {
        intent: 'get_price_optimization',
        confidence: 0.85,
        data: priceData,
        requiresConfirmation: false,
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
 * Parse sale data from message with enhanced flexibility
 */
function parseSaleData(message: string): Record<string, any> {
  const lower = message.toLowerCase();
  const items: SaleItemIntent[] = [];

  // More comprehensive patterns for extracting sales data
  const itemPatterns = [
    // Pattern: "Record sale: 2 Coca-Cola at ₦500 each"
    /(?:record\s+sale:|sold|sell|add|log)\s+(\d+)\s+(.+?)(?:\s+at\s+|@|\s+for\s+)(?:₦?(\d+(?:,\d+)*))\s+(?:each|per)/gi,
    // Pattern: "Sold 2 Coca-Cola for ₦1000"  
    /(?:sold|sell|add|record|log)\s+(\d+)\s+(.+?)(?:\s+for\s+|\s+@\s+|\s+at\s+)?(?:₦?(\d+(?:,\d+)*))/gi,
    // Pattern: "2 Coca-Cola 500 each" 
    /(\d+)\s+(bags?|pcs?|pieces?|units?|kg|liters?|bottles?|cans?|boxes?|packs?|cartons?)\s+(?:of\s+)?(.+?)(?:\s+at\s+|\s+@\s+|\s+for\s+)?(?:₦?(\d+(?:,\d+)*))\s+(?:each|per)/gi,
    // Pattern: "2 Coca-Cola ₦500" (quantity, product, price)
    /(\d+)\s+(.+?)\s+(?:₦?(\d+(?:,\d+)*))/gi,
  ];

  for (const pattern of itemPatterns) {
    let match;
    // Reset lastIndex for reuse of global regex
    pattern.lastIndex = 0;
    while ((match = pattern.exec(message)) !== null) {
      const quantity = parseInt(match[1]) || parseInt(match[2]) || 1;
      const productName = match[2] || match[3] || match[4] || '';
      const priceStr = match[3] || match[4] || match[5];
      const price = priceStr ? parseInt(priceStr.replace(/,/g, '')) : undefined;

      // Skip if product name is too generic (likely a false match)
      if (!productName || productName.trim().toLowerCase().match(/^(and|or|the|a|an|of|for|at|@)$/)) {
        continue;
      }

      items.push({
        productName: productName.trim(),
        quantity,
        price,
      });
    }
  }

  // If no structured items found, try to extract any product mentions with improved logic
  if (items.length === 0) {
    // Look for quantity-price combinations more broadly
    const quantityMatches = message.match(/\b(\d{1,3})\s+(?:bags?|pcs?|pieces?|units?|kg|liters?|bottles?|cans?|boxes?|packs?|cartons?|items?)\s+(.+?)(?:\s+for\s+|\s+at\s+|\s+@\s+)?(?:₦?(\d+(?:,\d+)*))/i);
    if (quantityMatches) {
      items.push({
        productName: quantityMatches[2].trim(),
        quantity: parseInt(quantityMatches[1]),
        price: quantityMatches[3] ? parseInt(quantityMatches[3].replace(/,/g, '')) : undefined,
      });
    }
  }

  // Extract payment method with broader pattern matching
  const methodKeywords: Record<string, string> = {
    'transfer': 'transfer',
    'bank': 'transfer',
    'cash': 'cash',
    'pos': 'pos',
    'card': 'pos',
    'credit': 'credit',
    'on credit': 'credit',
    'later': 'credit',
    'credit sale': 'credit',
    'pay later': 'credit',
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
 * Parse product data from message with enhanced flexibility
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
    .replace(/^(?:add|create|new|register)\s+(?:product|item|inventory):\s*/i, '')  // New explicit pattern
    .trim();

  // Extract price with more flexible patterns
  const pricePatterns = [
    /(?:price|selling\s+price|sell|for|@|at)[:\s]+(?:₦?(\d+(?:,\d+)*))/i,
    /(?:₦?(\d+(?:,\d+)*))\s+(?:per|each|unit)/i,  // "₦500 per unit"
    /at\s+₦?(\d+(?:,\d+)*)\s+(?:each|per)/i,      // "at ₦500 each"
  ];
  
  for (const pattern of pricePatterns) {
    const priceMatch = message.match(pattern);
    if (priceMatch && priceMatch[1]) {
      result.price = parseInt(priceMatch[1].replace(/,/g, ''));
      // Remove price pattern from cleaned message
      cleanedMessage = cleanedMessage.replace(pattern, '').trim();
      break;
    }
  }

  // Extract cost with more flexible patterns
  const costPatterns = [
    /(?:cost|cost\s+price|buying\s+price|buy|purchase\s+price)[:\s]+(?:₦?(\d+(?:,\d+)*))/i,
    /cost\s+of\s+₦?(\d+(?:,\d+)*)/i,  // "cost of ₦500"
  ];
  
  for (const pattern of costPatterns) {
    const costMatch = message.match(pattern);
    if (costMatch && costMatch[1]) {
      result.costPrice = parseInt(costMatch[1].replace(/,/g, ''));
      // Remove cost pattern from cleaned message
      cleanedMessage = cleanedMessage.replace(pattern, '').trim();
      break;
    }
  }

  // Extract stock with more flexible patterns
  const stockPatterns = [
    /(?:stock|quantity|qty|initial\s+stock|opening\s+stock)[:\s]+(\d+)/i,
    /(\d+)\s+(?:items?|units?|pieces?|pcs?|bags?|bottles?|cans?|boxes?|packs?|cartons?)/i,  // "5 bottles"
  ];
  
  for (const pattern of stockPatterns) {
    const stockMatch = message.match(pattern);
    if (stockMatch && stockMatch[1]) {
      result.stock = parseInt(stockMatch[1]);
      // Remove stock pattern from cleaned message
      cleanedMessage = cleanedMessage.replace(pattern, '').trim();
      break;
    }
  }

  // Extract category with more flexible patterns
  const categoryPatterns = [
    /(?:category|type|kind)[:\s]+(.+?)(?:,|$|₦|naira|\d+)/i,
    /(?:in|under|as)\s+(?:the\s+)?(.+?)\s+(?:category|type)/i,  // "in food category"
  ];
  
  for (const pattern of categoryPatterns) {
    const categoryMatch = message.match(pattern);
    if (categoryMatch && categoryMatch[1]) {
      result.category = categoryMatch[1].trim();
      // Remove category pattern from cleaned message
      cleanedMessage = cleanedMessage.replace(pattern, '').trim();
      break;
    }
  }

  // Extract SKU with more flexible patterns
  const skuPatterns = [
    /(?:sku|code|product\s+code)[:\s]+([A-Z0-9-]+)/i,
    /(?:with\s+)?(?:sku|code)\s+([A-Z0-9-]+)/i,
  ];
  
  for (const pattern of skuPatterns) {
    const skuMatch = message.match(pattern);
    if (skuMatch && skuMatch[1]) {
      result.sku = skuMatch[1];
      // Remove SKU pattern from cleaned message
      cleanedMessage = cleanedMessage.replace(pattern, '').trim();
      break;
    }
  }

  // What's left after removing structured data is the product name
  // Clean up any remaining artifacts
  result.name = cleanedMessage
    .replace(/[,，]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If name is still empty, try to extract it from the original message differently
  if (!result.name) {
    // Try to find the product name after the action verb
    const nameMatch = message.match(/(?:add|create|new|register)\s+(?:a\s+)?(?:product|item|inventory)\s+(.+?)(?:\s+with|\s+price|\s+cost|\s+stock|$)/i);
    if (nameMatch) {
      result.name = nameMatch[1].trim();
    }
  }

  return result;
}

/**
 * Parse expense data from message with enhanced flexibility
 */
function parseExpenseData(message: string): ExpenseIntent {
  const result: ExpenseIntent = {
    category: 'General',
    amount: 0,
  };

  // Extract amount with more flexible patterns
  const amountPatterns = [
    /(?:₦|naira\s+|n\s+|^|\s)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s+naira|\s+ngn|$|\s)/i,
    /(?:paid|spent|expense|cost)\s+(?:₦|naira\s+|n\s+)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:₦|naira\s+|n\s+)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(?:for|on|expense|payment)/i,
  ];
  
  for (const pattern of amountPatterns) {
    const match = message.match(pattern);
    if (match) {
      result.amount = parseInt(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract category with expanded keyword mapping
  const categoryKeywords: Record<string, string> = {
    'rent': 'Rent',
    'house rent': 'Rent',
    'office rent': 'Rent',
    'electricity': 'Utilities',
    'electric': 'Utilities',
    'power': 'Utilities',
    'light bill': 'Utilities',
    'water': 'Utilities',
    'internet': 'Utilities',
    'wifi': 'Utilities',
    'salary': 'Payroll',
    'salaries': 'Payroll',
    'wages': 'Payroll',
    'wage': 'Payroll',
    'staff salary': 'Payroll',
    'transport': 'Transportation',
    'transportation': 'Transportation',
    'fuel': 'Transportation',
    'gas': 'Transportation',
    'delivery': 'Transportation',
    'logistics': 'Transportation',
    'taxi': 'Transportation',
    'bus fare': 'Transportation',
    'supplies': 'Supplies',
    'restock': 'Supplies',
    'inventory': 'Supplies',
    'goods': 'Goods & Materials',
    'materials': 'Goods & Materials',
    'marketing': 'Marketing',
    'advertising': 'Marketing',
    'ads': 'Marketing',
    'adverts': 'Marketing',
    'repair': 'Maintenance',
    'maintenance': 'Maintenance',
    'fix': 'Maintenance',
    'service charge': 'Maintenance',
    'office': 'Office Supplies',
    'stationery': 'Office Supplies',
    'office supplies': 'Office Supplies',
    'food': 'Food & Catering',
    'catering': 'Food & Catering',
    'meals': 'Food & Catering',
    'snacks': 'Food & Catering',
    'insurance': 'Insurance',
    'premium': 'Insurance',
    'loan': 'Loan Payment',
    'debt': 'Loan Payment',
    'repayment': 'Loan Payment',
    'loan repayment': 'Loan Payment',
    'subscription': 'Subscriptions',
    'software': 'Subscriptions',
    'platform fee': 'Subscriptions',
    'membership': 'Subscriptions',
    'legal': 'Legal & Professional',
    'lawyer': 'Legal & Professional',
    'accountant': 'Legal & Professional',
    'consultant': 'Legal & Professional',
    'professional': 'Legal & Professional',
  };

  // Check for category in message (case insensitive)
  let matchedCategory = false;
  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (message.toLowerCase().includes(keyword.toLowerCase())) {
      result.category = category;
      matchedCategory = true;
      break;
    }
  }

  // Extract description with more flexible patterns
  const descPatterns = [
    /(?:for|description|note|reason)[:\s]+(.+?)(?:$|₦|naira|\d+)/i,
    /(?:paid|spent|expense)\s+(?:₦|naira|n)?\d+(?:,\d+)*\s+(?:for|on|to)\s+(.+?)(?:$|\.|,)/i,
    /(?:expense|payment)\s+(?:of\s+)?(?:₦|naira|n)?\d+(?:,\d+)*\s+(?:for|on|to)\s+(.+?)(?:$|\.|,)/i,
  ];
  
  for (const pattern of descPatterns) {
    const descMatch = message.match(pattern);
    if (descMatch) {
      result.description = descMatch[1].trim();
      break;
    }
  }

  // Extract date with more flexible patterns
  const datePatterns = [
    /(?:on|date)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/i,
    /(?:for|in)\s+(?:the\s+)?(?:month\s+of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2}),?\s*(\d{4})/i,
  ];
  
  for (const pattern of datePatterns) {
    const dateMatch = message.match(pattern);
    if (dateMatch) {
      // Handle month-year format
      if (dateMatch[1] && dateMatch[2] && isNaN(parseInt(dateMatch[1]))) {
        // Month name found
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === dateMatch[1].toLowerCase());
        if (monthIndex !== -1) {
          result.date = `${dateMatch[2]}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        }
      } else if (dateMatch[1]) {
        result.date = dateMatch[1];
      }
      break;
    }
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
    .replace(/^(?:adjust|update|correct|modify|add|remove|restock|replenish)\s+(?:inventory|stock|quantity)\s+(?:of|for|to|by|with)?[:\s]*/i, '')
    .trim();

  // Extract adjustment amount (positive for add, negative for remove)
  const addMatch = message.match(/(?:add|increase|restock|replenish)\s+(\d+)/i);
  const removeMatch = message.match(/(?:remove|decrease|reduce)\s+(\d+)/i);
  const byMatch = message.match(/(?:by|to|with)\s+([+-]?\d+)/i);
  const withMatch = message.match(/(?:with)\s+(\d+)/i);
  
  if (addMatch) {
    result.adjustment = parseInt(addMatch[1]);
    cleanedMessage = cleanedMessage.replace(/(?:add|increase|restock|replenish)\s+\d+/i, '').trim();
  } else if (removeMatch) {
    result.adjustment = -parseInt(removeMatch[1]);
    cleanedMessage = cleanedMessage.replace(/(?:remove|decrease|reduce)\s+\d+/i, '').trim();
  } else if (withMatch) {
    result.adjustment = parseInt(withMatch[1]);
    cleanedMessage = cleanedMessage.replace(/(?:with)\s+\d+/i, '').trim();
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
 * Parse report data from message
 */
function parseReportData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    reportType: 'sales',
    period: 'month',
  };

  // Extract period
  if (message.toLowerCase().includes('today')) {
    result.period = 'today';
  } else if (message.toLowerCase().includes('week') || message.toLowerCase().includes('this week')) {
    result.period = 'week';
  } else if (message.toLowerCase().includes('month') || message.toLowerCase().includes('this month')) {
    result.period = 'month';
  } else if (message.toLowerCase().includes('year') || message.toLowerCase().includes('this year')) {
    result.period = 'year';
  }

  // Extract report type
  if (message.toLowerCase().includes('profit') || message.toLowerCase().includes('loss') || message.toLowerCase().includes('p&l')) {
    result.reportType = 'profit_loss';
  } else if (message.toLowerCase().includes('product') || message.toLowerCase().includes('performance')) {
    result.reportType = 'product_performance';
  } else if (message.toLowerCase().includes('sales')) {
    result.reportType = 'sales';
  }

  return result;
}

/**
 * Parse expiry data from message
 */
function parseExpiryData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    daysThreshold: 30,
  };

  // Extract days threshold
  const daysMatch = message.match(/(\d+)\s*(?:days?)/i);
  if (daysMatch) {
    result.daysThreshold = parseInt(daysMatch[1]);
  } else if (message.toLowerCase().includes('week')) {
    result.daysThreshold = 7;
  } else if (message.toLowerCase().includes('month')) {
    result.daysThreshold = 30;
  }

  return result;
}

/**
 * Parse financial data from message
 */
function parseFinancialData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    insightType: 'cash_flow',
    period: 'month',
  };

  // Extract period
  if (message.toLowerCase().includes('today')) {
    result.period = 'today';
  } else if (message.toLowerCase().includes('week')) {
    result.period = 'week';
  } else if (message.toLowerCase().includes('month')) {
    result.period = 'month';
  } else if (message.toLowerCase().includes('year')) {
    result.period = 'year';
  }

  // Extract insight type
  if (message.toLowerCase().includes('cash flow')) {
    result.insightType = 'cash_flow';
  } else if (message.toLowerCase().includes('revenue') && message.toLowerCase().includes('expense')) {
    result.insightType = 'revenue_vs_expenses';
  } else if (message.toLowerCase().includes('outstanding') || message.toLowerCase().includes('credit')) {
    result.insightType = 'outstanding_payments';
  }

  return result;
}

/**
 * Parse customer insights data from message
 */
function parseCustomerInsightsData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    insightType: 'all_customers',
    period: 'month',
  };

  // Extract period
  if (message.toLowerCase().includes('today')) {
    result.period = 'today';
  } else if (message.toLowerCase().includes('week')) {
    result.period = 'week';
  } else if (message.toLowerCase().includes('month')) {
    result.period = 'month';
  } else if (message.toLowerCase().includes('year')) {
    result.period = 'year';
  }

  // Extract insight type
  if (message.toLowerCase().includes('segment')) {
    result.insightType = 'segmentation';
  } else if (message.toLowerCase().includes('best') || message.toLowerCase().includes('top') || message.toLowerCase().includes('loyal')) {
    result.insightType = 'top_customers';
  } else if (message.toLowerCase().includes('reward')) {
    result.insightType = 'reward_eligible';
  }

  return result;
}

/**
 * Parse price data from message
 */
function parsePriceData(message: string): Record<string, any> {
  const result: Record<string, any> = {
    action: 'get_suggestions',
  };

  // Extract action
  if (message.toLowerCase().includes('bulk') || message.toLowerCase().includes('all')) {
    result.action = 'bulk_update';
  } else if (message.toLowerCase().includes('optimize')) {
    result.action = 'optimize';
  }

  // Extract category if specified
  const categoryMatch = message.match(/(?:category|type)[:\s]+(.+?)(?:,|$)/i);
  if (categoryMatch) {
    result.category = categoryMatch[1].trim();
  }

  // Extract margin target
  const marginMatch = message.match(/(\d+)%?\s*(?:margin)/i);
  if (marginMatch) {
    result.marginTarget = parseInt(marginMatch[1]);
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

function generateFollowUpSuggestions(intent: IntentData, actionResult?: any): string[] {
  const suggestions = [];
  
  // Generate appropriate follow-up suggestions based on intent
  switch(intent.intent) {
    case 'ask_question':
      suggestions.push(
        `Check your ${PAGE_NAMES.dashboard} for an overview of business metrics`,
        `Look at ${PAGE_NAMES.reports} for detailed analytics`,
        `Visit ${PAGE_NAMES.products} to manage inventory`,
        `Go to ${PAGE_NAMES.expenses} to review spending`
      );
      break;
    case 'record_sale':
      suggestions.push(
        `Check ${PAGE_NAMES.sales} page to review transactions`,
        `Visit ${PAGE_NAMES.products} to see updated inventory`,
        `Review ${PAGE_NAMES.dashboard} for updated metrics`,
        `Look at ${PAGE_NAMES.reports} for sales trends`
      );
      break;
    case 'add_expense':
      suggestions.push(
        `Visit ${PAGE_NAMES.expenses} page to review all expenses`,
        `Check ${PAGE_NAMES.dashboard} for updated financial metrics`,
        `Review ${PAGE_NAMES.reports} for expense trends`,
        `Look at ${PAGE_NAMES.analytics} for cost breakdown`
      );
      break;
    case 'add_product':
      suggestions.push(
        `Check ${PAGE_NAMES.products} page to see all items`,
        `Visit ${PAGE_NAMES.inventory} for stock management`,
        `Review ${PAGE_NAMES.dashboard} for product metrics`,
        `Look at ${PAGE_NAMES.reports} for product performance`
      );
      break;
    case 'view_sales':
      suggestions.push(
        `Visit ${PAGE_NAMES.sales} page for transaction history`,
        `Check ${PAGE_NAMES.reports} for sales analytics`,
        `Review ${PAGE_NAMES.dashboard} for sales metrics`,
        `Look at ${PAGE_NAMES.products} to see best sellers`
      );
      break;
    case 'view_inventory':
      suggestions.push(
        `Check ${PAGE_NAMES.products} page for detailed product info`,
        `Visit ${PAGE_NAMES.inventory} for stock management`,
        `Review ${PAGE_NAMES.dashboard} for inventory metrics`,
        `Look at ${PAGE_NAMES.reports} for inventory trends`
      );
      break;
    case 'view_expenses':
      suggestions.push(
        `Visit ${PAGE_NAMES.expenses} page for detailed expense tracking`,
        `Check ${PAGE_NAMES.reports} for expense analytics`,
        `Review ${PAGE_NAMES.dashboard} for financial metrics`,
        `Look at ${PAGE_NAMES.analytics} for cost breakdown`
      );
      break;
    case 'view_customers':
      suggestions.push(
        `Check ${PAGE_NAMES.customers} page for client details`,
        `Review ${PAGE_NAMES.dashboard} for customer metrics`,
        `Look at ${PAGE_NAMES.reports} for customer analytics`,
        `Visit ${PAGE_NAMES.sales} to see customer transactions`
      );
      break;
    case 'view_suppliers':
      suggestions.push(
        `Check ${PAGE_NAMES.suppliers} page for vendor details`,
        `Review ${PAGE_NAMES.dashboard} for supplier metrics`,
        `Look at ${PAGE_NAMES.reports} for procurement analytics`,
        `Visit ${PAGE_NAMES.expenses} to see supplier payments`
      );
      break;
    case 'view_staff':
      suggestions.push(
        `Check ${PAGE_NAMES.staff} page for employee details`,
        `Review ${PAGE_NAMES.dashboard} for staff metrics`,
        `Look at ${PAGE_NAMES.reports} for staff performance`,
        `Visit ${PAGE_NAMES.settings} for staff management`
      );
      break;
    case 'view_reports':
      suggestions.push(
        `Check ${PAGE_NAMES.reports} page for all analytics`,
        `Review ${PAGE_NAMES.dashboard} for key metrics`,
        `Look at ${PAGE_NAMES.analytics} for detailed insights`,
        `Visit ${PAGE_NAMES.sales} for transaction reports`
      );
      break;
    default:
      suggestions.push(
        `Visit ${PAGE_NAMES.dashboard} for business overview`,
        `Check ${PAGE_NAMES.reports} for analytics`,
        `Manage ${PAGE_NAMES.products} for inventory`,
        `Track ${PAGE_NAMES.sales} for revenue`,
        `Monitor ${PAGE_NAMES.expenses} for costs`
      );
  }
  
  // Limit to 3 suggestions max
  return suggestions.slice(0, 3);
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

// Export PAGE_NAMES for use in other modules
export { PAGE_NAMES };
