/**
 * MO Action Router
 * Centralized execution layer - maps intents to existing Busmo services
 * This is the ONLY place where business operations are executed
 */

import { recordSale, findProductByName } from './record-sale-service';
import { addProduct } from './add-product-service';
import { addExpense } from './add-expense-service';
import { updateProduct } from './update-product-service';
import { deleteProduct } from './delete-product-service';
import { addCustomer } from './add-customer-service';
import { addSupplier } from './add-supplier-service';
import { recordPayment } from './record-payment-service';
import { recordPurchase } from './record-purchase-service';
import { adjustInventory } from './adjust-inventory-service';
import { generateSalesReport, getProductPerformance, generateProfitLossSummary } from './reports-service';
import { getLowStockAlerts, generateReorderSuggestions } from './low-stock-service';
import { getExpiringProducts, generateWasteReport } from './expiry-management-service';
import { getCashFlowAnalysis, getRevenueVsExpenses, getOutstandingPayments } from './financial-insights-service';
import { getCustomerInsights, segmentCustomers, identifyRewardEligibleCustomers } from './customer-insights-service';
import { getPriceOptimizations } from './price-optimization-service';
import { triggerActionRefresh } from '@/utils/dataRefresh';

export interface ActionContext {
  businessId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  staffId?: string;
}

export interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  data?: any;
  error?: string;
  requiresClarification?: boolean;
  clarification?: {
    message: string;
    options?: Array<{ id: string; name: string; stock?: number }>;
  };
}

/**
 * Execute action based on intent
 * Routes to appropriate existing Busmo service
 */
export async function executeAction(
  intent: { intent: string; data: Record<string, any>; requiresConfirmation?: boolean },
  context: ActionContext
): Promise<ActionResult> {
  const { intent: intentType, data, requiresConfirmation } = intent;

  try {
    console.log('🔍 [MO Action Router] Executing action:', intentType, 'with data:', data);
    
    switch (intentType) {
      case 'record_sale':
        return await handleRecordSale(data, context);
      
      case 'add_product':
        return await handleAddProduct(data, context);
      
      case 'add_expense':
        return await handleAddExpense(data, context);
      
      case 'update_product':
        return await handleUpdateProduct(data, context);
      
      case 'delete_product':
        return await handleDeleteProduct(data, context);
      
      case 'add_customer':
        return await handleAddCustomer(data, context);
      
      case 'add_supplier':
        return await handleAddSupplier(data, context);
      
      case 'record_payment':
        return await handleRecordPayment(data, context);
      
      case 'record_purchase':
        return await handleRecordPurchase(data, context);
      
      case 'adjust_inventory':
        return await handleAdjustInventory(data, context);
      
      case 'generate_report':
        return await handleGenerateReport(data, context);
      
      case 'get_low_stock':
        return await handleGetLowStock(data, context);
      
      case 'get_expiry_info':
        return await handleGetExpiryInfo(data, context);
      
      case 'get_financial_insights':
        return await handleGetFinancialInsights(data, context);
      
      case 'get_customer_insights':
        return await handleGetCustomerInsights(data, context);
      
      case 'get_price_optimization':
        return await handleGetPriceOptimization(data, context);
      
      case 'navigate':
        return {
          success: true,
          action: 'navigate',
          message: `Navigating to ${data.target || 'dashboard'}`,
          data: { route: data.target },
        };
      
      case 'ask_question':
        return {
          success: true,
          action: 'ask_question',
          message: 'Question acknowledged',
          data: { question: data.question },
        };
      
      default:
        console.error('[MO Action Router] Unknown action type:', intentType);
        return {
          success: false,
          action: intentType,
          message: `Unknown action type: ${intentType}`,
          error: 'Unsupported intent',
        };
    }
  } catch (error: any) {
    console.error('❌ [MO Action Router] Error executing action:', error);
    return {
      success: false,
      action: intentType,
      message: `Failed to execute action: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Handle record_sale intent with enhanced error handling
 */
async function handleRecordSale(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  console.log('💰 [MO Action Router] Handling record sale with data:', data);
  
  const items = [...(data.items || [])];
  
  // Support legacy single-item format
  if (!items.length && data.productName) {
    items.push({
      productName: data.productName,
      quantity: parseInt(data.quantity) || 1,
      price: parseFloat(data.price) || parseFloat(data.amount) || 0,
      costPrice: parseFloat(data.costPrice) || 0,
    });
  }

  if (items.length === 0) {
    console.warn('⚠️ [MO Action Router] No sale items provided:', data);
    return {
      success: false,
      action: 'record_sale',
      message: 'No sale items provided. Please specify at least one product in the format: "Record sale: 5 items at ₦200 each".',
    };
  }

  // Resolve and validate all items
  const saleItems: any[] = [];
  const productSummaries: any[] = [];

  for (const item of items) {
    let product: any;
    let quantity = parseInt(item.quantity) || 1;
    let costPrice: number;
    let sellingPrice: number;

    // If item already has a productId (pre-resolved from pre-fetch), use directly
    if (item.productId) {
      product = { id: item.productId, name: item.productName, stock: item.stock };
      costPrice = parseFloat(item.costPrice) || 0;
      sellingPrice = parseFloat(item.price) || 0;
    } else {
      console.log('🔍 [MO Action Router] Looking for product:', item.productName);
      const productSearch = await findProductByName(context.businessId, item.productName);
      
      if (!productSearch.found || !productSearch.product) {
        console.warn('⚠️ [MO Action Router] Product not found:', item.productName);
        if (productSearch.matches && productSearch.matches.length > 0) {
          return {
            success: false,
            action: 'record_sale',
            message: `I found multiple products matching "${item.productName}":\n\n${productSearch.matches.map((p: any, i: number) => `${i + 1}. ${p.name} (Stock: ${p.stock || p.quantity || 0})`).join('\n')}\n\nPlease specify which one you want to sell.`,
            requiresClarification: true,
            clarification: {
              message: 'Multiple products found',
              options: productSearch.matches.map((p: any) => ({
                id: p.id,
                name: p.name,
                stock: p.stock || p.quantity || 0,
              })),
            },
          };
        }
        return {
          success: false,
          action: 'record_sale',
          message: `Product "${item.productName}" not found in your inventory. Please add this product first or check the spelling. You can verify product names on the ${PAGE_NAMES.products} page.`,
        };
      }

      product = productSearch.product;
      costPrice = product.cost || product.costPrice || 0;
      sellingPrice = product.price || parseFloat(item.price) || costPrice;
    }

    // Guard against NaN from undefined/invalid prices
    if (!sellingPrice || isNaN(sellingPrice)) {
      return {
        success: false,
        action: 'record_sale',
        message: `Could not determine the selling price for "${product.name}". Please specify the price, e.g., "Sold ${quantity} ${product.name} at ₦500 each".`,
      };
    }

    const currentStock = product.stock || product.quantity || 0;
    if (currentStock < quantity) {
      console.warn('⚠️ [MO Action Router] Insufficient stock for:', product.name);
      return {
        success: false,
        action: 'record_sale',
        message: `Insufficient stock for "${product.name}". Only ${currentStock} units available, but you requested ${quantity}.`,
      };
    }

    saleItems.push({
      productId: product.id,
      name: product.name,
      quantity,
      price: sellingPrice,
      costPrice,
      emoji: product.attributes?.emoji || '📦',
    });

    productSummaries.push({
      name: product.name,
      quantity,
      sellingPrice,
      costPrice,
    });
  }

  try {
    // Execute sale using existing service
    const result = await recordSale({
      businessId: context.businessId,
      userId: context.userId,
      items: saleItems,
      paymentType: data.paymentType || 'cash',
      source: 'mo_ai',
      recordedBy: {
        uid: context.userId,
        email: context.userEmail || 'mo@busmo.ai',
        displayName: context.userName || 'MO AI',
        role: context.userRole || 'AI Assistant',
        staffId: context.staffId || null,
      },
    });

    console.log('✅ [MO Action Router] Sale result:', result);
    
    if (!result.success) {
      console.error('❌ [MO Action Router] Failed to record sale:', result.error);
      return {
        success: false,
        action: 'record_sale',
        message: result.message,
        error: result.error,
      };
    }

    const totalProfit = result.data?.totalProfit || 0;
    const totalRevenue = result.data?.totalRevenue || 0;

    // Trigger data refresh event for sales
    triggerActionRefresh('sale_recorded', { 
      businessId: context.businessId,
      userId: context.userId,
      saleId: result.saleId,
      totalRevenue,
      items: productSummaries
    });

    return {
      success: true,
      action: 'record_sale',
      message: 'Sale recorded successfully',
      data: {
        saleId: result.saleId,
        profit: totalProfit,
        totalRevenue,
        totalCost: result.data?.totalCost,
        items: productSummaries.map((product, idx) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.sellingPrice,
          costPrice: product.costPrice,
          remainingStock: result.data?.remainingStock[saleItems[idx].productId],
        })),
      },
    };
  } catch (error: any) {
    console.error('❌ [MO Action Router] Error in handleRecordSale:', error);
    return {
      success: false,
      action: 'record_sale',
      message: `Failed to record sale: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Handle add_product intent with enhanced error handling
 */
async function handleAddProduct(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  console.log('📦 [MO Action Router] Handling add product with data:', data);
  
  // Validate required fields with better error messages
  if (!data.name || !data.name.trim()) {
    console.warn('⚠️ [MO Action Router] Missing product name:', data);
    return {
      success: false,
      action: 'add_product',
      message: 'Please specify a product name. Use format: "Add product: Bread ₦300 cost ₦200".',
    };
  }

  if (!data.price || data.price <= 0) {
    console.warn('⚠️ [MO Action Router] Missing or invalid price:', data.price);
    return {
      success: false,
      action: 'add_product',
      message: 'Please specify a selling price for the product. Use format: "Add product: Bread ₦300 cost ₦200".',
    };
  }

  if (!data.costPrice || data.costPrice <= 0) {
    console.warn('⚠️ [MO Action Router] Missing or invalid cost price:', data.costPrice);
    return {
      success: false,
      action: 'add_product',
      message: 'Please specify the cost price for the product. Use format: "Add product: Bread ₦300 cost ₦200".',
    };
  }

  try {
    const result = await addProduct({
      businessId: context.businessId,
      userId: context.userId,
      name: data.name,
      category: data.category || 'General',
      sellPrice: parseFloat(data.price) || parseFloat(data.sellPrice) || 0,
      costPrice: parseFloat(data.costPrice) || 0,
      openingStock: parseInt(data.stock) || 0,
      description: data.description || '',
      sku: data.sku,
      lowStockAlert: parseInt(data.lowStockThreshold) || parseInt(data.lowStockAlert) || 5,
      unit: data.unit || 'piece',
      hasExpiry: data.hasExpiry || false,
      expiryDate: data.expiryDate,
      hasVariants: data.hasVariants || false,
      variantType: data.variantType,
      variantValues: data.variantValues,
      useDefaultDelivery: data.useDefaultDelivery !== false,
      selectedCountries: data.selectedCountries,
      deliveryTime: data.deliveryTime,
      shippingFeeOverride: data.shippingFeeOverride,
      manualSale: data.manualSale !== false,
      onlineStore: data.onlineStore || false,
      imageUrl: data.imageUrl || '',
      imageData: data.imageData,
      productType: data.productType || 'product',
      dishCategory: data.dishCategory,
      preparationTime: data.preparationTime,
      ingredientUnit: data.ingredientUnit,
      supplier: data.supplier,
      reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : undefined,
      expiryDateIngredient: data.expiryDateIngredient,
      branch: data.branch,
      ingredients: data.ingredients,
      warehouseLocation: data.warehouseLocation || 'main_store',
      stockByLocation: data.stockByLocation,
      businessCategory: data.businessCategory || 'retail',
    });

    console.log('✅ [MO Action Router] Product result:', result);
    
    if (!result.success) {
      console.error('❌ [MO Action Router] Failed to add product:', result.error);
      return {
        success: false,
        action: 'add_product',
        message: result.message,
        error: result.error,
      };
    }

    // Trigger data refresh event for products
    triggerActionRefresh('product_added', { 
      businessId: context.businessId,
      userId: context.userId,
      productId: result.productId,
      productName: data.name
    });

    return {
      success: true,
      action: 'add_product',
      message: result.message,
      data: {
        productId: result.productId,
        product: result.product,
      },
    };
  } catch (error: any) {
    console.error('❌ [MO Action Router] Error in handleAddProduct:', error);
    return {
      success: false,
      action: 'add_product',
      message: `Failed to add product: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Handle add_expense intent with enhanced error handling
 */
async function handleAddExpense(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  console.log('💼 [MO Action Router] Handling add expense with data:', data);
  
  // Validate required fields with better error messages
  if (!data.amount || data.amount <= 0) {
    console.warn('⚠️ [MO Action Router] Invalid amount for expense:', data.amount);
    return {
      success: false,
      action: 'add_expense',
      message: 'Please specify a valid expense amount. Use format: "Add expense: Rent ₦5000".',
    };
  }

  if (!data.category) {
    console.warn('⚠️ [MO Action Router] Missing category for expense:', data);
    return {
      success: false,
      action: 'add_expense',
      message: 'Please specify an expense category. Common categories include: Rent, Utilities, Payroll, Transportation, Supplies, Marketing, Maintenance.',
    };
  }

  try {
    const result = await addExpense({
      businessId: context.businessId,
      userId: context.userId,
      category: data.category,
      amount: parseFloat(data.amount),
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'Cash',
      description: data.description || '',
      linkedProduct: data.linkedProduct,
      quantityReceived: data.quantityReceived ? parseInt(data.quantityReceived) : undefined,
      isRecurring: data.isRecurring || false,
      recurFrequency: data.recurFrequency,
      recurNextDate: data.recurNextDate,
      receiptUrl: data.receiptUrl,
      receiptData: data.receiptData,
    });

    console.log('✅ [MO Action Router] Expense result:', result);
    
    if (!result.success) {
      console.error('❌ [MO Action Router] Failed to add expense:', result.error);
      return {
        success: false,
        action: 'add_expense',
        message: result.message,
        error: result.error,
      };
    }

    // Trigger data refresh event for expenses
    triggerActionRefresh('expense_added', { 
      businessId: context.businessId,
      userId: context.userId,
      expenseId: result.expenseId,
      amount: data.amount,
      category: data.category
    });

    return {
      success: true,
      action: 'add_expense',
      message: result.message,
      data: {
        expenseId: result.expenseId,
        expense: result.expense,
      },
    };
  } catch (error: any) {
    console.error('❌ [MO Action Router] Error in handleAddExpense:', error);
    return {
      success: false,
      action: 'add_expense',
      message: `Failed to add expense: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Handle update_product intent
 */
async function handleUpdateProduct(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  // Find product by name first to get productId
  const productSearch = await findProductByName(context.businessId, data.name);
  
  if (!productSearch.found) {
    if (productSearch.matches && productSearch.matches.length > 0) {
      return {
        success: false,
        action: 'update_product',
        message: `I found multiple products matching "${data.name}":\n\n${productSearch.matches.map((p: any, i: number) => `${i + 1}. ${p.name}`).join('\n')}\n\nPlease specify which one you want to update.`,
        requiresClarification: true,
        clarification: {
          message: 'Multiple products found',
          options: productSearch.matches.map((p: any) => ({
            id: p.id,
            name: p.name,
          })),
        },
      };
    }
    return {
      success: false,
      action: 'update_product',
      message: `Product "${data.name}" not found in your inventory.`,
    };
  }

  const result = await updateProduct({
    businessId: context.businessId,
    userId: context.userId,
    productId: productSearch.product.id,
    productName: data.name,
    price: data.price,
    costPrice: data.costPrice,
    stock: data.stock,
    category: data.category,
    description: data.description,
    sku: data.sku,
    unit: data.unit,
    lowStockThreshold: data.lowStockThreshold,
  });

  if (!result.success) {
    return {
      success: false,
      action: 'update_product',
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'update_product',
    message: result.message,
    data: {
      productId: result.productId,
    },
  };
}

/**
 * Handle delete_product intent
 */
async function handleDeleteProduct(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  // Find product by name first to get productId
  const productSearch = await findProductByName(context.businessId, data.productName);
  
  if (!productSearch.found) {
    if (productSearch.matches && productSearch.matches.length > 0) {
      return {
        success: false,
        action: 'delete_product',
        message: `I found multiple products matching "${data.productName}":\n\n${productSearch.matches.map((p: any, i: number) => `${i + 1}. ${p.name}`).join('\n')}\n\nPlease specify which one you want to delete.`,
        requiresClarification: true,
        clarification: {
          message: 'Multiple products found',
          options: productSearch.matches.map((p: any) => ({
            id: p.id,
            name: p.name,
          })),
        },
      };
    }
    return {
      success: false,
      action: 'delete_product',
      message: `Product "${data.productName}" not found in your inventory.`,
    };
  }

  const result = await deleteProduct({
    businessId: context.businessId,
    userId: context.userId,
    productId: productSearch.product.id,
    productName: data.productName,
  });

  if (!result.success) {
    return {
      success: false,
      action: 'delete_product',
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'delete_product',
    message: result.message,
    data: {
      productId: result.productId,
    },
  };
}

/**
 * Handle add_customer intent
 */
async function handleAddCustomer(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  if (!data.name) {
    return {
      success: false,
      action: 'add_customer',
      message: 'Customer name is required. Please provide the customer name.',
    };
  }

  const result = await addCustomer({
    businessId: context.businessId,
    userId: context.userId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
  });

  if (!result.success) {
    return {
      success: false,
      action: 'add_customer',
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'add_customer',
    message: result.message,
    data: {
      customerId: result.customerId,
    },
  };
}

/**
 * Handle add_supplier intent
 */
async function handleAddSupplier(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  if (!data.name) {
    return {
      success: false,
      action: 'add_supplier',
      message: 'Supplier name is required. Please provide the supplier name.',
    };
  }

  const result = await addSupplier({
    businessId: context.businessId,
    userId: context.userId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
  });

  if (!result.success) {
    return {
      success: false,
      action: 'add_supplier',
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'add_supplier',
    message: result.message,
    data: {
      supplierId: result.supplierId,
    },
  };
}

/**
 * Handle record_payment intent
 */
async function handleRecordPayment(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  if (!data.amount || data.amount <= 0) {
    return {
      success: false,
      action: 'record_payment',
      message: 'Payment amount is required. Please provide the amount.',
    };
  }

  const result = await recordPayment({
    businessId: context.businessId,
    userId: context.userId,
    amount: data.amount,
    method: data.method || 'cash',
    customer: data.customer,
    reference: data.reference,
    description: data.description,
  });

  if (!result.success) {
    return {
      success: false,
      action: 'record_payment',
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'record_payment',
    message: result.message,
    data: {
      paymentId: result.paymentId,
    },
  };
}

/**
 * Handle record_purchase intent
 */
async function handleRecordPurchase(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  const items = data.items || [];
  
  if (items.length === 0) {
    return {
      success: false,
      action: 'record_purchase',
      message: 'No purchase items provided. Please specify at least one item.',
    };
  }

  const result = await recordPurchase({
    businessId: context.businessId,
    userId: context.userId,
    items,
    supplier: data.supplier,
    totalAmount: data.totalAmount,
    paymentMethod: data.paymentMethod,
  });

  if (!result.success) {
    return {
      success: false,
      action: 'record_purchase',
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'record_purchase',
    message: result.message,
    data: {
      purchaseId: result.purchaseId,
    },
  };
}

/**
 * Handle adjust_inventory intent
 */
async function handleAdjustInventory(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  if (!data.productName) {
    return {
      success: false,
      action: 'adjust_inventory',
      message: 'Product name is required. Please specify which product to adjust.',
    };
  }

  if (!data.adjustment || data.adjustment === 0) {
    return {
      success: false,
      action: 'adjust_inventory',
      message: 'Adjustment amount is required. Please specify how much to add or remove.',
    };
  }

  const result = await adjustInventory({
    businessId: context.businessId,
    userId: context.userId,
    productName: data.productName,
    adjustment: data.adjustment,
    reason: data.reason,
  });

  if (!result.success) {
    return {
      success: false,
      action: 'adjust_inventory',
      message: result.message,
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'adjust_inventory',
    message: result.message,
    data: {
      newStock: result.newStock,
    },
  };
}

/**
 * Handle generate_report intent
 */
async function handleGenerateReport(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  const reportType = data.reportType || 'sales';
  const period = data.period || 'month';

  let result;
  if (reportType === 'profit_loss') {
    result = await generateProfitLossSummary({
      businessId: context.businessId,
      period,
    });
  } else if (reportType === 'product_performance') {
    result = await getProductPerformance({
      businessId: context.businessId,
      period,
    });
  } else {
    result = await generateSalesReport({
      businessId: context.businessId,
      period,
    });
  }

  if (!result.success) {
    return {
      success: false,
      action: 'generate_report',
      message: result.error || 'Failed to generate report',
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'generate_report',
    message: `Generated ${reportType} report for ${period}`,
    data: result.data,
  };
}

/**
 * Handle get_low_stock intent
 */
async function handleGetLowStock(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  const result = await getLowStockAlerts(context.businessId);

  if (!result.success) {
    return {
      success: false,
      action: 'get_low_stock',
      message: result.error || 'Failed to get low stock alerts',
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'get_low_stock',
    message: `Found ${result.data?.length || 0} products with low stock`,
    data: result.data,
  };
}

/**
 * Handle get_expiry_info intent
 */
async function handleGetExpiryInfo(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  const daysThreshold = data.daysThreshold || 30;
  const result = await getExpiringProducts(context.businessId, daysThreshold);

  if (!result.success) {
    return {
      success: false,
      action: 'get_expiry_info',
      message: result.error || 'Failed to get expiry information',
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'get_expiry_info',
    message: `Found ${result.data?.length || 0} products expiring within ${daysThreshold} days`,
    data: result.data,
  };
}

/**
 * Handle get_financial_insights intent
 */
async function handleGetFinancialInsights(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  const insightType = data.insightType || 'cash_flow';
  const period = data.period || 'month';

  let result;
  if (insightType === 'cash_flow') {
    result = await getCashFlowAnalysis(context.businessId, period);
  } else if (insightType === 'revenue_vs_expenses') {
    result = await getRevenueVsExpenses(context.businessId, period);
  } else if (insightType === 'outstanding_payments') {
    result = await getOutstandingPayments(context.businessId);
  } else {
    result = await getCashFlowAnalysis(context.businessId, period);
  }

  if (!result.success) {
    return {
      success: false,
      action: 'get_financial_insights',
      message: result.error || 'Failed to get financial insights',
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'get_financial_insights',
    message: `Generated ${insightType} insights for ${period}`,
    data: result.data,
  };
}

/**
 * Handle get_customer_insights intent
 */
async function handleGetCustomerInsights(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  const insightType = data.insightType || 'all_customers';
  const period = data.period || 'month';

  let result;
  if (insightType === 'segmentation') {
    result = await segmentCustomers(context.businessId);
  } else if (insightType === 'reward_eligible') {
    result = await identifyRewardEligibleCustomers(context.businessId);
  } else if (insightType === 'top_customers') {
    result = await getCustomerInsights(context.businessId, period);
  } else {
    result = await getCustomerInsights(context.businessId, period);
  }

  if (!result.success) {
    return {
      success: false,
      action: 'get_customer_insights',
      message: result.error || 'Failed to get customer insights',
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'get_customer_insights',
    message: `Generated ${insightType} insights for ${period}`,
    data: result.data,
  };
}

/**
 * Handle get_price_optimization intent
 */
async function handleGetPriceOptimization(
  data: Record<string, any>,
  context: ActionContext
): Promise<ActionResult> {
  const result = await getPriceOptimizations(context.businessId);

  if (!result.success) {
    return {
      success: false,
      action: 'get_price_optimization',
      message: result.error || 'Failed to get price optimization suggestions',
      error: result.error,
    };
  }

  return {
    success: true,
    action: 'get_price_optimization',
    message: `Found ${result.data?.length || 0} products with price optimization opportunities`,
    data: result.data,
  };
}

/**
 * Validate action against user permissions
 */
export function validatePermission(
  action: string,
  userRole?: string,
  userPlan?: string
): { allowed: boolean; reason?: string } {
  const role = userRole?.toLowerCase();

  // Admin and owner can do everything
  if (role === 'owner' || role === 'admin') {
    return { allowed: true };
  }

  // Staff permissions
  if (role === 'staff') {
    // Staff can record sales
    if (action === 'record_sale') {
      return { allowed: true };
    }
    
    // Staff cannot add products or expenses by default
    return {
      allowed: false,
      reason: 'You do not have permission to perform this action. Please contact your administrator.',
    };
  }

  return {
    allowed: false,
    reason: 'Unauthorized',
  };
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
