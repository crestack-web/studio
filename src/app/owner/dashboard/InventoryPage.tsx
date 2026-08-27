import React, { useState, useEffect } from 'react';
import { Product } from './inventoryData';
import InventoryOverviewCards from './InventoryOverviewCards';
import InventoryTable from './InventoryTable';
import LowStockPanel from './LowStockPanel';
import DeadStockInsights from './DeadStockInsights';
import ProductDetailModal from './ProductDetailModal';
import { AddProductPage } from './Addproductpage';
import { useTranslation } from './LangContext';
import { fetchDocs, fetchDoc, addDoc as sbAddDoc, updateDoc as sbUpdateDoc, deleteDoc as sbDeleteDoc, runBatch } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { useApp } from './AppContext';
import { useBranch } from '@/context/BranchContext';
import { sendOutOfStockAlertEmail, sendOverstockWarningEmail } from '@/services/email/inventory-emails';
import './inventory.css';

const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, user } = useApp();
  const { isProUser, branches, businessId, selectedBranchId } = useBranch();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProductForTransfer, setSelectedProductForTransfer] = useState<Product | null>(null);
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [targetBranchId, setTargetBranchId] = useState<string>('');
  const [stockLocations, setStockLocations] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [sourceLocation, setSourceLocation] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<string>('');
  const [transferType, setTransferType] = useState<'branch' | 'warehouse'>('warehouse');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessCategory, setBusinessCategory] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Resolve business id the same way as Add Product / Record Sale
        let effectiveBusinessId = user.businessId || businessId || '';
        try {
          const { data: userData } = await getSupabase()
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (userData) {
            effectiveBusinessId =
              userData.businessId ||
              userData.business_id ||
              effectiveBusinessId ||
              user.id;
            if (userData.category || userData.business_type) {
              setBusinessCategory((userData.category || userData.business_type).toLowerCase());
            }
          }
        } catch (e) {
          console.error('Error loading user/business for inventory:', e);
        }

        if (!effectiveBusinessId) {
          setProducts([]);
          setError('Business not found for this account.');
          setIsLoading(false);
          return;
        }

        console.log('[Inventory] loading products for businessId:', effectiveBusinessId);

        // Always load business-level products (add-product writes here).
        const mainProducts = await fetchDocs(`businesses/${effectiveBusinessId}/products`);
        let productsData: any[] = Array.isArray(mainProducts) ? [...mainProducts] : [];
        console.log('[Inventory] main products count:', productsData.length);

        if (selectedBranchId && isProUser) {
          try {
            const branchProducts = await fetchDocs(
              `businesses/${effectiveBusinessId}/branches/${selectedBranchId}/products`
            );
            const seen = new Set(productsData.map((p: any) => p.id));
            for (const bp of branchProducts || []) {
              if (bp?.id && !seen.has(bp.id)) {
                productsData.push(bp);
                seen.add(bp.id);
              }
            }
          } catch (branchErr) {
            console.warn('Branch products fetch failed, using main catalog only', branchErr);
          }
        }

        // Hide only explicitly inactive/archived/draft products
        const isVisibleProduct = (data: any) => {
          const status = (data.status || '').toString().toLowerCase();
          if (['inactive', 'archived', 'deleted', 'draft'].includes(status)) return false;
          // Only treat active===false as hidden when status is also explicitly inactive-like
          // (toDoc used to force active=false for null status — those must still show)
          if (data.active === false && status && status !== 'active') return false;
          return true;
        };

        const productsList: Product[] = productsData.filter(isVisibleProduct).map((data: any) => {
          const stockQty = Number(
            data.stock ?? data.stockLevel ?? data.stock_level ?? data.quantity ?? 0
          ) || 0;
          const cost = Number(
            data.cost ?? data.costPrice ?? data.unitCost ?? data.attributes?.cost ?? 0
          ) || 0;
          const productType = String(
            data.productType ||
              data.product_type ||
              data.attributes?.productType ||
              data.type ||
              ''
          ).toLowerCase();
          return {
            id: data.id,
            name: data.name || '',
            sku: data.sku || data.attributes?.sku || '',
            category: data.category || '',
            stock: stockQty,
            currentStock: stockQty,
            costPrice: cost,
            sellingPrice: Number(data.price ?? data.sellingPrice ?? 0) || 0,
            unitsSold30d: data.unitsSold30d || 0,
            totalSalesCount: data.totalSalesCount || 0,
            lastSaleDate: data.lastSaleDate || '',
            lastSalePrice: data.lastSalePrice || 0,
            reorderThreshold: data.lowStockThreshold || data.reorderLevel || data.reorder_level || 10,
            suggestedReorder: 0,
            emoji: data.attributes?.emoji || '',
            trend: 'flat' as const,
            movement: [],
            imageUrl: data.imageUrl || data.image_url || '',
            productType: productType || undefined,
          };
        });

        setProducts(productsList);
        
        // Load stock locations
        try {
          const locationsData = await fetchDocs(`businesses/${effectiveBusinessId}/stockLocations`);
          const loadedLocations: Array<{ id: string; name: string; type: string }> = locationsData.map((data: any) => ({
            id: data.id,
            name: data.name,
            type: data.type,
          }));
          
          // Deduplicate locations by name to prevent duplicates
          const uniqueLocations = loadedLocations.filter((location, index, self) =>
            index === self.findIndex(l => l.name.toLowerCase() === location.name.toLowerCase())
          );
          
          setStockLocations(uniqueLocations);
          
          // Set default locations if available
          if (loadedLocations.length > 0) {
            setSourceLocation(loadedLocations[0].id);
            setTargetLocation(loadedLocations.length > 1 ? loadedLocations[1].id : loadedLocations[0].id);
          }
        } catch (error) {
          console.error('Error loading stock locations:', error);
          setStockLocations([]);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        
        if (err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions')) {
          setError('You do not have permission to access this data. Please contact your administrator or check your account permissions.');
        } else {
          setError(err?.message || 'Unable to fetch inventory products.');
        }
        
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user?.id, businessId, selectedBranchId, isProUser]);

  const handleProductUpdate = async (updated: Product) => {
    try {
      const effectiveBusinessId = user.businessId || businessId;
      if (!effectiveBusinessId) {
        showToast('❌ Business information not available');
        return;
      }

      // Update product in Supabase
      await sbUpdateDoc(`businesses/${effectiveBusinessId}/products`, updated.id, {
        price: updated.sellingPrice,
        cost: updated.costPrice,
        lowStockThreshold: updated.reorderThreshold,
        updatedAt: new Date(),
      });

      console.log('✅ Product updated in Supabase:', updated.id);
      showToast('✅ Product updated successfully');

      // Check for out of stock or overstock conditions and send alerts
      try {
        const ownerData = await fetchDoc(`users`, user.id) as any;
        const businessName = ownerData?.businessName || 'Your Business';
        const ownerEmail = ownerData?.email;
        const ownerName = ownerData?.fullName || ownerData?.displayName || 'Business Owner';
        const emailPrefs = ownerData?.emailPreferences;

        if (emailPrefs?.outOfStock !== false && ownerEmail) {
          // Check if out of stock
          if (updated.stock === 0) {
            await sendOutOfStockAlertEmail({
              email: ownerEmail,
              name: ownerName,
              businessName,
              outOfStockItems: [{ 
                name: updated.name,
                lastSaleDate: updated.lastSaleDate || 'N/A',
              }],
            });
            console.log('Out of stock alert email sent');
          }
        }

        if (emailPrefs?.overstock !== false && ownerEmail) {
          // Check for overstock (more than 100 units as a threshold)
          const OVERSTOCK_THRESHOLD = 100;
          if (updated.stock > OVERSTOCK_THRESHOLD) {
            await sendOverstockWarningEmail({
              email: ownerEmail,
              name: ownerName,
              businessName,
              overstockItems: [{
                name: updated.name,
                currentStock: updated.stock,
                optimalStock: OVERSTOCK_THRESHOLD,
                daysSinceLastSale: updated.lastSaleDate ? Math.floor((Date.now() - new Date(updated.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24)) : 30,
              }],
            });
            console.log('Overstock warning email sent');
          }
        }
      } catch (emailError) {
        console.error('Failed to send inventory email alerts:', emailError);
      }

      // Update local state
      setProducts(prev =>
        prev.map(p => (p.id === updated.id ? updated : p))
      );
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('❌ Failed to update product');
    }
  };

  // Handle product transfer between warehouses or branches
  const handleProductTransfer = async (product: Product, target: string, quantity: number, type: 'branch' | 'warehouse') => {
    if (!businessId) {
      showToast('❌ Business information not available');
      return;
    }

    if (quantity <= 0 || quantity > product.stock) {
      showToast('❌ Invalid transfer quantity');
      return;
    }

    try {
      if (type === 'warehouse') {
        // Transfer between warehouse locations (main_store, back_store, warehouse)
        const productData = await fetchDoc(`businesses/${businessId}/products`, product.id) as any;
        
        if (!productData) {
          throw new Error('Product not found');
        }

        const stockByLocation = productData.stockByLocation || {};
        const sourceStock = stockByLocation[sourceLocation] || 0;
        const targetStock = stockByLocation[target] || 0;

        if (sourceStock < quantity) {
          throw new Error(`Insufficient stock in ${sourceLocation}`);
        }

        stockByLocation[sourceLocation] = sourceStock - quantity;
        stockByLocation[target] = targetStock + quantity;

        const transferId = crypto.randomUUID();

        await runBatch([
          {
            type: 'update',
            path: `businesses/${businessId}/products`,
            id: product.id,
            data: { stockByLocation, updatedAt: new Date() },
          },
          {
            type: 'add',
            path: `businesses/${businessId}/stockTransfers`,
            id: transferId,
            data: {
              productId: product.id,
              productName: product.name,
              fromLocation: sourceLocation,
              toLocation: target,
              quantity: quantity,
              transferredBy: user.id,
              transferredAt: new Date(),
            },
          },
        ]);
      } else {
        // Transfer between branches (sequential operations, best-effort)
        const sourceProductData = await fetchDoc(`businesses/${businessId}/products`, product.id) as any;
        
        if (!sourceProductData) {
          throw new Error('Source product not found');
        }

        const sourceStock = sourceProductData.stock || 0;

        if (sourceStock < quantity) {
          throw new Error('Insufficient stock in source branch');
        }

        // Check if target product exists
        const targetProductData = await fetchDoc(`businesses/${businessId}/branches/${target}/products`, product.id) as any;

        const ops: Array<{ type: 'add' | 'update'; path: string; id: string; data: Record<string, unknown> }> = [];

        if (targetProductData) {
          const targetStock = targetProductData.stock || 0;
          ops.push({
            type: 'update',
            path: `businesses/${businessId}/branches/${target}/products`,
            id: product.id,
            data: { stock: targetStock + quantity, updatedAt: new Date() },
          });
        } else {
          ops.push({
            type: 'add',
            path: `businesses/${businessId}/branches/${target}/products`,
            id: product.id,
            data: {
              name: product.name,
              sku: product.sku,
              category: product.category,
              cost: product.costPrice,
              price: product.sellingPrice,
              stock: quantity,
              imageUrl: product.imageUrl,
              lowStockThreshold: product.reorderThreshold,
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        ops.push({
          type: 'update',
          path: `businesses/${businessId}/products`,
          id: product.id,
          data: { stock: sourceStock - quantity, updatedAt: new Date() },
        });

        const transferId = crypto.randomUUID();
        ops.push({
          type: 'add',
          path: `businesses/${businessId}/transfers`,
          id: transferId,
          data: {
            productId: product.id,
            productName: product.name,
            fromBranch: businessId,
            toBranch: target,
            quantity: quantity,
            transferredBy: user.id,
            transferredAt: new Date(),
          },
        });

        await runBatch(ops);
      }

      showToast('✅ Product transferred successfully');
      
      // Refresh products
      const effectiveBusinessId = user.businessId || businessId;
      const productsData = await fetchDocs(`businesses/${effectiveBusinessId}/products`, {
        filters: [{ field: 'status', op: '=', value: 'active' }],
      });
      
      const productsList: Product[] = productsData.map((data: any) => ({
        id: data.id,
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        stock: data.stock || 0,
        currentStock: data.stock || 0,
        costPrice: data.cost || data.costPrice || 0,
        sellingPrice: data.price || 0,
        unitsSold30d: data.unitsSold30d || 0,
        lastSaleDate: data.lastSaleDate || '',
        reorderThreshold: data.lowStockThreshold || 10,
        suggestedReorder: 0,
        emoji: data.attributes?.emoji || '',
        trend: 'flat' as const,
        movement: [],
        imageUrl: data.imageUrl || '',
      }));

      setProducts(productsList);
      setShowTransferModal(false);
      setSelectedProductForTransfer(null);
    } catch (error: any) {
      console.error('Error transferring product:', error);
      showToast(`❌ Transfer failed: ${error.message}`);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (product: Product) => {
    if (!businessId) {
      showToast('❌ Business information not available');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await sbDeleteDoc(`businesses/${businessId}/products`, product.id);
      
      showToast('✅ Product deleted successfully');
      
      // Refresh products
      const effectiveBusinessId = user.businessId || businessId;
      const productsData = await fetchDocs(`businesses/${effectiveBusinessId}/products`, {
        filters: [{ field: 'status', op: '=', value: 'active' }],
      });
      
      const productsList: Product[] = productsData.map((data: any) => ({
        id: data.id,
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        stock: data.stock || 0,
        currentStock: data.stock || 0,
        costPrice: data.cost || data.costPrice || 0,
        sellingPrice: data.price || 0,
        unitsSold30d: data.unitsSold30d || 0,
        lastSaleDate: data.lastSaleDate || '',
        reorderThreshold: data.lowStockThreshold || 10,
        suggestedReorder: 0,
        emoji: data.attributes?.emoji || '',
        trend: 'flat' as const,
        movement: [],
        imageUrl: data.imageUrl || '',
      }));
      
      setProducts(productsList);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showToast(`❌ Failed to delete product: ${error.message}`);
    }
  };

  // Handle product deactivation
  const handleDeactivateProduct = async (product: Product) => {
    if (!businessId) {
      showToast('❌ Business information not available');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product.name}"?\n\nDeactivated products won't appear in sales but will be preserved in your records.`
    );
    
    if (!confirmed) return;

    try {
      await sbUpdateDoc(`businesses/${businessId}/products`, product.id, { status: 'inactive', updatedAt: new Date() });
      
      showToast('✅ Product deactivated successfully');
      
      // Refresh products
      const effectiveBusinessId = user.businessId || businessId;
      const productsData = await fetchDocs(`businesses/${effectiveBusinessId}/products`, {
        filters: [{ field: 'status', op: '=', value: 'active' }],
      });
      
      const productsList: Product[] = productsData.map((data: any) => ({
        id: data.id,
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        stock: data.stock || 0,
        currentStock: data.stock || 0,
        costPrice: data.cost || data.costPrice || 0,
        sellingPrice: data.price || 0,
        unitsSold30d: data.unitsSold30d || 0,
        lastSaleDate: data.lastSaleDate || '',
        reorderThreshold: data.lowStockThreshold || 10,
        suggestedReorder: 0,
        emoji: data.attributes?.emoji || '',
        trend: 'flat' as const,
        movement: [],
        imageUrl: data.imageUrl || '',
      }));
      
      setProducts(productsList);
    } catch (error: any) {
      console.error('Error deactivating product:', error);
      showToast(`❌ Failed to deactivate product: ${error.message}`);
    }
  };
  const handleExportCSV = () => {
    if (products.length === 0) {
      showToast('No products to export');
      return;
    }

    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Stock',
      'Cost Price',
      'Selling Price',
      'Profit',
      'Total Value',
      'Status',
      'Units Sold (30d)',
      'Last Sale',
    ];

    const rows = products.map(p => {
      const profit = p.sellingPrice - p.costPrice;
      const totalValue = p.costPrice * p.stock;
      const status = p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderThreshold ? 'Low Stock' : 'In Stock';
      const lastSale = p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : 'Never';

      return [
        `"${p.name}"`,
        p.sku,
        p.category,
        p.stock,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        profit.toFixed(2),
        totalValue.toFixed(2),
        status,
        p.unitsSold30d,
        lastSale,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('✅ Inventory exported successfully!');
  };

  // Import from CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      const importedProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const product: any = { id: `import-${Date.now()}-${i}` };
        
        headers.forEach((header, index) => {
          const value = values[index];
          switch (header.toLowerCase()) {
            case 'product name':
            case 'name':
              product.name = value;
              break;
            case 'sku':
              product.sku = value;
              break;
            case 'category':
              product.category = value;
              break;
            case 'stock':
              product.stock = parseInt(value) || 0;
              break;
            case 'cost price':
            case 'cost':
              product.costPrice = parseFloat(value) || 0;
              break;
            case 'selling price':
            case 'price':
              product.sellingPrice = parseFloat(value) || 0;
              break;
          }
        });

        if (product.name) {
          importedProducts.push(product as Product);
        }
      }

      // Add imported products to Supabase
      const addImportedProducts = async () => {
        try {
          const effectiveBusinessId = user?.businessId || businessId || '';
          if (!effectiveBusinessId) {
            showToast('No business linked to this account');
            return;
          }
          for (const product of importedProducts) {
            await sbAddDoc(`businesses/${effectiveBusinessId}/products`, {
              ...product,
              id: crypto.randomUUID(),
              status: 'active',
              createdAt: new Date(),
              lowStockThreshold: 10,
            });
          }
          setProducts(prev => [...prev, ...importedProducts]);
          showToast(`✅ ${importedProducts.length} products imported successfully!`);
          setShowImportModal(false);
        } catch (error) {
          console.error('Error importing products:', error);
          showToast('❌ Error importing products');
        }
      };

      addImportedProducts();
    };

    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="inv-page">
        <div className="inv-empty-state">
          <div className="inv-empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="24" cy="24" r="20" strokeDasharray="60" strokeDashoffset="20">
                <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <h3>Loading Inventory...</h3>
          <p>Please wait while we fetch your products</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inv-page">
      {/* ── Page Header ── */}
      <div className="inv-page-header">
        <div className="inv-page-title-wrap">
          <h1 className="inv-page-title">{t('inventory.title')}</h1>
          <p className="inv-page-sub">{t('inventory.subtitle')}</p>
        </div>
        <div className="inv-header-actions">
          {(isProUser && branches.length > 1) || businessCategory.includes('retail') || businessCategory.includes('wholesale') || businessCategory.includes('distributor') ? (
            <button className="btn bsm bgh" onClick={() => setShowTransferModal(true)} disabled={products.length === 0}>
              <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6.5h9M6.5 2v9"/>
              </svg>
              Transfer Stock
            </button>
          ) : null}
          <button className="btn bsm bgh" onClick={handleExportCSV} disabled={products.length === 0}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 3h11M1 6.5h7M1 10h4"/>
            </svg>
            {t('inventory.exportCsv')}
          </button>
          <button className="btn bsm bgh" onClick={() => setShowImportModal(true)}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6.5 2v9M2 6.5h9"/>
            </svg>
            Import CSV
          </button>
          <button className="btn bsm bpr" onClick={() => setShowAddModal(true)}>
            <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6.5 2v9M2 6.5h9"/>
            </svg>
            {t('inventory.addProduct')}
          </button>
        </div>
      </div>

      {error && (
        <div className="inv-error-banner">
          <strong>Inventory load failed:</strong> {error}
        </div>
      )}

      {/* ── 1. Overview Cards ── */}
      <section className="inv-section">
        <InventoryOverviewCards products={products} />
      </section>

      {/* ── 2. Low Stock Panel ── */}
      <section className="inv-section">
        {products.length === 0 ? (
          <div className="inv-section-empty">
            <svg className="inv-empty-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(244,165,53,.12)" strokeWidth="1.5" strokeDasharray="6,4"/>
              {/* empty shelf */}
              <rect x="18" y="72" width="84" height="5" rx="2.5" fill="rgba(255,255,255,.08)"/>
              <rect x="18" y="52" width="84" height="5" rx="2.5" fill="rgba(255,255,255,.06)"/>
              {/* faint dashed outlines of missing products */}
              <rect x="24" y="56" width="20" height="16" rx="3" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeDasharray="3,3"/>
              <rect x="50" y="56" width="20" height="16" rx="3" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeDasharray="3,3"/>
              <rect x="76" y="56" width="20" height="16" rx="3" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeDasharray="3,3"/>
              {/* Mo looking around with magnifier */}
              <circle cx="60" cy="36" r="13" fill="#F5C9A0"/>
              <path d="M47 32 C47 23 73 23 73 32 L73 28 C73 20 47 20 47 28 Z" fill="#2C1A0E"/>
              <circle cx="54" cy="35" r="3" fill="#1A2B3C"/>
              <circle cx="66" cy="35" r="3" fill="#1A2B3C"/>
              <circle cx="55" cy="33.8" r="1" fill="white"/>
              <circle cx="67" cy="33.8" r="1" fill="white"/>
              <path d="M54 41 Q60 45 66 41" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              {/* magnifier */}
              <circle cx="82" cy="22" r="9" fill="none" stroke="#F4A535" strokeWidth="2.5"/>
              <circle cx="82" cy="22" r="6" fill="rgba(244,165,53,.1)"/>
              <line x1="89" y1="29" x2="95" y2="35" stroke="#F4A535" strokeWidth="2.5" strokeLinecap="round"/>
              {/* arm holding magnifier */}
              <path d="M73 40 Q78 32 82 26" stroke="#F5C9A0" strokeWidth="4" strokeLinecap="round" fill="none"/>
              {/* other arm */}
              <path d="M47 40 Q42 42 38 48" stroke="#F5C9A0" strokeWidth="4" strokeLinecap="round" fill="none"/>
              {/* question marks on shelves */}
              <text x="30" y="68" fontSize="10" fill="rgba(244,165,53,.3)" textAnchor="middle">?</text>
              <text x="60" y="68" fontSize="10" fill="rgba(244,165,53,.3)" textAnchor="middle">?</text>
              <text x="86" y="68" fontSize="10" fill="rgba(244,165,53,.3)" textAnchor="middle">?</text>
            </svg>
            <h4>No Products Yet</h4>
            <p>Start by adding your first product to track inventory, sales, and stock levels</p>
            <button className="inv-add-first-btn" onClick={() => setShowAddModal(true)}>
              <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6.5 2v9M2 6.5h9"/>
              </svg>
              Add Your First Product
            </button>
          </div>
        ) : (
          <LowStockPanel
            products={products}
            onProductClick={setSelected}
          />
        )}
      </section>

      {/* ── 3. Inventory Table ── */}
      <section className="inv-section">
        {products.length === 0 ? (
          <div className="inv-section-empty">
            <svg className="inv-empty-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
              {/* empty cart */}
              <path d="M22 38 L30 38 L38 70 L82 70 L90 50 L34 50" stroke="rgba(255,255,255,.12)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="42" cy="76" r="4" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2"/>
              <circle cx="76" cy="76" r="4" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2"/>
              {/* Mo sitting in cart */}
              <circle cx="62" cy="52" r="13" fill="#F5C9A0"/>
              <path d="M49 48 C49 39 75 39 75 48 L75 44 C75 36 49 36 49 44 Z" fill="#2C1A0E"/>
              <circle cx="56" cy="51" r="2.8" fill="#1A2B3C"/>
              <circle cx="68" cy="51" r="2.8" fill="#1A2B3C"/>
              <path d="M55 57 Q62 60 69 57" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              {/* shrug arms */}
              <path d="M49 56 Q44 54 42 50" stroke="#F5C9A0" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="41" cy="49" r="3.5" fill="#F5C9A0"/>
              <path d="M75 56 Q80 54 82 50" stroke="#F5C9A0" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="83" cy="49" r="3.5" fill="#F5C9A0"/>
              {/* price tags floating */}
              <rect x="14" y="20" width="18" height="12" rx="3" fill="rgba(29,185,84,.15)" stroke="rgba(29,185,84,.3)" strokeWidth="1"/>
              <circle cx="16" cy="23" r="1.5" fill="#1DB954" opacity=".5"/>
              <rect x="88" y="22" width="18" height="12" rx="3" fill="rgba(29,185,84,.15)" stroke="rgba(29,185,84,.3)" strokeWidth="1"/>
              <circle cx="90" cy="25" r="1.5" fill="#1DB954" opacity=".5"/>
            </svg>
            <h4>No Inventory Items</h4>
            <p>Your inventory table is empty. Start by adding your first product!</p>
            <button className="inv-add-product-btn" onClick={() => setShowAddModal(true)}>
              + Add Product
            </button>
          </div>
        ) : (
          <InventoryTable
            products={products}
            onProductClick={setSelected}
            onDeleteProduct={handleDeleteProduct}
            onDeactivateProduct={handleDeactivateProduct}
          />
        )}
      </section>

      {/* ── 4. Dead Stock Intelligence ── */}
      <section className="inv-section">
        {products.length === 0 ? (
          <div className="inv-section-empty">
            <div className="inv-section-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M24 4L4 14v20l20 10 20-10V14L24 4z"/>
                <path d="M24 4v40"/>
                <path d="M4 14l20 10 20-10"/>
                <path d="M4 34l20 10"/>
              </svg>
            </div>
            <h4>No Dead Stock Data</h4>
            <p>Once you add products, we'll help you identify slow-moving items</p>
          </div>
        ) : (
          <DeadStockInsights
            products={products}
            onProductClick={setSelected}
          />
        )}
      </section>

      {/* ── 5. Product Detail Modal ── */}
      {selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
          onSave={updated => {
            handleProductUpdate(updated);
            setSelected(updated);
          }}
        />
      )}

      {/* ── 6. Add Product Modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <AddProductPage
              onClose={() => setShowAddModal(false)}
              onProductAdded={(newProduct) => {
                setProducts(prev => [...prev, newProduct]);
                setShowAddModal(false);
                showToast('✅ Product added successfully!');
              }}
            />
          </div>
        </div>
      )}

      {/* ── 7. Import CSV Modal ── */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content csv-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Import Products from CSV</h2>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="csv-modal-description">
                Upload a CSV file with the following columns: Product Name, SKU, Category, Stock, Cost Price, Selling Price
              </p>
              <div className="csv-modal-example">
                <strong>Example CSV format:</strong><br/>
                Product Name,SKU,Category,Stock,Cost Price,Selling Price<br/>
                "Indomie","IND001","Food",50,2500,3500
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="csv-modal-input"
              />
              <div className="csv-modal-actions">
                <button className="csv-modal-btn" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Product Transfer Modal ── */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content csv-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Transfer Stock</h2>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="csv-modal-description">
                Transfer stock between warehouse locations or branches.
              </p>
              
              {/* Transfer Type Selection */}
              {(isProUser && branches.length > 1) && (businessCategory.includes('retail') || businessCategory.includes('wholesale') || businessCategory.includes('distributor')) ? (
                <div className="csv-modal-example">
                  <label className="csv-modal-label">Transfer Type:</label>
                  <select 
                    className="csv-modal-input"
                    value={transferType}
                    onChange={(e) => setTransferType(e.target.value as 'branch' | 'warehouse')}
                  >
                    <option value="warehouse">Between Warehouse Locations</option>
                    <option value="branch">Between Branches</option>
                  </select>
                </div>
              ) : null}
              
              <div className="csv-modal-example">
                <label className="csv-modal-label">Select Product:</label>
                <select 
                  className="csv-modal-input"
                  value={selectedProductForTransfer?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProductForTransfer(product || null);
                    setTransferQuantity(1);
                  }}
                >
                  <option value="">-- Select a product --</option>
                  {products.filter(p => p.stock > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductForTransfer && (
                <>
                  <div className="csv-modal-example">
                    <label className="csv-modal-label">Transfer Quantity:</label>
                    <input
                      type="number"
                      className="csv-modal-input"
                      min="1"
                      max={selectedProductForTransfer.stock}
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
                    />
                    <small>Available: {selectedProductForTransfer.stock} units</small>
                  </div>

                  {transferType === 'warehouse' ? (
                    <>
                      <div className="csv-modal-example">
                        <label className="csv-modal-label">Source Location:</label>
                        <select 
                          className="csv-modal-input"
                          value={sourceLocation}
                          onChange={(e) => setSourceLocation(e.target.value)}
                          disabled={stockLocations.length === 0}
                        >
                          {stockLocations.length === 0 ? (
                            <option value="">No locations available</option>
                          ) : (
                            stockLocations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))
                          )}
                        </select>
                        {stockLocations.length === 0 && (
                          <small>Create warehouse locations in the Warehouse page first</small>
                        )}
                      </div>

                      <div className="csv-modal-example">
                        <label className="csv-modal-label">Target Location:</label>
                        <select 
                          className="csv-modal-input"
                          value={targetLocation}
                          onChange={(e) => setTargetLocation(e.target.value)}
                          disabled={stockLocations.length === 0}
                        >
                          {stockLocations.length === 0 ? (
                            <option value="">No locations available</option>
                          ) : (
                            stockLocations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="csv-modal-example">
                      <label className="csv-modal-label">Target Branch:</label>
                      <select 
                        className="csv-modal-input"
                        value={targetBranchId}
                        onChange={(e) => setTargetBranchId(e.target.value)}
                      >
                        <option value="">-- Select target branch --</option>
                        {branches.filter(b => b.id !== selectedBranchId).map(branch => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="csv-modal-actions">
                    <button 
                      className="csv-modal-btn" 
                      onClick={() => setShowTransferModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="csv-modal-btn csv-modal-btn-primary"
                      onClick={() => {
                        if (selectedProductForTransfer) {
                          const target = transferType === 'warehouse' ? targetLocation : targetBranchId;
                          if (target) {
                            handleProductTransfer(selectedProductForTransfer, target, transferQuantity, transferType);
                          }
                        }
                      }}
                      disabled={
                        (transferType === 'warehouse' ? !targetLocation : !targetBranchId) || 
                        transferQuantity <= 0 || 
                        transferQuantity > selectedProductForTransfer?.stock
                      }
                    >
                      Transfer Stock
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;

