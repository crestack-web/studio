'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs } from '@/lib/supabase-client-data';
import { saveProductViaApi } from '@/lib/product-api';
import { getSupabase } from '@/lib/supabase';
import styles from './Addproductpage.module.css';
import { isRestaurantBusiness, ProductType, DishCategory, IngredientUnit, getDishCategories, getIngredientUnits } from './utils/restaurantHelpers';
import { subscribeToActionEvents } from '@/utils/dataRefresh';

// ═══════════════════════════════════════════
//  AddProductPage — full product registration
//  Handles pricing, variants, sales modes,
//  delivery countries, expiry tracking
// ═══════════════════════════════════════════

interface AddProductPageProps {
  onClose?: () => void;
  onProductAdded?: (product: any) => void;
}

const AFRICAN_COUNTRIES = [
  { code: 'NG', flag: '🇳🇬', name: 'Nigeria',      default: true  },
  { code: 'GH', flag: '🇬🇭', name: 'Ghana',         default: true  },
  { code: 'KE', flag: '🇰🇪', name: 'Kenya',          default: true  },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa',   default: false },
  { code: 'ET', flag: '🇪🇹', name: 'Ethiopia',        default: false },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire",  default: false },
  { code: 'SN', flag: '🇸🇳', name: 'Senegal',         default: false },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroon',        default: false },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzania',        default: false },
  { code: 'UG', flag: '🇺🇬', name: 'Uganda',          default: false },
  { code: 'RW', flag: '🇷🇼', name: 'Rwanda',          default: false },
  { code: 'NE', flag: '🇳🇪', name: 'Niger',           default: false },
  { code: 'ML', flag: '🇲🇱', name: 'Mali',            default: false },
  { code: 'BJ', flag: '🇧🇯', name: 'Benin',           default: false },
  { code: 'TG', flag: '🇹🇬', name: 'Togo',            default: false },
  { code: 'ZM', flag: '🇿🇲', name: 'Zambia',          default: false },
  { code: 'ZW', flag: '🇿🇼', name: 'Zimbabwe',        default: false },
  { code: 'MZ', flag: '🇲🇿', name: 'Mozambique',      default: false },
];

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  description: string;
  sellPrice: string;
  costPrice: string;
  openingStock: string;
  lowStockAlert: string;
  unit: string;
  hasExpiry: boolean;
  expiryDate: string;
  hasVariants: boolean;
  variantType: string;
  variantValues: string;
  useDefaultDelivery: boolean;
  selectedCountries: string[];
  deliveryTime: string;
  shippingFeeOverride: string;
  manualSale: boolean;
  onlineStore: boolean;
  imageUrl: string;
  // Supplier field for all business types
  supplier?: string;
  // Restaurant-specific fields
  productType: ProductType;
  dishCategory?: DishCategory;
  preparationTime?: string;
  ingredientUnit?: IngredientUnit;
  reorderLevel?: string;
  expiryDateIngredient?: string;
  branch?: string;
  ingredients?: Array<{ ingredientId: string; name: string; quantity: string; unit: string }>;
  // Warehouse assignment
  warehouseLocation?: string;
  stockByLocation?: {
    [key: string]: number;
  };
}

const today = new Date().toISOString().split('T')[0];

function expiryIsSoon(date: string): boolean {
  if (!date) return false;
  const exp = new Date(date);
  const soon = new Date();
  soon.setDate(soon.getDate() + 90);
  return exp <= soon;
}

export function AddProductPage({ onClose, onProductAdded }: AddProductPageProps) {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [formDirty, setFormDirty] = useState(false);
  const [stockLocations, setStockLocations] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [businessCategory, setBusinessCategory] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Fetch businessId and check if restaurant
  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const supabaseUser = getSupabase();
        
        const { data: { session } } = await supabaseUser.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        const firestoreUid = session.user.user_metadata?.firebase_uid || userId;
        // Prefer AppContext businessId when already resolved
        let bid: string | null = user?.businessId || null;

        if (!bid) {
          const { resolveOwnerScopeBusinessId } = await import(
            '@/lib/resolve-business-scope'
          );
          bid = await resolveOwnerScopeBusinessId(
            userId,
            session.user.user_metadata?.businessId ||
              session.user.user_metadata?.business_id ||
              null,
            { firebaseUid: firestoreUid !== userId ? firestoreUid : undefined }
          );
        }

        // Signup convention: business id may equal auth uid — that is valid for owners
        if (!bid) {
          const { data: userData } = await getSupabase()
            .from('users')
            .select('business_id, businessId')
            .eq('id', userId)
            .maybeSingle();
          bid =
            (userData as any)?.business_id ||
            (userData as any)?.businessId ||
            userId;
        }
        
        setBusinessId(bid);

        if (bid) {
          const { data: businessData } = await getSupabase()
            .from('businesses')
            .select('*')
            .eq('id', bid)
            .single();
          if (businessData) {
            const category = businessData.category || '';
            setBusinessCategory(category.toLowerCase());
          }

          const restaurantCheck = await isRestaurantBusiness(bid);
          setIsRestaurant(restaurantCheck);

          if (restaurantCheck) {
            const productsData = await fetchDocs(`businesses/${bid}/products`);
            const ingredientsList: any[] = [];
            (productsData || []).forEach((item: any) => {
              if (item.productType === 'ingredient') {
                ingredientsList.push({
                  id: item.id,
                  name: item.name,
                  unit: item.ingredientUnit || item.unit,
                  currentQuantity: item.stock || 0,
                });
              }
            });
            setAvailableIngredients(ingredientsList);
          }

          try {
            const locationsData = await fetchDocs(`businesses/${bid}/stockLocations`);
            const loadedLocations: Array<{ id: string; name: string; type: string }> = [];
            (locationsData || []).forEach((item: any) => {
              loadedLocations.push({
                id: item.id,
                name: item.name,
                type: item.type,
              });
            });
            setStockLocations(loadedLocations);
          } catch (error) {
            console.error('Error loading stock locations:', error);
            setStockLocations([]);
          }

          try {
            const suppliersData = await fetchDocs(`businesses/${bid}/suppliers`);
            const loadedSuppliers: Array<{ id: string; name: string }> = [];
            (suppliersData || []).forEach((item: any) => {
              if (item.status === 'active') {
                loadedSuppliers.push({
                  id: item.id,
                  name: item.supplierName || item.businessName || 'Unknown Supplier',
                });
              }
            });
            setSuppliers(loadedSuppliers);
          } catch (error) {
            console.error('Error loading suppliers:', error);
            setSuppliers([]);
          }
        }
      } catch (error) {
        console.error('Error fetching business ID:', error);
      }
    }

    fetchBusinessId();
  }, []);

  // Add effect to listen for data refresh events
  useEffect(() => {
    if (!businessId) return;
    
    const handleDataRefresh = (event: CustomEvent) => {
      console.log('🔄 [AddProductPage] Received data refresh event:', event.detail);
      if (event.detail.actionType === 'product_added' || 
          event.detail.actionType === 'product_updated' || 
          event.detail.actionType === 'general_update') {
        // Refresh ingredients list to get latest data
        refreshIngredients();
        setLastRefreshTime(new Date());
      }
    };

    // Subscribe to action events
    subscribeToActionEvents(handleDataRefresh);
    
    // Clean up subscription on unmount
    return () => {
      console.log('🧹 [AddProductPage] Unsubscribing from data refresh events');
    };
  }, [businessId, isRestaurant]);
  
  const refreshIngredients = async () => {
    if (!businessId || !isRestaurant) return;
    
    try {
      const productsData = await fetchDocs(`businesses/${businessId}/products`);
      const ingredientsList: any[] = [];
      
      (productsData || []).forEach((item: any) => {
        if (item.productType === 'ingredient') {
          ingredientsList.push({
            id: item.id,
            name: item.name,
            unit: item.ingredientUnit || item.unit,
            currentQuantity: item.stock || 0,
          });
        }
      });
      
      setAvailableIngredients(ingredientsList);
      console.log('✅ [AddProductPage] Ingredients refreshed successfully');
    } catch (error) {
      console.error('❌ [AddProductPage] Error refreshing ingredients:', error);
      showToast(t('toast.ingredientsRefreshFailed'));
    }
  };

  // Warn user when trying to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formDirty]);

  const [form, setForm] = useState<ProductForm>({
    name: '', sku: '', category: '', description: '',
    sellPrice: '', costPrice: '', openingStock: '', lowStockAlert: '5',
    unit: 'piece', hasExpiry: false, expiryDate: '', hasVariants: false,
    variantType: 'Size', variantValues: '',
    useDefaultDelivery: true,
    selectedCountries: AFRICAN_COUNTRIES.filter(c => c.default).map(c => c.code),
    deliveryTime: 'Same as store default (3–5 days)',
    shippingFeeOverride: '', manualSale: true, onlineStore: true,
    imageUrl: '',
    // Restaurant-specific fields
    productType: 'product',
    dishCategory: undefined,
    preparationTime: undefined,
    ingredientUnit: undefined,
    supplier: undefined,
    reorderLevel: undefined,
    expiryDateIngredient: undefined,
    branch: undefined,
    ingredients: [],
    // Warehouse assignment - no defaults
    warehouseLocation: '',
    stockByLocation: {},
  });

  const [variantChips, setVariantChips] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Coming Soon Modal
  const ComingSoonModal = () => (
    <div className={styles.modalOverlay} onClick={() => setShowComingSoon(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalIcon}>🚧</div>
        <h3>Coming Soon</h3>
        <p>Online storefronts are currently under development. You'll be able to:</p>
        <ul className={styles.modalList}>
          <li>✅ Get a professional online storefront</li>
          <li>✅ Accept payments with BusmoPay</li>
          <li>✅ Use custom domains (Standard+ plans)</li>
          <li>✅ Track sales analytics</li>
        </ul>
        <p>Stay tuned for updates!</p>
        <button className={styles.modalBtn} onClick={() => setShowComingSoon(false)}>Got it</button>
      </div>
    </div>
  );

  const set = useCallback((key: keyof ProductForm, val: ProductForm[keyof ProductForm]) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setFormDirty(true);
  }, []);

  const margin = (() => {
    const sell = parseFloat(form.sellPrice || '0');
    const cost = parseFloat(form.costPrice || '0');
    if (sell > 0 && cost > 0 && sell > cost) {
      const profit = sell - cost;
      const pct = ((profit / sell) * 100).toFixed(1);
      return { profit: profit.toLocaleString(), pct };
    }
    return null;
  })();

  function toggleCountry(code: string) {
    set('selectedCountries',
      form.selectedCountries.includes(code)
        ? form.selectedCountries.filter(c => c !== code)
        : [...form.selectedCountries, code]
    );
  }

  function generateChips() {
    setVariantChips(form.variantValues.split(',').map(v => v.trim()).filter(Boolean));
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormDirty(true);
    }
  };

  async function handleSave(draft = false) {
    if (!form.name.trim()) {
      showToast(t('toast.enterProductName'));
      return;
    }
    
    // Only require selling price for non-ingredient products
    if (form.productType !== 'ingredient' && (!form.sellPrice || parseFloat(form.sellPrice) <= 0)) {
      showToast(t('toast.enterSellingPrice'));
      return;
    }

    // Cost can be 0 (e.g. free samples) but must be a number
    if (form.costPrice === '' || isNaN(parseFloat(form.costPrice)) || parseFloat(form.costPrice) < 0) {
      showToast(t('toast.enterCostPrice') || 'Enter a valid cost price');
      return;
    }

    setIsLoading(true);
    try {
      // Resolve business id at save-time (AppContext may still be loading)
      let effectiveBusinessId = businessId || user?.businessId || null;
      if (!effectiveBusinessId) {
        const { data: { session } } = await getSupabase().auth.getSession();
        const uid = session?.user?.id || user?.id;
        if (uid) {
          const { resolveOwnerScopeBusinessId } = await import('@/lib/resolve-business-scope');
          effectiveBusinessId = await resolveOwnerScopeBusinessId(
            uid,
            session?.user?.user_metadata?.businessId || null
          );
        }
      }
      if (!effectiveBusinessId) {
        showToast(t('toast.businessIdNotFound') || 'Business not loaded — refresh and try again');
        return;
      }
      if (!businessId) setBusinessId(effectiveBusinessId);

      let imageUrl = form.imageUrl;
      
      // Upload image to Supabase Storage if a new image was selected (non-blocking on failure)
      if (imageFile) {
        try {
          const filePath = `products/${effectiveBusinessId}/${Date.now()}_${imageFile.name}`;
          const { error: uploadError } = await getSupabase()
            .storage
            .from('products')
            .upload(filePath, imageFile);
          
          if (uploadError) throw uploadError;
          
          const { data: urlData } = getSupabase()
            .storage
            .from('products')
            .getPublicUrl(filePath);
          
          imageUrl = urlData.publicUrl;
        } catch (uploadError) {
          console.error('Image upload failed (saving product without image):', uploadError);
          showToast(
            (t('toast.uploadImageFailed') || 'Image upload failed: ') +
              ((uploadError as any).message || '') +
              ' — saving product without image'
          );
          // Continue save without image
        }
      }

      const sku = form.sku.trim() || `SKU-${Date.now()}`;
      const productData: any = {
        name: form.name.trim(),
        description: form.description || '',
        category: form.productType === 'dish' ? form.dishCategory : form.category,
        price: form.productType === 'ingredient' ? 0 : parseFloat(form.sellPrice) || 0,
        cost: parseFloat(form.costPrice) || 0,
        stock: parseInt(form.openingStock) || 0,
        lowStockThreshold: parseInt(form.lowStockAlert) || 5,
        reorderLevel: parseInt(form.lowStockAlert) || 5,
        sku,
        active: !draft,
        status: draft ? 'draft' : 'active',
        attributes: {
          emoji: form.productType === 'dish' ? '🍽️' : form.productType === 'ingredient' ? '🥘' : '📦',
          sku,
        },
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add stockByLocation for warehouse assignment
      if (businessCategory === 'wholesale' || businessCategory === 'distributor') {
        const openingStock = parseInt(form.openingStock) || 0;
        const warehouseLocation = form.warehouseLocation;
        
        // Only assign stock if a warehouse location is selected
        if (warehouseLocation && openingStock > 0) {
          const stockByLocation: { [key: string]: number } = {};
          stockByLocation[warehouseLocation] = openingStock;
          productData.stockByLocation = stockByLocation;
        }
      }

      // Add restaurant-specific fields
      if (isRestaurant) {
        productData.productType = form.productType;
        
        if (form.productType === 'dish') {
          productData.dishCategory = form.dishCategory;
          productData.preparationTime = form.preparationTime;
          productData.ingredients = form.ingredients || [];
        }
        
        if (form.productType === 'ingredient') {
          productData.ingredientUnit = form.ingredientUnit;
          productData.supplier = form.supplier;
          productData.reorderLevel = parseInt(form.reorderLevel || '0') || 0;
          if (form.expiryDateIngredient) {
            productData.expiryDate = form.expiryDateIngredient;
          }
          productData.branch = form.branch;
        }
      }

      console.log('💾 Saving product to Supabase...');
      console.log('📦 Product data:', productData);
      console.log('📁 Collection path:', `businesses/${effectiveBusinessId}/products`);
      
      const productId = crypto.randomUUID();
      await saveProductViaApi(effectiveBusinessId, { ...productData, id: productId }, { mode: 'insert' });
      console.log('✅ Product saved successfully with ID:', productId);
      
      const newProduct = {
        id: productId,
        ...productData,
        sellingPrice: productData.price, // Map back for UI
        costPrice: productData.cost,
      };

      if (onProductAdded) {
        onProductAdded(newProduct);
      }

      showToast(draft ? `📝 "${form.name}" saved as draft` : `✅ "${form.name}" added to inventory`);
      
      // Mark form as not dirty since we saved successfully
      setFormDirty(false);
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('🔥 Failed to save product:', error);
      console.error('Error details:', {
        message: (error as any).message,
        code: (error as any).code,
        stack: (error as any).stack,
      });
      showToast(t('toast.productSaveFailed') + (error as any).message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleClose = () => {
    if (formDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        if (onClose) onClose();
      }
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Add Product</h1>
      <p className={styles.sub}>Add a product to your inventory. It will appear in your Record Sale flow and, once verified, on your online store.</p>

      {/* ── BASIC INFO ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Basic Information</div>
        <div className={styles.cardSub}>The core details of your product.</div>

        {/* Product Type Selector - Only for restaurants */}
        {isRestaurant && (
          <div className={styles.group} style={{ marginBottom: '20px' }}>
            <label className={styles.label}>Product Type <span className={styles.req}>*</span></label>
            <select 
              className={styles.select} 
              value={form.productType} 
              onChange={e => set('productType', e.target.value as ProductType)}
            >
              <option value="product">Product</option>
              <option value="dish">Dish / Menu Item</option>
              <option value="ingredient">Ingredient</option>
            </select>
          </div>
        )}

        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>
              {form.productType === 'dish' ? 'Dish Name' : form.productType === 'ingredient' ? 'Ingredient Name' : 'Product Name'} <span className={styles.req}>*</span>
            </label>
            <input 
              className={styles.input} 
              placeholder={
                form.productType === 'dish' ? 'e.g. Jollof Rice' : 
                form.productType === 'ingredient' ? 'e.g. Rice' : 
                'e.g. Premium Ribbed Polo Co-Ord'
              } 
              value={form.name} 
              onChange={e => set('name', e.target.value)} 
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>SKU / Product Code</label>
            <input className={styles.input} placeholder="e.g. PLO-001 (auto-generated if blank)" value={form.sku} onChange={e => set('sku', e.target.value)} />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>Category <span className={styles.req}>*</span></label>
            {form.productType === 'dish' ? (
              <select className={styles.select} value={form.dishCategory || ''} onChange={e => set('dishCategory', e.target.value as DishCategory)}>
                <option value="">Select dish category</option>
                {getDishCategories().map(c => <option key={c}>{c}</option>)}
              </select>
            ) : form.productType === 'ingredient' ? (
              <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select category</option>
                {['Food & Groceries','Beverages','Spices & Seasonings','Dairy','Meat & Poultry','Seafood','Grains','Vegetables','Fruits','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select category</option>
                {['Fashion & Clothing','Food & Groceries','Beauty & Personal Care','Electronics','Books & Education','Home & Kitchen','Health & Wellness','Sports & Fitness','Art & Crafts','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            )}
          </div>
          <div className={styles.group}>
            <label className={styles.label}>
              {form.productType === 'ingredient' ? 'Unit Type' : 'Unit of Measure'}
            </label>
            {form.productType === 'ingredient' ? (
              <select className={styles.select} value={form.ingredientUnit || ''} onChange={e => set('ingredientUnit', e.target.value as IngredientUnit)}>
                <option value="">Select unit type</option>
                {getIngredientUnits().map(u => <option key={u}>{u}</option>)}
              </select>
            ) : (
              <select className={styles.select} value={form.unit} onChange={e => set('unit', e.target.value)}>
                {['piece','pack','kg','litre','box','set','pair','bundle','bottle','sachet','roll','sheet','bag','carton'].map(u => <option key={u}>{u}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Dish-specific fields */}
        {form.productType === 'dish' && (
          <div className={styles.row2}>
            <div className={styles.group}>
              <label className={styles.label}>Preparation Time</label>
              <input 
                className={styles.input} 
                placeholder="e.g. 30 mins" 
                value={form.preparationTime || ''} 
                onChange={e => set('preparationTime', e.target.value)} 
              />
            </div>
          </div>
        )}

        {/* Supplier field - Show for all product types */}
        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>Supplier</label>
            <select 
              className={styles.select} 
              value={form.supplier || ''} 
              onChange={e => set('supplier', e.target.value)}
            >
              <option value="">Select supplier (optional)</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
            <span className={styles.hint}>Link this product to a supplier for easier purchase ordering</span>
          </div>
          {form.productType === 'ingredient' && (
            <div className={styles.group}>
              <label className={styles.label}>Reorder Level</label>
              <input 
                className={styles.input} 
                type="number" 
                placeholder="e.g. 10" 
                value={form.reorderLevel || ''} 
                onChange={e => set('reorderLevel', e.target.value)} 
              />
            </div>
          )}
        </div>

        {/* Ingredient-specific fields */}
        {form.productType === 'ingredient' && (
          <div className={styles.row2}>
            <div className={styles.group}>
              <label className={styles.label}>Expiry Date</label>
              <input 
                type="date" 
                className={styles.input} 
                value={form.expiryDateIngredient || ''} 
                onChange={e => set('expiryDateIngredient', e.target.value)} 
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Branch</label>
              <input 
                className={styles.input} 
                placeholder="e.g. Main Branch" 
                value={form.branch || ''} 
                onChange={e => set('branch', e.target.value)} 
              />
            </div>
          </div>
        )}

        <div className={styles.group} style={{ marginBottom: 0 }}>
          <label className={styles.label}>Product Description</label>
          <textarea className={styles.textarea} placeholder="Describe the product — material, size range, key features..." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Product Image</label>
          <div className={styles.imageUpload}>
            {imagePreview ? (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Product preview" className={styles.previewImg} />
                <button type="button" className={styles.removeImageBtn} onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                  set('imageUrl', '');
                }}>✕</button>
              </div>
            ) : (
              <label className={styles.imageUploadLabel}>
                <input type="file" accept="image/*" onChange={handleImageChange} className={styles.imageInput} />
                <div className={styles.imageUploadContent}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={32} height={32}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Click to upload product image</span>
                </div>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ── INGREDIENTS SECTION (for dishes) ── */}
      {form.productType === 'dish' && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Ingredients</div>
          <div className={styles.cardSub}>Select ingredients from your inventory that make up this dish.</div>

          {availableIngredients.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>
              <p>No ingredients available. Add ingredients first to create dishes.</p>
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              {availableIngredients.map(ingredient => (
                <div key={ingredient.id} style={{ marginBottom: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ingredient.name}</label>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={form.ingredients?.some(i => i.ingredientId === ingredient.id) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            set('ingredients', [...(form.ingredients || []), { ingredientId: ingredient.id, name: ingredient.name, quantity: '', unit: ingredient.unit }]);
                          } else {
                            set('ingredients', (form.ingredients || []).filter(i => i.ingredientId !== ingredient.id));
                          }
                        }}
                      />
                      <span className={styles.toggleTrack} />
                      <span className={styles.toggleThumb} />
                    </label>
                  </div>
                  {form.ingredients?.some(i => i.ingredientId === ingredient.id) && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        className={styles.input} 
                        style={{ flex: 1 }}
                        placeholder="Quantity" 
                        value={form.ingredients?.find(i => i.ingredientId === ingredient.id)?.quantity || ''}
                        onChange={(e) => {
                          const updated = form.ingredients?.map(i => 
                            i.ingredientId === ingredient.id ? { ...i, quantity: e.target.value } : i
                          ) || [];
                          set('ingredients', updated);
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{ingredient.unit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRICING ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          {form.productType === 'ingredient' ? 'Cost & Stock' : 'Pricing & Stock'}
        </div>
        <div className={styles.cardSub}>
          {form.productType === 'ingredient' 
            ? 'Cost price is used to calculate meal costs and track inventory value.'
            : 'Your selling price and cost price are used to calculate your profit margin on every sale.'}
        </div>

        <div className={styles.row3}>
          {form.productType !== 'ingredient' && (
            <div className={styles.group}>
              <label className={styles.label}>Selling Price ({currency.symbol}) <span className={styles.req}>*</span></label>
              <div className={styles.prefixWrap}>
                <span className={styles.prefix}>{currency.symbol}</span>
                <input id="sell-price" className={styles.input} style={{ paddingLeft: 28 }} type="number" placeholder="0.00" value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} />
              </div>
            </div>
          )}
          <div className={styles.group}>
            <label className={styles.label}>Cost Price ({currency.symbol}) <span className={styles.req}>*</span></label>
            <div className={styles.prefixWrap}>
              <span className={styles.prefix}>{currency.symbol}</span>
              <input className={styles.input} style={{ paddingLeft: 28 }} type="number" placeholder="0.00" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} />
            </div>
          </div>
          {form.productType !== 'ingredient' && (
            <div className={styles.group}>
              <label className={styles.label}>Compare-at Price</label>
              <div className={styles.prefixWrap}>
                <span className={styles.prefix}>{currency.symbol}</span>
                <input className={styles.input} style={{ paddingLeft: 28 }} type="number" placeholder="(strike-through price)" />
              </div>
            </div>
          )}
        </div>

        {margin && form.productType !== 'ingredient' && (
          <div className={styles.marginIndicator}>
            <span>📈</span>
            <span>Profit margin: <strong>{margin.pct}%</strong> &nbsp;|&nbsp; {currency.symbol}{margin.profit} per unit</span>
          </div>
        )}

        <div className={styles.row2} style={{ marginTop: 14 }}>
          <div className={styles.group}>
            <label className={styles.label}>Opening Stock <span className={styles.req}>*</span></label>
            <input className={styles.input} type="number" placeholder="Units currently in hand" value={form.openingStock} onChange={e => set('openingStock', e.target.value)} />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Low Stock Alert</label>
            <input className={styles.input} type="number" placeholder="e.g. 5" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} />
            <span className={styles.hint}>Busmo alerts you when stock drops to this level</span>
          </div>
        </div>

        {/* Warehouse Assignment - Show for wholesale/distributor businesses */}
        {(businessCategory === 'wholesale' || businessCategory === 'distributor') && (
          <div className={styles.group} style={{ marginTop: 14 }}>
            <label className={styles.label}>Warehouse Location</label>
            <select 
              className={styles.select} 
              value={form.warehouseLocation} 
              onChange={e => set('warehouseLocation', e.target.value)}
            >
              {stockLocations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <span className={styles.hint}>Assign stock to this warehouse location</span>
          </div>
        )}
      </div>

      {/* ── EXPIRY ── */}
      <div className={styles.card}>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.cardTitle} style={{ marginBottom: 2 }}>Expiry Tracking</div>
            <div className={styles.cardSub} style={{ marginBottom: 0 }}>For food, medicine, cosmetics, or any perishable goods</div>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={form.hasExpiry} onChange={e => set('hasExpiry', e.target.checked)} />
            <span className={styles.toggleTrack} />
            <span className={styles.toggleThumb} />
          </label>
        </div>

        {form.hasExpiry && (
          <div style={{ marginTop: 16 }}>
            <div className={styles.row2}>
              <div className={styles.group}>
                <label className={styles.label}>Expiry Date</label>
                <input type="date" className={styles.input} value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Manufacture Date</label>
                <input type="date" className={styles.input} />
              </div>
            </div>
            {expiryIsSoon(form.expiryDate) && (
              <div className={styles.expiryWarn}>⚠️ This product expires within 90 days. Consider discounting it soon.</div>
            )}
          </div>
        )}
      </div>

      {/* ── VARIANTS ── */}
      {!isRestaurant && (
        <div className={styles.card}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.cardTitle} style={{ marginBottom: 2 }}>Product Variants</div>
              <div className={styles.cardSub} style={{ marginBottom: 0 }}>Sizes, colours, flavours — if this product comes in options</div>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.hasVariants} onChange={e => set('hasVariants', e.target.checked)} />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleThumb} />
            </label>
          </div>

          {form.hasVariants && (
            <div style={{ marginTop: 16 }}>
              <div className={styles.row2}>
                <div className={styles.group}>
                  <label className={styles.label}>Variant Type</label>
                  <select className={styles.select} value={form.variantType} onChange={e => set('variantType', e.target.value)}>
                    {['Size','Colour','Flavour','Material','Weight','Volume','Style'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>Values (comma-separated)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className={styles.input} placeholder="e.g. S, M, L, XL" value={form.variantValues} onChange={e => set('variantValues', e.target.value)} />
                    <button type="button" className={styles.btnGhost} onClick={generateChips}>Generate</button>
                  </div>
                </div>
              </div>
              {variantChips.length > 0 && (
                <div className={styles.chipRow}>
                  {variantChips.map(v => <span key={v} className={styles.chip}>{v}</span>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SALES MODE ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>How will this product be sold?</div>
        <div className={styles.cardSub}>Select all that apply. You can change this later from your Products page.</div>

        <div className={`${styles.saleGate} ${styles.unlocked}`} style={{ marginBottom: 10 }}>
          <div className={styles.gateHeader}>
            <div className={styles.gateTitle}><span>📋</span> Manual Sales Recording <span className={`${styles.pill} ${styles.pillGreen}`}>Always Available</span></div>
            <label className={styles.toggle}><input type="checkbox" checked onChange={() => {}} /><span className={styles.toggleTrack} /><span className={styles.toggleThumb} /></label>
          </div>
          <div className={styles.gateSub}>Record sales by selecting this product from the "Record Sale" flow. Works offline for in-person sales.</div>
        </div>

        {!isRestaurant && (
          <div className={`${styles.saleGate} ${styles.unlocked}`} style={{ marginBottom: 10, opacity: 0.7 }}>
            <div className={styles.gateHeader}>
              <div className={styles.gateTitle}><span>🛍️</span> Online Store <span className={`${styles.pill} ${styles.pillAmber}`}>Coming Soon</span></div>
              <label className={styles.toggle}>
                <input 
                  type="checkbox" 
                  checked={false} 
                  onChange={e => {
                    e.preventDefault();
                    setShowComingSoon(true);
                  }} 
                />
                <span className={styles.toggleTrack} />
                <span className={styles.toggleThumb} />
              </label>
            </div>
            <div className={styles.gateSub}>Product will appear on your public storefront. Customers can browse and purchase online.</div>
          </div>
        )}
      </div>

      {/* ── DELIVERY ── */}
      {!isRestaurant && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Delivery Countries</div>
          <div className={styles.cardSub}>Choose which African countries you deliver to. Customers outside your selection see "Not available in your region" at checkout.</div>

          <div className={styles.toggleRow} style={{ marginBottom: 14 }}>
            <span className={styles.toggleRowLabel}>Use my default delivery settings</span>
            <label className={styles.toggle}>
              <input type="checkbox" checked={form.useDefaultDelivery} onChange={e => set('useDefaultDelivery', e.target.checked)} />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleThumb} />
            </label>
          </div>

          {!form.useDefaultDelivery && (
            <>
              <div className={styles.row2} style={{ marginTop: 16 }}>
                <div className={styles.group}>
                  <label className={styles.label}>Delivery Time</label>
                  <select className={styles.select} value={form.deliveryTime} onChange={e => set('deliveryTime', e.target.value)}>
                    {['Same as store default (3–5 days)','1–2 business days','3–5 business days','5–7 business days','7–14 business days'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>Shipping Fee Override</label>
                  <div className={styles.prefixWrap}>
                    <span className={styles.prefix}>{currency.symbol}</span>
                    <input type="number" className={styles.input} style={{ paddingLeft: 28 }} placeholder="Leave blank for store default" value={form.shippingFeeOverride} onChange={e => set('shippingFeeOverride', e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary} onClick={() => handleSave(false)} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
        <button type="button" className={styles.btnGhost} onClick={() => handleSave(true)} disabled={isLoading}>Save as Draft</button>
        {onClose && (
          <button type="button" className={styles.btnGhost} onClick={handleClose} disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>

      {showComingSoon && <ComingSoonModal />}
    </div>
  );
}

