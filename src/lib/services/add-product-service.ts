/**
 * Shared Add Product Service
 * This service provides a single source of truth for adding products
 * Used by both the Add Product page and MO AI
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface AddProductParams {
  businessId: string;
  userId: string;
  name: string;
  category: string;
  sellPrice: number;
  costPrice: number;
  openingStock: number;
  description?: string;
  sku?: string;
  lowStockAlert?: number;
  unit?: string;
  hasExpiry?: boolean;
  expiryDate?: string;
  hasVariants?: boolean;
  variantType?: string;
  variantValues?: string;
  useDefaultDelivery?: boolean;
  selectedCountries?: string[];
  deliveryTime?: string;
  shippingFeeOverride?: string;
  manualSale?: boolean;
  onlineStore?: boolean;
  imageUrl?: string;
  imageData?: string;
  productType?: 'product' | 'dish' | 'ingredient';
  dishCategory?: string;
  preparationTime?: string;
  ingredientUnit?: string;
  supplier?: string;
  reorderLevel?: number;
  expiryDateIngredient?: string;
  branch?: string;
  ingredients?: Array<{ ingredientId: string; name: string; quantity: string; unit: string }>;
  warehouseLocation?: string;
  stockByLocation?: {
    main_store: number;
    back_store: number;
    warehouse: number;
    [key: string]: number;
  };
  businessCategory?: string;
}

export interface AddProductResult {
  success: boolean;
  productId?: string;
  message: string;
  product?: any;
  error?: string;
}

/**
 * Add a product using the same logic as the Add Product page
 * This ensures consistency across all product creation methods
 */
export async function addProduct(params: AddProductParams): Promise<AddProductResult> {
  const db = getAdminDb();
  const {
    businessId,
    userId,
    name,
    category,
    sellPrice,
    costPrice,
    openingStock,
    description = '',
    sku,
    lowStockAlert = 5,
    unit = 'piece',
    hasExpiry = false,
    expiryDate,
    hasVariants = false,
    variantType = 'Size',
    variantValues = '',
    useDefaultDelivery = true,
    selectedCountries = ['NG', 'GH', 'KE'],
    deliveryTime = 'Same as store default (3–5 days)',
    shippingFeeOverride = '',
    manualSale = true,
    onlineStore = true,
    imageUrl = '',
    imageData,
    productType = 'product',
    dishCategory,
    preparationTime,
    ingredientUnit,
    supplier,
    reorderLevel = 0,
    expiryDateIngredient,
    branch,
    ingredients = [],
    warehouseLocation = 'main_store',
    stockByLocation,
    businessCategory = 'retail',
  } = params;

  try {
    // Validate inputs
    if (!businessId || !userId) {
      return {
        success: false,
        message: 'Invalid parameters',
        error: 'Missing required fields: businessId or userId'
      };
    }

    if (!name || !name.trim()) {
      return {
        success: false,
        message: 'Product name is required',
        error: 'Product name is empty'
      };
    }

    // Only require selling price for non-ingredient products
    if (productType !== 'ingredient' && (!sellPrice || sellPrice <= 0)) {
      return {
        success: false,
        message: 'Selling price is required and must be greater than 0',
        error: 'Invalid selling price'
      };
    }

    // Cost price is required for all products including ingredients
    if (!costPrice || costPrice <= 0) {
      return {
        success: false,
        message: 'Cost price is required and must be greater than 0',
        error: 'Invalid cost price'
      };
    }

    // Check if product with same name already exists
    const existingProductQuery = await db.collection('businesses').doc(businessId).collection('products')
      .where('name', '==', name.trim())
      .where('active', '==', true)
      .limit(1)
      .get();

    if (!existingProductQuery.empty) {
      return {
        success: false,
        message: `A product named "${name}" already exists in your inventory. Please use a different name or update the existing product.`,
        error: 'Duplicate product name'
      };
    }

    // Handle image upload if provided
    let finalImageUrl = imageUrl;
    if (imageData && !imageUrl) {
      try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const storage = getStorage();
        const imageRef = ref(storage, `products/${businessId}/${Date.now()}_product.jpg`);
        
        await uploadBytes(imageRef, buffer);
        finalImageUrl = await getDownloadURL(imageRef);
        console.log('✅ Product image uploaded successfully');
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        // Continue without image rather than failing
      }
    }

    // Generate SKU if not provided
    const finalSku = sku && sku.trim() ? sku.trim() : `SKU-${Date.now()}`;

    // Build product data matching Add Product page structure
    const productData: any = {
      name: name.trim(),
      description: description,
      category: productType === 'dish' ? dishCategory : category,
      price: productType === 'ingredient' ? 0 : sellPrice,
      cost: costPrice,
      stock: openingStock,
      lowStockThreshold: lowStockAlert,
      active: true,
      attributes: {
        emoji: productType === 'dish' ? '🍽️' : productType === 'ingredient' ? '🥘' : '📦',
        sku: finalSku,
      },
      imageUrl: finalImageUrl,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // Add stockByLocation for warehouse assignment
    if (businessCategory === 'wholesale' || businessCategory === 'distributor') {
      if (stockByLocation) {
        productData.stockByLocation = stockByLocation;
      } else {
        const stockByLocation: any = {
          main_store: warehouseLocation === 'main_store' ? openingStock : 0,
          back_store: warehouseLocation === 'back_store' ? openingStock : 0,
          warehouse: warehouseLocation === 'warehouse' ? openingStock : 0,
        };
        
        // Add custom warehouse location if it's not one of the defaults
        if (!['main_store', 'back_store', 'warehouse'].includes(warehouseLocation)) {
          stockByLocation[warehouseLocation] = openingStock;
        }
        
        productData.stockByLocation = stockByLocation;
      }
    }

    // Add restaurant-specific fields
    if (productType === 'dish' || productType === 'ingredient') {
      productData.productType = productType;
      
      if (productType === 'dish') {
        productData.dishCategory = dishCategory;
        productData.preparationTime = preparationTime;
        productData.ingredients = ingredients || [];
      }
      
      if (productType === 'ingredient') {
        productData.ingredientUnit = ingredientUnit;
        productData.supplier = supplier;
        productData.reorderLevel = reorderLevel || 0;
        if (expiryDateIngredient) {
          productData.expiryDate = expiryDateIngredient;
        }
        productData.branch = branch;
      }
    }

    // Add variant information if provided
    if (hasVariants && variantValues) {
      const variantValuesArray = variantValues.split(',').map(v => v.trim()).filter(Boolean);
      if (variantValuesArray.length > 0) {
        productData.variants = variantValuesArray.map((value, index) => ({
          id: `variant-${Date.now()}-${index}`,
          name: value,
          quantity: 0,
          price: sellPrice,
          costPrice: costPrice,
        }));
        productData.hasVariants = true;
      }
    }

    // Save product to Firestore
    const docRef = await db.collection('businesses').doc(businessId).collection('products').add(productData);

    return {
      success: true,
      productId: docRef.id,
      message: `Product "${name}" added successfully${finalSku ? ` with SKU: ${finalSku}` : ''}${finalImageUrl ? ' and image' : ''}`,
      product: {
        id: docRef.id,
        name: name.trim(),
        sku: finalSku,
        category: productType === 'dish' ? dishCategory : category,
        price: productType === 'ingredient' ? 0 : sellPrice,
        cost: costPrice,
        stock: openingStock,
        imageUrl: finalImageUrl || null,
        productType: productType,
        description: description,
        unit: unit,
        lowStockThreshold: lowStockAlert,
        supplier: supplier,
        reorderLevel: reorderLevel,
      }
    };

  } catch (error: any) {
    console.error('Error adding product:', error);
    return {
      success: false,
      message: `Failed to add product: ${error.message}`,
      error: error.message
    };
  }
}