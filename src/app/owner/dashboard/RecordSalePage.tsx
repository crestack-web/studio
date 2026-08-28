import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from './AppContext';
import { notifySale, notifyLowStock } from '@/lib/deviceNotifications';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Product, CartItem, PaymentMethod, PaymentBreakdown, CreditCustomer } from './types';
import { isIngredientProduct } from '@/lib/saleableProducts';
import { fetchDocs, addDoc as sbAddDoc, updateDoc as sbUpdateDoc, fetchDoc } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { offlineManager } from '@/lib/offline/offline-manager';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { BrevoService } from '@/services/email/brevo-service';
import { sendFirstSaleCelebrationEmail } from '@/services/email/business-activity-emails';
import { ReceiptGenerator } from './ReceiptGenerator';
import { subscribeToActionEvents } from '@/utils/dataRefresh';
import styles from './RecordSalePage.module.css';

// ═══════════════════════════════════════════
//  RecordSalePage
// ═══════════════════════════════════════════

export function RecordSalePage() {
  const { navigateTo, showToast } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currencyCode } = useCurrency();
  const { branches, isProUser } = useBranch();

  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [note, setNote] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add effect to listen for data refresh events triggered by MO
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      console.log('🔄 [RecordSalePage] Received data refresh event:', event.detail);
      if (event.detail.actionType === 'sale_recorded' || event.detail.actionType === 'general_update') {
        // Refresh product list after a short delay to allow backend to process the changes
        setTimeout(() => {
          refreshProducts();
        }, 1000); // 1 second delay to allow backend to process
      }
    };

    // Subscribe to action events
    subscribeToActionEvents(handleDataRefresh);
    
    // Clean up subscription on unmount
    return () => {
      console.log('🧹 [RecordSalePage] Unsubscribing from data refresh events');
    };
  }, [businessId]); // Add businessId as dependency if it's available

  // Credit tracking fields
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<string>('');
  const [creditCustomerName, setCreditCustomerName] = useState('');
  const [creditCustomerPhone, setCreditCustomerPhone] = useState('');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([]);
  const [showNewCreditCustomer, setShowNewCreditCustomer] = useState(false);

  // Custom item form
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [customCost, setCustomCost] = useState('');

  // Discount fields
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Customer linking
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  // Warehouse source selection
  const [sourceLocation, setSourceLocation] = useState('main_store');
  const [stockLocations, setStockLocations] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [businessCategory, setBusinessCategory] = useState<string>('');
  const [showStockSource, setShowStockSource] = useState(false);
  const [inventoryDeductionMode, setInventoryDeductionMode] = useState<'immediate' | 'warehouse'>('immediate');

  // Receipt printing
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [receiptTheme, setReceiptTheme] = useState<any>(null);
  const [businessLogo, setBusinessLogo] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [receiptType, setReceiptType] = useState<'supermarket' | 'invoice'>('supermarket');

  // Calculations (must be after all state declarations)
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = discountType === 'percentage' 
    ? (discountValue > 0 ? (subtotal * discountValue) / 100 : 0)
    : discountValue;
  const finalTotal = subtotal - discount;
  const profit = cart.reduce((s, i) => s + (i.price - i.costPrice) * i.qty, 0) - discount;

  // Fetch real products from Firestore
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        // First, get the user's business ID
        const user = getAuthCurrentUser();
        
        if (!user) {
          console.warn('User not authenticated');
          setLoading(false);
          return;
        }

        const { data: userDoc, error: userError } = await getSupabase().from('users').select('*').eq('id', user.uid).single();
        if (userError || !userDoc) {
          console.warn('User document not found');
          setLoading(false);
          return;
        }

        let bId = userDoc.businessId || userDoc.business_id || '';
        if (!bId || bId === user?.uid) {
          const { resolveOwnerScopeBusinessId } = await import('@/lib/resolve-business-scope');
          bId = (await resolveOwnerScopeBusinessId(user?.uid, bId || undefined)) || '';
        }
        if (!bId) {
          console.warn('Business ID not found for user');
          setLoading(false);
          return;
        }

        setBusinessId(bId);

        // Fetch business category and receipt theme
        try {
          const { data: businessDoc } = await getSupabase().from('businesses').select('*').eq('id', bId).single();
          if (businessDoc) {
            const category = businessDoc.category || '';
            setBusinessCategory(category.toLowerCase());
            
            // Load inventory deduction mode
            setInventoryDeductionMode(businessDoc.inventoryDeductionMode || businessDoc.inventory_deduction_mode || 'immediate');
            
            // Load receipt theme (column or metadata — settings save path)
            const meta = businessDoc.metadata || {};
            const theme =
              businessDoc.receiptTheme ||
              businessDoc.receipt_theme ||
              meta.receiptTheme ||
              meta.receipt_theme ||
              null;
            if (theme) setReceiptTheme(theme);
            
            // Load business logo
            if (businessDoc.logoUrl || businessDoc.logo_url) {
              setBusinessLogo(businessDoc.logoUrl || businessDoc.logo_url);
            }
            
            // Load receipt type setting
            if (businessDoc.receiptType || businessDoc.receipt_type) {
              setReceiptType(businessDoc.receiptType || businessDoc.receipt_type);
            }
          }
        } catch (error) {
          console.error('Error loading business category:', error);
        }

        // Load bank accounts to get default POS account
        try {
          const bankAccounts = await fetchDocs(`businesses/${bId}/bankAccounts`, { filters: [{ field: 'is_active', op: '=', value: true }] });
          let posDefaultAccount = null;
          for (const acct of bankAccounts) {
            if ((acct as any).isPosDefault || (acct as any).is_pos_default) {
              posDefaultAccount = (acct as any).id;
            }
          }
          setBankAccountId(posDefaultAccount);
        } catch (error) {
          console.error('Error loading bank accounts:', error);
        }

        // Fetch products from the business-specific collection
        // Pass bId directly to avoid timing issue with state update
        await refreshProducts(bId);
        
        // Load stock locations
        try {
          const locations = await fetchDocs(`businesses/${bId}/stockLocations`, { filters: [{ field: 'is_active', op: '=', value: true }] });
          const loadedLocations: Array<{ id: string; name: string; type: string }> = [];
          
          // Only use actual locations created by the owner - no defaults
          for (const loc of locations) {
            loadedLocations.push({
              id: (loc as any).id,
              name: (loc as any).name,
              type: (loc as any).type,
            });
          }
          
          setStockLocations(loadedLocations);
          
           // Show stock source selector only if there's an actual warehouse location created
           const hasWarehouse = loadedLocations.some(loc => loc.type === 'warehouse');
           setShowStockSource(hasWarehouse);
        } catch (error) {
          console.error('Error loading stock locations:', error);
          // Set empty locations on error
          setStockLocations([]);
          setShowStockSource(false);
        }

        // Load credit customers
        try {
          const creditCustomersData = await fetchDocs(`businesses/${bId}/credit_customers`, { orderBy: { field: 'created_at', ascending: false } });
          const loadedCreditCustomers: CreditCustomer[] = [];
          for (const data of creditCustomersData) {
            loadedCreditCustomers.push({
              id: (data as any).id,
              name: (data as any).name || '',
              phone: (data as any).phone || '',
              email: (data as any).email || '',
              address: (data as any).address || '',
              businessType: (data as any).businessType || (data as any).business_type || 'individual',
              notes: (data as any).notes || '',
              createdAt: (data as any).createdAt ? new Date((data as any).createdAt) : (data as any).created_at ? new Date((data as any).created_at) : new Date(),
              totalCreditLimit: (data as any).totalCreditLimit || (data as any).credit_limit,
              currentBalance: (data as any).currentBalance || (data as any).current_balance || 0,
              isRegularCustomer: (data as any).isRegularCustomer || (data as any).is_regular_customer || false,
            });
          }
          setCreditCustomers(loadedCreditCustomers);

          // Also merge general customers list (optional attach)
          try {
            const regularCustomers = await fetchDocs(`businesses/${bId}/customers`, {
              orderBy: { field: 'created_at', ascending: false },
            });
            const merged = [...loadedCreditCustomers];
            const seen = new Set(merged.map((c) => c.id));
            for (const data of regularCustomers || []) {
              const id = String((data as any).id || '');
              if (!id || seen.has(id)) continue;
              seen.add(id);
              merged.push({
                id,
                name: (data as any).name || 'Customer',
                phone: (data as any).phone || '',
                email: (data as any).email || '',
                address: (data as any).address || '',
                currentBalance: Number((data as any).balance || (data as any).currentBalance || 0),
                totalCreditLimit: Number((data as any).creditLimit || 0) || null,
                isRegularCustomer: true,
                createdAt: (data as any).created_at || new Date().toISOString(),
              } as CreditCustomer);
            }
            setCreditCustomers(merged);
          } catch (_) {
            /* optional collection */
          }

        } catch (error) {
          console.error('Error loading credit customers:', error);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [showToast, branches, isProUser]);

  // Helper function to refresh products from Firestore
  async function refreshProducts(bizId?: string) {
    const targetBusinessId = bizId || businessId;
    if (!targetBusinessId) {
      console.error('refreshProducts: Missing businessId', { businessId: targetBusinessId });
      return;
    }
    
    try {
      console.log('refreshProducts: Starting fetch for businessId:', targetBusinessId);
      
      // Re-fetch business category for filtering
      let currentCategory = '';
      try {
        const { data: businessDoc } = await getSupabase().from('businesses').select('*').eq('id', targetBusinessId).single();
        if (businessDoc) {
          currentCategory = (businessDoc.category || '').toLowerCase();
          console.log('refreshProducts: Business category:', currentCategory);
        } else {
          console.warn('refreshProducts: Business document not found');
        }
      } catch {
        console.warn('refreshProducts: Business document not found');
      }
      
      // Load all products; hide inactive/draft client-side (legacy rows may lack status)
      const fetchedProductsData = await fetchDocs(`businesses/${targetBusinessId}/products`);
      
      console.log('refreshProducts: Query returned', fetchedProductsData.length, 'products');
      
      const fetchedProducts: Product[] = [];
      
      for (const data of fetchedProductsData) {
        const status = String((data as any).status || '').toLowerCase();
        if (['inactive', 'archived', 'deleted', 'draft'].includes(status)) continue;
        if ((data as any).active === false) continue;
        // Never show ingredients on record sale (food businesses + explicit productType)
        if (isIngredientProduct(data as any)) {
          continue;
        }
        
        const productType =
          (data as any).productType ||
          (data as any).product_type ||
          (data as any).type ||
          (data as any).metadata?.productType ||
          'product';
        fetchedProducts.push({
          id: (data as any).id,
          name: (data as any).name || 'Unnamed Product',
          price: (data as any).price || 0,
          costPrice: (data as any).costPrice || (data as any).cost || 0,
          stock: (data as any).stock || (data as any).stock_level || (data as any).quantity || 0,
          stockByLocation: (data as any).stockByLocation || {
            main_store: (data as any).stock || (data as any).stock_level || 0,
            back_store: 0,
            warehouse: 0,
          },
          emoji: (data as any).emoji || '📦',
          lowStockThreshold: (data as any).lowStockThreshold || 10,
          imageUrl: (data as any).imageUrl || (data as any).image_url || '',
          type: productType,
        });
      }
      
      console.log('refreshProducts: Fetched', fetchedProducts.length, 'active products');
      setProducts(fetchedProducts);
        if (businessId || targetBusinessId) void offlineManager.cacheProducts((businessId || targetBusinessId) as string, fetchedProducts as any);
    } catch (error) {
      console.error('Error refreshing products:', error);
      showToast('Failed to load products');
    }
  }

  const filtered = useMemo(
    () => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  function addToCart(product: Product) {
    if (isIngredientProduct(product as any)) {
      showToast('Ingredients cannot be sold. Use dishes or menu items.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart(prev =>
      prev
        .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  }

  function removeItem(id: string) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function addCustom() {
    if (!customName || !customPrice) return showToast(t('product.name') + ' & ' + t('product.sellingPrice'));
    const item: CartItem = {
      id: String(Date.now()),
      name: customName,
      price: Number(customPrice),
      costPrice: Number(customCost) || 0,
      stock: 99,
      emoji: '📦',
      qty: Number(customQty) || 1,
    };
    setCart(prev => [...prev, item]);
    setCustomName(''); setCustomQty('1'); setCustomPrice(''); setCustomCost('');
    showToast(`${item.name} ${t('product.saved')}`);
  }

  function clearCart() {
    setCart([]);
    setNote('');
  }

  async function confirmSale() {
    if (!cart.length) return showToast(t('sale.selectProducts'));
    if (isProcessingSale) return; // Prevent duplicate submissions

    // Validate stock availability before processing sale
    if (!businessId) {
      return showToast('System not ready. Please refresh the page.');
    }

    const stockValidationErrors: string[] = [];
    
    // Check stock for each item in cart
    for (const item of cart) {
      const productData = await fetchDoc(`businesses/${businessId}/products`, item.id.toString());
      
      if (productData) {
        const currentStock = (productData as any).stock || (productData as any).stock_level || (productData as any).quantity || 0;
        
        if (currentStock < item.qty) {
          stockValidationErrors.push(
            `${item.name}: Requested ${item.qty}, but only ${currentStock} available`
          );
        }
      }
    }

    if (stockValidationErrors.length > 0) {
      showToast(`Insufficient stock:\n${stockValidationErrors.join('\n')}`);
      return;
    }
    
    // Validate payment amounts match final total (after discount)
    const totalPayment = paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0);
    if (totalPayment !== finalTotal) {
      return showToast(`Payment total (${formatMoney(totalPayment)}) must match sale total (${formatMoney(finalTotal)})`);
    }

    // Validate credit payment details
    const creditPayment = paymentBreakdown.find(pb => pb.method === 'credit');
    if (creditPayment && creditPayment.amount > 0) {
      if (!selectedCreditCustomer && !creditCustomerName) {
        return showToast('Please select an existing customer or enter a new customer name for credit payment');
      }
    }
    
    setIsProcessingSale(true);
    
    try {
      const user = getAuthCurrentUser();
      
      if (!user) {
        showToast('Authentication required');
        setIsProcessingSale(false);
        return;
      }

      // Use the businessId from state (already fetched in useEffect)
      if (!businessId) {
        showToast('Business ID not found. Please ensure you are associated with a business.');
        setIsProcessingSale(false);
        return;
      }

      // Get current user's role and staff information
      const { data: userData } = await getSupabase().from('users').select('*').eq('id', user.uid).single();
      const userRole = userData?.role || 'Owner';
      const staffId = userData?.staffId || userData?.staff_id || null;
      const staffName = userData?.displayName || userData?.display_name || user.displayName || 'Unknown';

    // Get source location name
    const selectedLocation = stockLocations.find(loc => loc.id === sourceLocation);
    const sourceLocationName = selectedLocation?.name || 'Main Store';

    // Calculate expected cash and bank collections
    const splitPayment = paymentBreakdown.find(pb => pb.method === 'split');
    const splitAmount = splitPayment?.amount || 0;
    const splitCashPortion = splitAmount * 0.5;
    const splitBankPortion = splitAmount * 0.5;

    const expectedCash = paymentBreakdown
      .filter(pb => pb.method === 'cash')
      .reduce((sum, pb) => sum + pb.amount, 0) + splitCashPortion;
    const expectedBank = paymentBreakdown
      .filter(pb => ['transfer', 'pos', 'card'].includes(pb.method))
      .reduce((sum, pb) => sum + pb.amount, 0) + splitBankPortion;

      // Create sale document with staff tracking and source location
      const saleData: any = {
          products: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            costPrice: item.costPrice,
            quantity: item.qty,
            emoji: item.emoji,
          })),
          totalRevenue: finalTotal,
          subtotal: subtotal,
          discount: discount,
          discountType: discountType,
          discountValue: discountValue,
          totalCost: cart.reduce((s, i) => s + i.costPrice * i.qty, 0),
          profit: profit,
          paymentBreakdown: paymentBreakdown,
          paymentMethod: paymentBreakdown.length === 1 ? paymentBreakdown[0].method : 'split',
          expectedCash,
          expectedBank,
          note: note,
          businessId: businessId,
          sourceLocation: sourceLocation,
          sourceLocationName: sourceLocationName,
          bankAccountId: bankAccountId,
          recordedBy: {
            uid: user.uid,
            email: user.email,
            displayName: staffName,
            role: userRole,
            staffId: staffId,
          },
          createdAt: new Date().toISOString(),
          recordedAt: new Date().toISOString(),
        };

      // Optional customer attachment (selected or newly entered)
      if (selectedCustomer && selectedCustomer.trim() && selectedCustomer !== 'undefined') {
        saleData.customerId = selectedCustomer;
        saleData.customerName =
          creditCustomers.find((c) => c.id === selectedCustomer)?.name || customerName || null;
        saleData.customerPhone =
          creditCustomers.find((c) => c.id === selectedCustomer)?.phone || customerPhone || null;
      } else if (customerName.trim()) {
        saleData.customerName = customerName.trim();
        saleData.customerPhone = customerPhone.trim() || null;
      }


      // Offline path — queue and return early
      if (!offlineManager.isOnline()) {
        const items = (saleData.products || []).map((p: any) => ({
          productId: String(p.productId),
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          costPrice: p.costPrice || 0,
          emoji: p.emoji,
        }));
        const totalRevenue = saleData.totalRevenue || saleData.total || 0;
        const totalCost = items.reduce((s: number, i: any) => s + (i.costPrice || 0) * i.quantity, 0);
        await offlineManager.queueSale({
          businessId,
          userId: user.uid,
          items,
          paymentType: (saleData.paymentMethod || 'cash') as any,
          totalRevenue,
          totalCost,
          totalProfit: totalRevenue - totalCost,
          recordedBy: saleData.recordedBy || {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Owner',
            role: 'Owner',
          },
        });
        showToast('Sale saved offline. It will sync when you are back online.');
        setIsProcessingSale(false);
        // clear cart if handlers exist
        try { setCart([]); } catch { /* ignore */ }
        return;
      }

      // Save sale — prefer shared API (service role), fall back to client Supabase
      let saleId = '';
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          const res = await fetch('/api/sales/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              businessId,
              products: (saleData.products || []).map((p: any) => ({
                productId: p.productId,
                name: p.name,
                price: p.price,
                costPrice: p.costPrice,
                quantity: p.quantity,
              })),
              total: saleData.totalRevenue || saleData.total || 0,
              paymentMethod: saleData.paymentMethod || 'cash',
              paymentBreakdown: saleData.paymentBreakdown,
              note: saleData.note || '',
              staffName: saleData.recordedBy?.displayName,
              staffRole: saleData.recordedBy?.role || 'Owner',
              staffId: saleData.recordedBy?.staffId || saleData.recordedBy?.uid,
            }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error || `Sale API ${res.status}`);
          saleId = json.saleId;
        }
      } catch (apiErr) {
        console.warn('[RecordSale] API write failed, client fallback', apiErr);
        saleId = await sbAddDoc(`businesses/${businessId}/sales`, {
          ...saleData,
          id: crypto.randomUUID(),
        });
      }
      if (!saleId) {
        saleId = await sbAddDoc(`businesses/${businessId}/sales`, {
          ...saleData,
          id: crypto.randomUUID(),
        });
      }
      const saleRef = { id: saleId };

      // Create cash flow entry for the sale
      try {
        await sbAddDoc(`businesses/${businessId}/cashFlow`, {
          date: new Date().toISOString(),
          moneyIn: expectedCash,
          moneyOut: 0,
          category: 'Sale',
          description: `Sale #${saleRef.id.slice(-6)}`,
          saleId: saleRef.id,
          paymentMethod: paymentBreakdown.length === 1 ? paymentBreakdown[0].method : 'split',
          sourceLocation: sourceLocationName,
          createdAt: new Date().toISOString(),
        });
        console.log('✅ Cash flow entry created for sale');
      } catch (cashFlowError) {
        console.error('⚠️ Failed to create cash flow entry:', cashFlowError);
        // Don't fail the sale if cash flow entry fails
      }

      // Record audit trail for sale creation
      try {
        const { data: auditUserData } = await getSupabase().from('users').select('*').eq('id', user.uid).single();
        
        await sbAddDoc(`businesses/${businessId}/auditTrail`, {
          userId: user.uid,
          userName: staffName,
          userEmail: user.email || auditUserData?.email || '',
          action: 'create',
          entityType: 'sale',
          entityId: saleRef.id,
          entityName: `Sale #${saleRef.id.slice(-6)}`,
          previousValues: null,
          newValues: {
            products: cart.map(item => ({
              productId: item.id,
              name: item.name,
              quantity: item.qty,
              price: item.price,
              costPrice: item.costPrice,
            })),
            totalRevenue: subtotal,
            totalCost: cart.reduce((s, i) => s + i.costPrice * i.qty, 0),
            profit: profit,
            paymentMethod: payment,
            paymentBreakdown: paymentBreakdown,
            expectedCash,
            expectedBank,
            sourceLocation: sourceLocationName,
          },
          timestamp: new Date().toISOString(),
          ipAddress: null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });
        console.log('✅ Audit trail recorded for sale');
      } catch (auditError) {
        console.error('⚠️ Failed to record audit trail:', auditError);
        // Don't fail the sale if audit fails
      }

      // Update bank account balance if sale has bank/POS/card payments
      if (expectedBank > 0 && bankAccountId) {
        try {
          const bankAccountDoc = await fetchDoc(`businesses/${businessId}/bankAccounts`, bankAccountId);
          
          if (bankAccountDoc) {
            const currentBalance = (bankAccountDoc as any).currentBalance || (bankAccountDoc as any).current_balance || 0;
            await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, bankAccountId, {
              currentBalance: currentBalance + expectedBank
            });
            
            // Create bank transaction record
            await sbAddDoc(`businesses/${businessId}/bankTransactions`, {
              transactionNumber: `SALE-${Date.now()}`,
              bankAccountId: bankAccountId,
              accountName: (bankAccountDoc as any).accountName || (bankAccountDoc as any).name,
              type: 'money_in',
              category: 'Sale',
              amount: expectedBank,
              balanceAfter: currentBalance + expectedBank,
              description: `Sale #${saleRef.id.slice(-6)}`,
              saleId: saleRef.id,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error updating bank account balance:', error);
        }
      }

      // Create invoice for warehouse release mode
      if (inventoryDeductionMode === 'warehouse') {
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
        const invoiceData = {
          invoiceNumber,
          saleId: saleRef.id,
          customerName: note ? note.split('\n')[0] : 'Walk-in Customer',
          customerPhone: '',
          items: cart.map(item => ({
            productId: item.id.toString(),
            name: item.name,
            quantity: item.qty,
            price: item.price,
            total: item.price * item.qty,
          })),
          totalAmount: subtotal,
          sourceLocation: sourceLocationName,
          sourceLocationId: sourceLocation,
          status: 'pending',
          createdAt: new Date(),
          pickupStatus: 'pending',
          pickupWarehouse: sourceLocationName,
          recordedBy: {
            uid: user.uid,
            email: user.email,
            displayName: staffName,
            role: userRole,
            staffId: staffId,
          },
        };

        await sbAddDoc(`businesses/${businessId}/invoices`, invoiceData);
      }

      // Only deduct inventory if mode is immediate
      if (inventoryDeductionMode === 'immediate') {
      // Update product stock sequentially (no true atomicity on client, best-effort)
      for (const item of cart) {
        try {
          const productData = await fetchDoc(`businesses/${businessId}/products`, item.id.toString());
          
          if (productData) {
            const currentStock = (productData as any).stock || (productData as any).stock_level || (productData as any).quantity || 0;
            
            // Double-check stock availability (prevents race conditions)
            if (currentStock < item.qty) {
              throw new Error(`Insufficient stock for ${item.name}. Only ${currentStock} available.`);
            }
            
            const newStock = Math.max(0, currentStock - item.qty);
            
            // Update stockByLocation - use dynamic locations
            const stockByLocation = (productData as any).stockByLocation || {};
            
            // Only deduct from location if sourceLocation is specified and exists
            if (sourceLocation && stockByLocation[sourceLocation] !== undefined) {
              const currentLocationStock = stockByLocation[sourceLocation] || 0;
              
              // Double-check location stock availability
              if (currentLocationStock < item.qty) {
                throw new Error(`Insufficient stock at ${sourceLocationName} for ${item.name}. Only ${currentLocationStock} available.`);
              }
              
              const newLocationStock = Math.max(0, currentLocationStock - item.qty);
              stockByLocation[sourceLocation] = newLocationStock;
            }
            
            await sbUpdateDoc(`businesses/${businessId}/products`, item.id.toString(), {
              stock: newStock,
              stockByLocation: stockByLocation,
              lastSaleLocation: sourceLocation,
              lastSaleLocationName: sourceLocationName,
              lastSaleDate: new Date().toISOString(),
              unitsSold30d: ((productData as any).unitsSold30d || 0) + item.qty,
              totalSalesCount: ((productData as any).totalSalesCount || 0) + item.qty,
              lastSalePrice: item.price,
            });
          }
        } catch (err) {
          console.error(`Failed to update stock for ${item.name}:`, err);
          throw err; // Re-throw to abort sale
        }
      }

      // Check for low stock items and send alert
      try {
        // Check if low stock notifications are enabled
        const { data: ownerDoc } = await getSupabase().from('users').select('*').eq('id', user.uid).single();
        const emailPrefs = ownerDoc?.emailPreferences || ownerDoc?.email_preferences;
        const businessName = ownerDoc?.businessName || ownerDoc?.business_name || 'Your Business';
        const ownerEmail = user.email;
        const ownerName = ownerDoc?.fullName || ownerDoc?.full_name || ownerDoc?.displayName || ownerDoc?.display_name || 'Business Owner';
        
        if (emailPrefs?.lowStock !== false) {
          const lowStockItems: Array<{ name: string; stock: number; threshold: number }> = [];
          for (const item of cart) {
            const productData = await fetchDoc(`businesses/${businessId}/products`, item.id.toString());
            
            if (productData) {
              const stock = (productData as any).stock || (productData as any).stock_level || 0;
              const threshold = (productData as any).lowStockThreshold || 10;
              
              if (stock <= threshold) {
                lowStockItems.push({
                  name: (productData as any).name || item.name,
                  stock,
                  threshold,
                });
              }
            }
          }

          // Send low stock alert if any items are below threshold
          if (lowStockItems.length > 0) {
            try {
              await notifyLowStock({
                names: lowStockItems.map((i) => i.name),
                count: lowStockItems.length,
              });
            } catch { /* non-blocking */ }

            if (ownerEmail) {
              await BrevoService.sendLowStockAlertEmail(
                ownerEmail,
                businessName,
                lowStockItems
              );
              console.log('Low stock alert email sent');
            }
          }
        }

        // Check if this is the first sale and send celebration email
        if (emailPrefs?.firstSale !== false && ownerEmail) {
          const recentSales = await fetchDocs(`businesses/${businessId}/sales`, {
            orderBy: { field: 'created_at', ascending: false },
            limit: 2,
          });
          
          // If this is the first sale (recentSales size is 1, which is the sale we just created)
          if (recentSales.length === 1) {
          await sendFirstSaleCelebrationEmail({
            email: ownerEmail,
            name: ownerName,
            businessName,
            saleAmount: subtotal,
            productName: cart.length > 0 ? cart[0].name : 'First Sale',
            currency: currencyCode,
          });
            console.log('First sale celebration email sent');
          }
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't fail the sale if email fails
      }
      }

      // If credit payment is used, create credit transaction
      const creditPayment = paymentBreakdown.find(pb => pb.method === 'credit');
      if (creditPayment && creditPayment.amount > 0) {
        let customerId = selectedCreditCustomer;

        // If no customer selected, create a new one
        if (!customerId && creditCustomerName) {
          const newCustomerId = crypto.randomUUID();
          await sbAddDoc(`businesses/${businessId}/credit_customers`, {
            id: newCustomerId,
            name: creditCustomerName,
            phone: creditCustomerPhone,
            email: '',
            address: '',
            businessType: 'individual',
            notes: '',
            totalCreditLimit: null,
            currentBalance: creditPayment.amount,
            isRegularCustomer: false,
            createdAt: new Date().toISOString(),
          });
          customerId = newCustomerId;
        }

        if (customerId) {
          // Require due date for credit sales
          if (!creditDueDate) {
            showToast('Please specify a due date for credit sales');
            setIsProcessingSale(false);
            return;
          }

          // Parse date string as local time (not UTC) to avoid timezone issues
          const [year, month, day] = creditDueDate.split('-').map(Number);
          const dueDate = new Date(year, month - 1, day);

          // Create credit transaction
          await sbAddDoc(`businesses/${businessId}/credit_transactions`, {
            customerId,
            customerName: creditCustomerName || (selectedCreditCustomer ? creditCustomers.find(c => c.id === customerId)?.name : null) || 'Unknown',
            saleId: saleRef.id,
            amount: creditPayment.amount,
            originalAmount: creditPayment.amount,
            status: 'pending',
            dueDate,
            issuedDate: new Date(),
            paidAmount: 0,
            remainingAmount: creditPayment.amount,
            paymentHistory: [],
            notes: note,
            reminderSent: false,
            reminderCount: 0,
            products: cart.map(item => ({
              name: item.name,
              quantity: item.qty,
              price: item.price,
            })),
            branchId: null,
            recordedBy: user.uid,
            recordedByName: staffName,
          });

          // Update customer balance
          await sbUpdateDoc(`businesses/${businessId}/credit_customers`, customerId, {
            currentBalance: (creditCustomers.find(c => c.id === customerId)?.currentBalance || 0) + creditPayment.amount,
          });

          showToast('Credit sale recorded successfully');
        }
      }

      // Update product stock sequentially (no true atomicity on client, best-effort)
      for (const item of cart) {
        try {
          const productData = await fetchDoc(`businesses/${businessId}/products`, item.id.toString());
          
          if (productData) {
            const currentStock = (productData as any).stock || (productData as any).stock_level || (productData as any).quantity || 0;
            
            // Double-check stock availability (prevents race conditions)
            if (currentStock < item.qty) {
              throw new Error(`Insufficient stock for ${item.name}. Only ${currentStock} available.`);
            }
            
            const newStock = Math.max(0, currentStock - item.qty);
            
            // Update stockByLocation - use dynamic locations
            const stockByLocation = (productData as any).stockByLocation || {};
            
            // Only deduct from location if sourceLocation is specified and exists
            if (sourceLocation && stockByLocation[sourceLocation] !== undefined) {
              const currentLocationStock = stockByLocation[sourceLocation] || 0;
              
              // Double-check location stock availability
              if (currentLocationStock < item.qty) {
                throw new Error(`Insufficient stock at ${sourceLocationName} for ${item.name}. Only ${currentLocationStock} available.`);
              }
              
              const newLocationStock = Math.max(0, currentLocationStock - item.qty);
              stockByLocation[sourceLocation] = newLocationStock;
            }
            
            await sbUpdateDoc(`businesses/${businessId}/products`, item.id.toString(), {
              stock: newStock,
              stockByLocation: stockByLocation,
              lastSaleLocation: sourceLocation,
              lastSaleLocationName: sourceLocationName,
            });
          }
        } catch (err) {
          console.error(`Failed to update stock for ${item.name}:`, err);
          throw err; // Re-throw to abort sale
        }
      }

      // Check for low stock items and send alert
      try {
        // Check if low stock notifications are enabled
        const { data: ownerDoc2 } = await getSupabase().from('users').select('*').eq('id', user.uid).single();
        const emailPrefs2 = ownerDoc2?.emailPreferences || ownerDoc2?.email_preferences;
        
        if (emailPrefs2?.lowStock !== false) {
          const lowStockItems: Array<{ name: string; stock: number; threshold: number }> = [];
          for (const item of cart) {
            const productData = await fetchDoc(`businesses/${businessId}/products`, item.id.toString());
            
            if (productData) {
              const stock = (productData as any).stock || (productData as any).stock_level || 0;
              const threshold = (productData as any).lowStockThreshold || 10;
              
              if (stock <= threshold) {
                lowStockItems.push({
                  name: (productData as any).name || item.name,
                  stock,
                  threshold,
                });
              }
            }
          }

          // Send low stock alert if any items are below threshold
          if (lowStockItems.length > 0) {
            const businessName2 = ownerDoc2?.businessName || ownerDoc2?.business_name || 'Your Business';
            const ownerEmail2 = user.email;
            
            if (ownerEmail2) {
              await BrevoService.sendLowStockAlertEmail(
                ownerEmail2,
                businessName2,
                lowStockItems
              );
              console.log('Low stock alert email sent');
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send low stock alert:', emailError);
        // Don't fail the sale if email fails
      }

      // If recorded by staff, update staff's revenue and transaction counts
      if (userRole === 'Staff' && staffId) {
        try {
          const staffData = await fetchDoc(`businesses/${businessId}/staff`, user.uid);
          
          if (staffData) {
            const currentRevenue = (staffData as any).revenue || 0;
            const currentTransactions = (staffData as any).transactions || 0;
            
            await sbUpdateDoc(`businesses/${businessId}/staff`, user.uid, {
              revenue: currentRevenue + subtotal,
              transactions: currentTransactions + 1,
              lastSaleAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Error updating staff stats:', err);
        }
      }

      showToast(`${t('sale.saleComplete')} - ${formatMoney(subtotal)}`);

      // Device notification
      try {
        await notifySale({
          amountLabel: formatMoney(subtotal),
          saleId: saleRef.id,
          byStaff: userRole === 'Staff',
          staffName: staffName || undefined,
        });
      } catch { /* non-blocking */ }
      
      // Fetch business data for receipt
      let businessName = 'Business';
      let businessAddress = '';
      let businessPhone = '';
      
      try {
        const { data: bizDoc } = await getSupabase().from('businesses').select('*').eq('id', businessId).single();
        if (bizDoc) {
          businessName = bizDoc.businessName || bizDoc.business_name || 'Business';
          businessAddress = bizDoc.address || '';
          businessPhone = bizDoc.phone || '';
        }
      } catch (error) {
        console.error('Error fetching business data:', error);
      }
      
      // Prepare receipt data for all categories
      const receiptData = {
        businessName,
        businessAddress,
        businessPhone,
        saleNumber: `SALE-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.qty,
          price: item.price,
          total: item.price * item.qty,
        })),
        subtotal: subtotal,
        amountPaid: paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0),
        outstandingBalance: subtotal - paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0),
        paymentMethod: paymentBreakdown.length === 1 ? paymentBreakdown[0].method : 'split',
        sourceLocation: sourceLocationName,
        logoUrl: businessLogo,
        theme: receiptTheme,
      };

      setLastSaleData(receiptData);
      setShowReceipt(true);
      
      clearCart();
      setPaymentBreakdown([]);
      
      // Refresh products to show updated stock quantities
      await refreshProducts();
      
      // Clear credit fields
      setSelectedCreditCustomer('');
      setCreditCustomerName('');
      setCreditCustomerPhone('');
      setCreditDueDate('');
      
      // Don't navigate away - show receipt first
      // navigateTo('home');
    } catch (error) {
      console.error('Error saving sale:', error);
      showToast('Failed to save sale. Please try again.');
    } finally {
      setIsProcessingSale(false);
    }
  }

  if (!isMounted) {
    return null;
  }

  // Recalculate for render (cart may have changed)
  const renderSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const renderDiscount = discountType === 'percentage' 
    ? (discountValue > 0 ? (renderSubtotal * discountValue) / 100 : 0)
    : discountValue;
  const renderFinalTotal = renderSubtotal - renderDiscount;
  const renderProfit = cart.reduce((s, i) => s + (i.price - i.costPrice) * i.qty, 0) - renderDiscount;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.pageHeader} ${styles.pageHeaderV2}`}>
        <div>
          <div className={styles.eyebrow}>Checkout</div>
          <h2 className={styles.pageTitle}>{t('sale.title')}</h2>
          <p className={styles.pageDesc}>{t('sale.subtitle')}</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← {t('common.back')}</Button>
      </div>

      <div className={styles.layout}>
        {/* Section 1 — product picker (always above checkout on mobile; left on desktop) */}
        <section className={styles.left} aria-label="Product picker">
          <Card style={{ marginBottom: 12 }}>
            <CardHeader
              action={<span className={styles.selCount}>{cart.length} {t('sale.quantity')}</span>}
            >
              <CardIcon bg="var(--green-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
              </CardIcon>
              {t('sale.selectProducts')}
            </CardHeader>

            {/* Search */}
            <div className={styles.search}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder={t('common.search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.productGrid}>
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 32, height: 32, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                  </svg>
                  {t('common.loading')}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  {search ? (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('sale.noProductsFound')}</div>
                      <div style={{ fontSize: '0.8rem' }}>{t('sale.tryDifferentSearch')}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('sale.noProducts')}</div>
                      <div style={{ fontSize: '0.8rem' }}>{t('sale.addProductsFirst')}</div>
                    </div>
                  )}
                </div>
              ) : (
                filtered.map(p => {
                  const inCart = cart.find(i => i.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={[styles.productCard, inCart ? styles.productSelected : ''].join(' ')}
                      onClick={() => addToCart(p)}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className={styles.productImage} />
                      ) : (
                        <div className={styles.productEmoji}>{p.emoji}</div>
                      )}
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productPrice}>{formatMoney(p.price)}</div>
                      <div className={styles.productStock}>
                        {(() => {
                          const locationStock = showStockSource && sourceLocation && p.stockByLocation
                            ? (p.stockByLocation[sourceLocation as keyof typeof p.stockByLocation] || 0)
                            : p.stock;
                          if (locationStock <= 5) {
                            return <span className={styles.lowStock}>Only {locationStock} {t('sale.quantity')}</span>;
                          }
                          return <span>{locationStock} {t('sale.quantity')} {t('product.inStock')}</span>;
                        })()}
                      </div>
                      {inCart && (
                        <div className={styles.productQtyBadge}>{inCart.qty}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Custom item toggle button */}
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={() => setShowCustomItem(!showCustomItem)}
            style={{ marginBottom: showCustomItem ? 0 : 14 }}
          >
            {showCustomItem ? '− Hide Custom Item' : '+ Add Custom Item'}
          </Button>

          {/* Custom item */}
          {showCustomItem && (
            <Card>
              <CardHeader>
                <CardIcon bg="var(--amber-bg)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </CardIcon>
                {t('sale.addCustomItem')}
              </CardHeader>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('product.name')}</label>
                  <input className={styles.formInput} placeholder={t('product.name')} value={customName} onChange={e => setCustomName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('sale.quantity')}</label>
                  <input className={styles.formInput} type="number" min={1} placeholder="1" value={customQty} onChange={e => setCustomQty(e.target.value)} />
                </div>
              </div>
              <div className={styles.formRow} style={{ marginTop: 9 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('product.sellingPrice')} ({currencyCode})</label>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>{currencyCode === 'NGN' ? '₦' : currencyCode + ' '}</span>
                    <input className={styles.formInput} type="number" placeholder="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('product.costPrice')} ({currencyCode})</label>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>{currencyCode === 'NGN' ? '₦' : currencyCode + ' '}</span>
                    <input className={styles.formInput} type="number" placeholder="0" value={customCost} onChange={e => setCustomCost(e.target.value)} />
                  </div>
                </div>
              </div>
              <Button variant="ghost" fullWidth style={{ marginTop: 11 }} onClick={addCustom}>
                + {t('sale.addToCart')}
              </Button>
            </Card>
          )}
        </section>

        {/* Section 2 — cart & checkout (below products on mobile; right column on desktop) */}
        <section className={styles.right} aria-label="Checkout">
          <Card>
            <CardHeader action={<Button variant="danger" size="xs" onClick={clearCart}>Clear</Button>}>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                </svg>
              </CardIcon>
              {t('sale.cart')}
            </CardHeader>

            {/* Cart items */}
            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div className={styles.cartEmpty}>{t('sale.emptyCart')}</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className={styles.cartItem}>
                    <span className={styles.cartEmoji}>{item.emoji}</span>
                    <div className={styles.cartInfo}>
                      <div className={styles.cartName}>{item.name}</div>
                      <div className={styles.cartPrice}>{formatMoney(item.price * item.qty)}</div>
                      {showStockSource && sourceLocation && (
                        <div className={styles.cartSource}>
                          Source: {stockLocations.find(loc => loc.id === sourceLocation)?.name || 'Main Store'}
                        </div>
                      )}
                    </div>
                    <div className={styles.cartQtyControl}>
                      <button onClick={() => updateQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <button className={styles.cartRemove} onClick={() => removeItem(item.id)}>×</button>
                  </div>
                ))
              )}
            </div>

      {/* Totals */}
      {cart.length > 0 && (
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>{t('sale.subtotal')}</span><span>{formatMoney(renderSubtotal)}</span>
          </div>

          {/* Discount Section */}
          <div className={styles.discountSection}>
            <div className={styles.discountRow}>
              <span>Discount:</span>
              <select
                className={styles.discountSelect}
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value as 'fixed' | 'percentage');
                  setDiscountValue(0);
                }}
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div className={styles.discountInputRow}>
              <input
                type="number"
                className={styles.discountInput}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                min={0}
                max={discountType === 'percentage' ? 100 : renderSubtotal}
              />
              <span className={styles.discountLabel}>
                {discountType === 'percentage' ? '%' : currencyCode}
              </span>
            </div>
            {renderDiscount > 0 && (
              <div className={styles.discountAmount}>
                Discount Amount: -{formatMoney(renderDiscount)}
              </div>
            )}
          </div>

          <div className={[styles.totalRow, styles.totalMain].join(' ')}>
            <span>{t('sale.grandTotal')}</span><span>{formatMoney(renderFinalTotal)}</span>
          </div>
          <div className={[styles.totalRow, styles.totalProfit].join(' ')}>
            <span>{t('sale.profit')}</span><span>{formatMoney(renderProfit)}</span>
          </div>
        </div>
      )}

            {/* Source Location Selection - Only show for retail/wholesale or pro users with multiple branches */}
            {cart.length > 0 && showStockSource && (
              <div className={styles.sourceLocationSection}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock Source</label>
                  <select
                    className={styles.formInput}
                    value={sourceLocation}
                    onChange={e => setSourceLocation(e.target.value)}
                  >
                    {stockLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  <div className={styles.formHint}>Select where stock is being deducted from</div>
                </div>
              </div>
            )}

      {/* Optional customer — any business can attach a sale to a customer */}
      {cart.length > 0 && (
        <div className={styles.customerSection}>
          <div className={styles.customerLabel}>Customer <span className={styles.optionalTag}>Optional</span></div>
          <p className={styles.customerHint}>Attach this sale to a customer for history and credit tracking. Leave blank for walk-in.</p>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Existing Customer</label>
            <select 
              className={styles.formInput}
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                if (e.target.value) {
                  setShowNewCustomer(false);
                }
              }}
            >
              <option value="">-- Select Customer (Optional) --</option>
              {creditCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.currentBalance > 0 ? `(Balance: ${formatMoney(customer.currentBalance)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {!selectedCustomer && showNewCustomer && (
            <>
              <div className={styles.creditDivider}>OR</div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Customer Name</label>
                <input 
                  className={styles.formInput}
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input 
                  className={styles.formInput}
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </>
          )}
          
          {!selectedCustomer && (
            <button 
              type="button"
              className={styles.addNewCustomerBtn}
              onClick={() => setShowNewCustomer(!showNewCustomer)}
            >
              {showNewCustomer ? '− Hide New Customer Form' : '+ Add New Customer'}
            </button>
          )}
          
          {selectedCustomer && (
            <div className={styles.selectedCustomerInfo}>
              <span>Selected: {creditCustomers.find(c => c.id === selectedCustomer)?.name}</span>
              <button 
                type="button"
                className={styles.clearCustomerBtn}
                onClick={() => setSelectedCustomer('')}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment method — include credit; multi-select = split */}
      <div className={styles.paymentSection}>
        <div className={styles.paymentLabel}>{t('sale.paymentMethod')}</div>
        <p className={styles.paymentHint}>Tap one or more methods. Amounts must add up to the total. Use <strong>Credit</strong> for pay-later sales.</p>

        {/* Credit Customer Selection - Show only when credit is selected */}
        {paymentBreakdown.some(pb => pb.method === 'credit') && (
                <div className={styles.creditSection}>
                  <div className={styles.creditLabel}>Credit Customer Details</div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Existing Customer</label>
                    <select 
                      className={styles.formInput}
                      value={selectedCreditCustomer}
                      onChange={e => {
                        setSelectedCreditCustomer(e.target.value);
                        const customer = creditCustomers.find(c => c.id === e.target.value);
                        if (customer) {
                          setCreditCustomerName(customer.name);
                          setCreditCustomerPhone(customer.phone || '');
                        }
                      }}
                    >
                      <option value="">-- Select Customer --</option>
                      {creditCustomers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.currentBalance > 0 ? `(Balance: ${formatMoney(customer.currentBalance)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedCreditCustomer && (
                    <>
                      <div className={styles.creditDivider}>OR</div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>New Customer Name *</label>
                        <input 
                          className={styles.formInput}
                          placeholder="Enter customer name"
                          value={creditCustomerName}
                          onChange={e => setCreditCustomerName(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Phone Number</label>
                        <input 
                          className={styles.formInput}
                          placeholder="Enter phone number"
                          value={creditCustomerPhone}
                          onChange={e => setCreditCustomerPhone(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Due Date</label>
                    <input 
                      className={styles.formInput}
                      type="date"
                      value={creditDueDate}
                      onChange={e => setCreditDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <div className={styles.formHint}>Default: 7 days from today</div>
                  </div>
                </div>
              )}

              <div className={styles.paymentGrid}>
                {PAYMENT_METHODS.map(pm => {
                  const paymentBreakdownItem = paymentBreakdown.find(pb => pb.method === pm.id);
                  const amount = paymentBreakdownItem?.amount || 0;
                  const isActive = paymentBreakdownItem !== undefined;
                  return (
                    <div key={pm.id} className={styles.paymentMethodCard}>
                      <button
                        className={[styles.payMethod, isActive ? styles.payActive : ''].join(' ')}
                        onClick={() => {
                          if (!isActive) {
                            // Auto-fill with finalTotal if this will be the only payment method
                            const autoAmount = paymentBreakdown.length === 0 ? finalTotal : 0;
                            setPaymentBreakdown(prev => [...prev, { method: pm.id as PaymentMethod, amount: autoAmount }]);
                          } else {
                            setPaymentBreakdown(prev => prev.filter(pb => pb.method !== pm.id));
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                          <path d={pm.icon}/>
                        </svg>
                        <div className={styles.payLabel}>{pm.label}</div>
                      </button>
                      {isActive && (
                        <input
                          type="number"
                          className={styles.paymentAmountInput}
                          value={amount || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                            setPaymentBreakdown(prev => prev.map(pb => pb.method === pm.id ? { ...pb, amount: value } : pb));
                          }}
                          placeholder="Amount"
                          min="0"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.paymentTotal}>
                <span>Total: {formatMoney(paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0))}</span>
                {paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0) !== finalTotal && (
                  <span className={styles.paymentWarning}>
                    {paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0) < finalTotal ? 
                      `Missing ${formatMoney(finalTotal - paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0))}` : 
                      `Over by ${formatMoney(paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0) - finalTotal)}`
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Note */}
            <div className={styles.formGroup} style={{ marginBottom: 9 }}>
              <label className={styles.formLabel}>{t('sale.note')} ({t('common.optional')})</label>
              <input className={styles.formInput} placeholder={t('sale.note')} value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {/* Actions */}
            <div className={styles.saleActions}>
              <Button variant="subtle" style={{ flex: 1 }}>{t('sale.saveDraft')}</Button>
              <Button 
                variant="primary" 
                size="lg" 
                style={{ flex: 2 }} 
                onClick={confirmSale}
                disabled={isProcessingSale || cart.length === 0}
              >
                {isProcessingSale ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, marginRight: 8, animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>{t('sale.completeSale')} ✓</>
                )}
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSaleData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Receipt</h3>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  navigateTo('home');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                ×
              </button>
            </div>
            <ReceiptGenerator 
              receiptData={lastSaleData} 
              onClose={() => {
                setShowReceipt(false);
                navigateTo('home');
              }}
              isWholesale={businessCategory.includes('wholesale') || businessCategory.includes('distributor')}
              receiptType={receiptType || 'supermarket'}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Button
                variant="primary"
                onClick={() => window.print()}
                style={{ flex: 1 }}
              >
                Print Receipt
              </Button>
              <Button
                variant="subtle"
                onClick={() => {
                  setShowReceipt(false);
                  navigateTo('home');
                }}
                style={{ flex: 1 }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Cash',     icon: 'M2 6h20a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V8a2 2 0 012-2zM2 10h20' },
  { id: 'transfer', label: 'Transfer', icon: 'M5 2h14a2 2 0 012 2v20a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01' },
  { id: 'pos',      label: 'POS',      icon: 'M1 4h22v16a2 2 0 01-2 2H3a2 2 0 01-2-2V4zM1 10h22' },
  { id: 'credit',   label: 'Credit',   icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM8 12h8M12 8v8' },
];
