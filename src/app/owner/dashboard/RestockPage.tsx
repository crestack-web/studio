'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import styles from './RestockPage.module.css';

interface Product {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  suppliers?: Array<{
    supplierId: string;
    supplierName: string;
    lastSupplyDate: any;
    lastUnitCost: number;
  }>;
  preferredSupplierId?: string;
  unitsSold30d?: number;
  imageUrl?: string;
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
}

interface RestockItem {
  product: Product;
  suggestedQuantity: number;
  supplier: Supplier | null;
}

export function RestockPage() {
  const { showToast } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [businessId, firestore]);

  const loadData = async () => {
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load products
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('active', '==', true)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      const productsList: Product[] = [];
      
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        const stock = data.stock || 0;
        const lowStockThreshold = data.lowStockThreshold || 10;
        
        // Only include products that are running low
        if (stock <= lowStockThreshold) {
          productsList.push({
            id: doc.id,
            name: data.name || '',
            sku: data.attributes?.sku || '',
            stock,
            lowStockThreshold,
            costPrice: data.cost || 0,
            sellingPrice: data.price || 0,
            suppliers: data.suppliers || [],
            preferredSupplierId: data.preferredSupplierId,
            unitsSold30d: data.unitsSold30d || 0,
            imageUrl: data.imageUrl || '',
          });
        }
      });
      
      // Sort by stock level (lowest first)
      productsList.sort((a, b) => a.stock - b.stock);
      
      setLowStockProducts(productsList);
      
      // Load suppliers
      const suppliersQuery = query(
        collection(firestore, 'businesses', businessId, 'suppliers'),
        where('active', '==', true)
      );
      
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersList: Supplier[] = [];
      
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        suppliersList.push({
          id: doc.id,
          name: data.name || '',
          phone: data.phone,
        });
      });
      
      setSuppliers(suppliersList);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('❌ Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSuggestedQuantity = (product: Product): number => {
    // Calculate based on 30-day sales history
    const monthlySales = product.unitsSold30d || 0;
    
    if (monthlySales === 0) {
      // Default to 2x low stock threshold if no sales data
      return product.lowStockThreshold * 2;
    }
    
    // Suggest enough for 30 days + buffer
    const dailySales = monthlySales / 30;
    const suggestedQuantity = Math.ceil(dailySales * 30) + product.lowStockThreshold;
    
    return Math.max(suggestedQuantity, product.lowStockThreshold * 2);
  };

  const getBestSupplier = (product: Product): Supplier | null => {
    // Use preferred supplier if available
    if (product.preferredSupplierId) {
      const supplier = suppliers.find(s => s.id === product.preferredSupplierId);
      if (supplier) return supplier;
    }
    
    // Use most recent supplier
    if (product.suppliers && product.suppliers.length > 0) {
      const mostRecent = product.suppliers.reduce((a, b) => {
        const dateA = a.lastSupplyDate?.toDate?.() || new Date(0);
        const dateB = b.lastSupplyDate?.toDate?.() || new Date(0);
        return dateA > dateB ? a : b;
      });
      
      const supplier = suppliers.find(s => s.id === mostRecent.supplierId);
      if (supplier) return supplier;
    }
    
    return null;
  };

  const handleRestockClick = (product: Product) => {
    const suggestedQuantity = calculateSuggestedQuantity(product);
    const supplier = getBestSupplier(product);
    
    const restockItem: RestockItem = {
      product,
      suggestedQuantity,
      supplier,
    };
    
    // Check if already in restock items
    const existingIndex = restockItems.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...restockItems];
      updated[existingIndex] = restockItem;
      setRestockItems(updated);
    } else {
      // Add new
      setRestockItems([...restockItems, restockItem]);
    }
  };

  const handleRemoveFromRestock = (productId: string) => {
    setRestockItems(restockItems.filter(item => item.product.id !== productId));
  };

  const handleGenerateMessage = () => {
    if (restockItems.length === 0) {
      showToast('⚠️ Please add items to restock first');
      return;
    }
    
    // Group by supplier
    const groupedBySupplier = new Map<string, RestockItem[]>();
    
    restockItems.forEach(item => {
      const supplierId = item.supplier?.id || 'unknown';
      if (!groupedBySupplier.has(supplierId)) {
        groupedBySupplier.set(supplierId, []);
      }
      groupedBySupplier.get(supplierId)?.push(item);
    });
    
    // Generate message for each supplier
    let message = '';
    
    groupedBySupplier.forEach((items, supplierId) => {
      const supplier = items[0].supplier;
      const supplierName = supplier?.name || 'Supplier';
      
      message += `Hello ${supplierName},\n\n`;
      message += `We would like to restock the following items:\n\n`;
      
      items.forEach(item => {
        message += `${item.suggestedQuantity} ${item.product.name}\n`;
      });
      
      message += `\n`;
      
      const totalCost = items.reduce((sum, item) => sum + (item.suggestedQuantity * item.product.costPrice), 0);
      message += `Estimated total: ${formatMoney(totalCost)}\n\n`;
      message += `Please confirm availability and delivery timeline.\n\n`;
      message += `Thank you.\n`;
      message += `---\n\n`;
    });
    
    setGeneratedMessage(message);
    setShowShareModal(true);
  };

  const handleWhatsAppShare = () => {
    const encodedMessage = encodeURIComponent(generatedMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSMSShare = () => {
    // Note: SMS sharing requires a phone number
    // This is a placeholder - in production, you'd need to integrate with an SMS service
    showToast('📱 SMS integration coming soon');
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      showToast('✅ Message copied to clipboard');
    } catch (error) {
      showToast('❌ Failed to copy message');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Restock</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Restock</h2>
          <p className={styles.pageDesc}>Products running low - quick reorder</p>
        </div>
        {restockItems.length > 0 && (
          <button
            className={styles.generateButton}
            onClick={handleGenerateMessage}
          >
            Generate Order Message ({restockItems.length})
          </button>
        )}
      </div>

      {/* Low Stock Products */}
      {lowStockProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <h3>All Stock Levels Healthy</h3>
          <p>No products are running low</p>
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Running Low ({lowStockProducts.length})</h3>
            <div className={styles.productsGrid}>
              {lowStockProducts.map(product => {
                const isInRestock = restockItems.some(item => item.product.id === product.id);
                const suggestedQuantity = calculateSuggestedQuantity(product);
                const supplier = getBestSupplier(product);
                
                return (
                  <div key={product.id} className={styles.productCard}>
                    <div className={styles.productHeader}>
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt="" className={styles.productImage} />
                      )}
                      <div className={styles.productInfo}>
                        <h4 className={styles.productName}>{product.name}</h4>
                        {product.sku && (
                          <span className={styles.productSku}>{product.sku}</span>
                        )}
                      </div>
                      <div className={`${styles.stockBadge} ${product.stock === 0 ? styles.outOfStock : styles.lowStock}`}>
                        {product.stock} left
                      </div>
                    </div>
                    
                    <div className={styles.productDetails}>
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Threshold:</span>
                        <span className={styles.detailValue}>{product.lowStockThreshold}</span>
                      </div>
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Suggested:</span>
                        <span className={styles.detailValue}>{suggestedQuantity}</span>
                      </div>
                      {supplier && (
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>Supplier:</span>
                          <span className={styles.detailValue}>{supplier.name}</span>
                        </div>
                      )}
                    </div>
                    
                    {isInRestock ? (
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveFromRestock(product.id)}
                      >
                        Remove from Restock
                      </button>
                    ) : (
                      <button
                        className={styles.restockButton}
                        onClick={() => handleRestockClick(product)}
                      >
                        Restock
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Restock Summary */}
          {restockItems.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Restock Summary ({restockItems.length})</h3>
              <div className={styles.summaryCard}>
                <div className={styles.summaryList}>
                  {restockItems.map(item => (
                    <div key={item.product.id} className={styles.summaryItem}>
                      <div className={styles.summaryItemInfo}>
                        <span className={styles.summaryItemName}>{item.product.name}</span>
                        <span className={styles.summaryItemQty}>{item.suggestedQuantity} units</span>
                      </div>
                      <div className={styles.summaryItemCost}>
                        {formatMoney(item.suggestedQuantity * item.product.costPrice)}
                      </div>
                      <button
                        className={styles.summaryRemoveButton}
                        onClick={() => handleRemoveFromRestock(item.product.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.summaryTotal}>
                  <span className={styles.summaryTotalLabel}>Estimated Total:</span>
                  <span className={styles.summaryTotalValue}>
                    {formatMoney(restockItems.reduce((sum, item) => sum + (item.suggestedQuantity * item.product.costPrice), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Share Order Message</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <textarea
                className={styles.messageTextarea}
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={10}
              />
              
              <div className={styles.shareButtons}>
                <button
                  className={styles.shareButton}
                  onClick={handleWhatsAppShare}
                >
                  <span className={styles.shareButtonIcon}>📱</span>
                  WhatsApp
                </button>
                <button
                  className={styles.shareButton}
                  onClick={handleSMSShare}
                >
                  <span className={styles.shareButtonIcon}>💬</span>
                  SMS
                </button>
                <button
                  className={styles.shareButton}
                  onClick={handleCopyToClipboard}
                >
                  <span className={styles.shareButtonIcon}>📋</span>
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
