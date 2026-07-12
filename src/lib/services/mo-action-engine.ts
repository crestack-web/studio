// MO Busmo Action Engine - Seamless Action Triggering
// Knows when to trigger product actions inside Busmo

export type BusmoActionType =
  | 'create_supplier'
  | 'record_expense'
  | 'generate_invoice'
  | 'generate_quotation'
  | 'create_purchase_order'
  | 'record_inventory'
  | 'create_customer'
  | 'generate_financial_report'
  | 'forecast_inventory'
  | 'analyze_sales'
  | 'recommend_reorder'
  | 'record_sale'
  | 'add_product'
  | 'update_product'
  | 'delete_product';

export interface BusmoAction {
  id: string;
  type: BusmoActionType;
  description: string;
  parameters: Record<string, any>;
  confidence: number; // 0-1
  autoExecute: boolean;
  requiresConfirmation: boolean;
  estimatedImpact: string;
  businessId: string;
  userId: string;
}

export interface ActionTriggerContext {
  message: string;
  intent: string;
  businessData: any;
  businessProfile: any;
  extractedEntities: Record<string, any>;
}

export class BusmoActionEngine {
  
  // Determine if a Busmo action should be triggered
  determineAction(context: ActionTriggerContext): BusmoAction | null {
    const { message, intent, extractedEntities } = context;
    
    // Record sale action
    const saleAction = this.detectSaleAction(context);
    if (saleAction) return saleAction;
    
    // Add product action
    const productAction = this.detectProductAction(context);
    if (productAction) return productAction;
    
    // Record expense action
    const expenseAction = this.detectExpenseAction(context);
    if (expenseAction) return expenseAction;
    
    // Create supplier action
    const supplierAction = this.detectSupplierAction(context);
    if (supplierAction) return supplierAction;
    
    // Create customer action
    const customerAction = this.detectCustomerAction(context);
    if (customerAction) return customerAction;
    
    // Generate invoice action
    const invoiceAction = this.detectInvoiceAction(context);
    if (invoiceAction) return invoiceAction;
    
    return null;
  }
  
  // Detect sale recording action
  private detectSaleAction(context: ActionTriggerContext): BusmoAction | null {
    const { message, extractedEntities, intent } = context;
    const lowerMessage = message.toLowerCase();
    
    const salePatterns = [
      /sold|sale|sold\s+\d+|record\s+sale/i,
      /customer\s+bought|bought\s+\d+/i,
    ];
    
    const hasSaleIntent = salePatterns.some(pattern => pattern.test(lowerMessage)) || 
                         intent === 'record_transaction';
    
    if (!hasSaleIntent) return null;
    
    const parameters: Record<string, any> = {};
    
    // Extract product info
    if (extractedEntities.quantities && extractedEntities.quantities.length > 0) {
      parameters.quantity = extractedEntities.quantities[0];
    }
    
    // Extract amount
    if (extractedEntities.amounts && extractedEntities.amounts.length > 0) {
      parameters.amount = extractedEntities.amounts[0];
    }
    
    // Extract customer name if mentioned
    const customerMatch = message.match(/(?:customer|client|for)\s+([A-Z][a-zA-Z\s]+)/i);
    if (customerMatch) {
      parameters.customerName = customerMatch[1].trim();
    }
    
    // Extract product name
    const productMatch = message.match(/(?:sold|bought)\s+(?:\d+\s+)?([a-zA-Z\s]+)/i);
    if (productMatch) {
      parameters.productName = productMatch[1].trim();
    }
    
    const hasRequiredParams = parameters.quantity || parameters.amount;
    
    if (!hasRequiredParams) {
      return null; // Need more information
    }
    
    return {
      id: `action_sale_${Date.now()}`,
      type: 'record_sale',
      description: 'Record a sale transaction',
      parameters,
      confidence: 0.8,
      autoExecute: false,
      requiresConfirmation: true,
      estimatedImpact: 'Updates sales data and cash position',
      businessId: context.businessProfile.businessId || '',
      userId: context.businessProfile.userId || '',
    };
  }
  
  // Detect product management action
  private detectProductAction(context: ActionTriggerContext): BusmoAction | null {
    const { message, extractedEntities, intent } = context;
    const lowerMessage = message.toLowerCase();
    
    const productPatterns = [
      /add\s+product|new\s+product|create\s+product/i,
      /update\s+product|edit\s+product/i,
    ];
    
    const hasProductIntent = productPatterns.some(pattern => pattern.test(lowerMessage)) ||
                            intent === 'inventory_management';
    
    if (!hasProductIntent) return null;
    
    const parameters: Record<string, any> = {};
    const isUpdate = lowerMessage.includes('update') || lowerMessage.includes('edit');
    
    // Extract product name
    const nameMatch = message.match(/(?:product|item)\s*(?:called|named)?\s*([A-Z][a-zA-Z0-9\s]+)/i);
    if (nameMatch) {
      parameters.name = nameMatch[1].trim();
    }
    
    // Extract price
    if (extractedEntities.amounts && extractedEntities.amounts.length > 0) {
      parameters.sellingPrice = extractedEntities.amounts[0];
    }
    
    // Extract cost
    const costMatch = message.match(/cost\s*[₦$]?\s*(\d+)/i);
    if (costMatch) {
      parameters.costPrice = parseFloat(costMatch[1]);
    }
    
    // Extract quantity/stock
    if (extractedEntities.quantities && extractedEntities.quantities.length > 0) {
      parameters.stock = extractedEntities.quantities[0];
    }
    
    const hasRequiredParams = parameters.name || parameters.sellingPrice;
    
    if (!hasRequiredParams) {
      return null;
    }
    
    return {
      id: `action_product_${Date.now()}`,
      type: isUpdate ? 'update_product' : 'add_product',
      description: isUpdate ? 'Update product information' : 'Add new product',
      parameters,
      confidence: 0.7,
      autoExecute: false,
      requiresConfirmation: true,
      estimatedImpact: 'Updates product catalog and inventory',
      businessId: context.businessProfile.businessId || '',
      userId: context.businessProfile.userId || '',
    };
  }
  
  // Detect expense recording action
  private detectExpenseAction(context: ActionTriggerContext): BusmoAction | null {
    const { message, extractedEntities, intent } = context;
    const lowerMessage = message.toLowerCase();
    
    const expensePatterns = [
      /spent|expense|paid|cost|purchase/i,
      /bought\s+(?!product)/i,
    ];
    
    const hasExpenseIntent = expensePatterns.some(pattern => pattern.test(lowerMessage)) ||
                             intent === 'record_transaction';
    
    if (!hasExpenseIntent) return null;
    
    const parameters: Record<string, any> = {};
    
    // Extract amount
    if (extractedEntities.amounts && extractedEntities.amounts.length > 0) {
      parameters.amount = extractedEntities.amounts[0];
    }
    
    // Extract category
    const categoryMatch = message.match(/(?:for|on|category)\s+([a-zA-Z\s]+)/i);
    if (categoryMatch) {
      parameters.category = categoryMatch[1].trim();
    }
    
    // Extract description
    const descMatch = message.match(/(?:spent|paid|bought)\s+(?:₦\$?\s*\d+\s+)?(?:for|on)?\s*([a-zA-Z0-9\s]+)/i);
    if (descMatch) {
      parameters.description = descMatch[1].trim();
    }
    
    if (!parameters.amount) {
      return null;
    }
    
    return {
      id: `action_expense_${Date.now()}`,
      type: 'record_expense',
      description: 'Record an expense',
      parameters,
      confidence: 0.75,
      autoExecute: false,
      requiresConfirmation: true,
      estimatedImpact: 'Updates expense tracking and cash position',
      businessId: context.businessProfile.businessId || '',
      userId: context.businessProfile.userId || '',
    };
  }
  
  // Detect supplier creation action
  private detectSupplierAction(context: ActionTriggerContext): BusmoAction | null {
    const { message, intent } = context;
    const lowerMessage = message.toLowerCase();
    
    const supplierPatterns = [
      /new\s+supplier|add\s+supplier|create\s+supplier/i,
      /supplier\s+called|supplier\s+named/i,
    ];
    
    const hasSupplierIntent = supplierPatterns.some(pattern => pattern.test(lowerMessage)) ||
                              intent === 'supplier_management';
    
    if (!hasSupplierIntent) return null;
    
    const parameters: Record<string, any> = {};
    
    // Extract supplier name
    const nameMatch = message.match(/(?:supplier|vendor)\s*(?:called|named)?\s*([A-Z][a-zA-Z\s]+)/i);
    if (nameMatch) {
      parameters.name = nameMatch[1].trim();
    }
    
    // Extract contact info
    const phoneMatch = message.match(/phone|contact|number\s*[:\s]*([0-9\s\-\+]+)/i);
    if (phoneMatch) {
      parameters.phone = phoneMatch[1].trim();
    }
    
    // Extract location
    const locationMatch = message.match(/(?:located|in|at)\s+([A-Z][a-zA-Z\s]+)/i);
    if (locationMatch) {
      parameters.location = locationMatch[1].trim();
    }
    
    if (!parameters.name) {
      return null;
    }
    
    return {
      id: `action_supplier_${Date.now()}`,
      type: 'create_supplier',
      description: 'Add new supplier',
      parameters,
      confidence: 0.7,
      autoExecute: false,
      requiresConfirmation: true,
      estimatedImpact: 'Updates supplier database for procurement',
      businessId: context.businessProfile.businessId || '',
      userId: context.businessProfile.userId || '',
    };
  }
  
  // Detect customer creation action
  private detectCustomerAction(context: ActionTriggerContext): BusmoAction | null {
    const { message, intent } = context;
    const lowerMessage = message.toLowerCase();
    
    const customerPatterns = [
      /new\s+customer|add\s+customer|create\s+customer/i,
      /customer\s+called|customer\s+named/i,
    ];
    
    const hasCustomerIntent = customerPatterns.some(pattern => pattern.test(lowerMessage)) ||
                              intent === 'customer_management';
    
    if (!hasCustomerIntent) return null;
    
    const parameters: Record<string, any> = {};
    
    // Extract customer name
    const nameMatch = message.match(/(?:customer|client)\s*(?:called|named)?\s*([A-Z][a-zA-Z\s]+)/i);
    if (nameMatch) {
      parameters.name = nameMatch[1].trim();
    }
    
    // Extract contact info
    const phoneMatch = message.match(/phone|contact|number\s*[:\s]*([0-9\s\-\+]+)/i);
    if (phoneMatch) {
      parameters.phone = phoneMatch[1].trim();
    }
    
    // Extract location
    const locationMatch = message.match(/(?:located|in|at)\s+([A-Z][a-zA-Z\s]+)/i);
    if (locationMatch) {
      parameters.location = locationMatch[1].trim();
    }
    
    if (!parameters.name) {
      return null;
    }
    
    return {
      id: `action_customer_${Date.now()}`,
      type: 'create_customer',
      description: 'Add new customer',
      parameters,
      confidence: 0.7,
      autoExecute: false,
      requiresConfirmation: true,
      estimatedImpact: 'Updates customer database for relationship management',
      businessId: context.businessProfile.businessId || '',
      userId: context.businessProfile.userId || '',
    };
  }
  
  // Detect invoice generation action
  private detectInvoiceAction(context: ActionTriggerContext): BusmoAction | null {
    const { message, intent } = context;
    const lowerMessage = message.toLowerCase();
    
    const invoicePatterns = [
      /generate\s+invoice|create\s+invoice|send\s+invoice/i,
      /invoice\s+for/i,
    ];
    
    const hasInvoiceIntent = invoicePatterns.some(pattern => pattern.test(lowerMessage)) ||
                             intent === 'record_transaction';
    
    if (!hasInvoiceIntent) return null;
    
    const parameters: Record<string, any> = {};
    
    // Extract customer name
    const customerMatch = message.match(/(?:invoice|for)\s+(?:customer\s+)?([A-Z][a-zA-Z\s]+)/i);
    if (customerMatch) {
      parameters.customerName = customerMatch[1].trim();
    }
    
    // Extract amount
    const amountMatch = message.match(/(?:for|amount)\s*[₦$]?\s*(\d+)/i);
    if (amountMatch) {
      parameters.amount = parseFloat(amountMatch[1]);
    }
    
    if (!parameters.customerName) {
      return null;
    }
    
    return {
      id: `action_invoice_${Date.now()}`,
      type: 'generate_invoice',
      description: 'Generate invoice for customer',
      parameters,
      confidence: 0.65,
      autoExecute: false,
      requiresConfirmation: true,
      estimatedImpact: 'Creates invoice for customer payment tracking',
      businessId: context.businessProfile.businessId || '',
      userId: context.businessProfile.userId || '',
    };
  }
  
  // Suggest actions based on business context
  suggestContextualActions(context: ActionTriggerContext): BusmoAction[] {
    const actions: BusmoAction[] = [];
    const { businessData, businessProfile } = context;
    
    // Suggest recording sale if no recent sales
    const recentSales = businessData?.sales || [];
    if (recentSales.length === 0 && businessProfile?.stage !== 'idea') {
      actions.push({
        id: `suggest_sale_${Date.now()}`,
        type: 'record_sale',
        description: 'Record your first sale to start tracking revenue',
        parameters: {},
        confidence: 0.5,
        autoExecute: false,
        requiresConfirmation: true,
        estimatedImpact: 'Establishes sales tracking baseline',
        businessId: businessProfile.businessId || '',
        userId: businessProfile.userId || '',
      });
    }
    
    // Suggest adding suppliers if products exist but no suppliers
    const hasProducts = businessData?.products && businessData.products.length > 0;
    const hasSuppliers = businessData?.suppliers && businessData.suppliers.length > 0;
    
    if (hasProducts && businessProfile?.industry !== 'services') {
      if (!hasSuppliers) {
        actions.push({
          id: `suggest_supplier_${Date.now()}`,
          type: 'create_supplier',
          description: 'Add suppliers for your products',
          parameters: {},
          confidence: 0.6,
          autoExecute: false,
          requiresConfirmation: true,
          estimatedImpact: 'Improves inventory management and procurement',
          businessId: businessProfile.businessId || '',
          userId: businessProfile.userId || '',
        });
      }
    }
    
    // Suggest financial report if business is established
    if (businessProfile?.stage === 'mature' || recentSales.length > 10) {
      actions.push({
        id: `suggest_report_${Date.now()}`,
        type: 'generate_financial_report',
        description: 'Generate financial report for business insights',
        parameters: {},
        confidence: 0.5,
        autoExecute: false,
        requiresConfirmation: true,
        estimatedImpact: 'Provides visibility into business performance',
        businessId: businessProfile.businessId || '',
        userId: businessProfile.userId || '',
      });
    }
    
    return actions;
  }
  
  // Format action for AI response
  formatForAIResponse(action: BusmoAction): string {
    let response = '\n\n🎯 SUGGESTED BUSMO ACTION:\n';
    response += `${action.description}\n\n`;
    response += `Parameters:\n`;
    
    Object.entries(action.parameters).forEach(([key, value]) => {
      response += `• ${key}: ${value}\n`;
    });
    
    response += `\nImpact: ${action.estimatedImpact}\n`;
    response += `Confidence: ${(action.confidence * 100).toFixed(0)}%\n`;
    
    if (action.requiresConfirmation) {
      response += `\n⚠️ Requires your confirmation before executing\n`;
    }
    
    return response;
  }
  
  // Format multiple actions for AI response
  formatMultipleForAIResponse(actions: BusmoAction[]): string {
    if (actions.length === 0) return '';
    
    let response = '\n\n🎯 SUGGESTED BUSMO ACTIONS:\n';
    
    actions.forEach((action, index) => {
      response += `\n${index + 1}. ${action.description}\n`;
      if (Object.keys(action.parameters).length > 0) {
        response += `   Parameters: ${Object.keys(action.parameters).join(', ')}\n`;
      }
      response += `   Impact: ${action.estimatedImpact}\n`;
    });
    
    return response;
  }
}

// Singleton instance
let busmoActionEngineInstance: BusmoActionEngine | null = null;

export function getBusmoActionEngine(): BusmoActionEngine {
  if (!busmoActionEngineInstance) {
    busmoActionEngineInstance = new BusmoActionEngine();
  }
  return busmoActionEngineInstance;
}
