'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, addDoc, doc, getDoc, runTransaction, Timestamp, orderBy } from 'firebase/firestore';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import styles from './StockTransfersPage.module.css';

interface Product {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  stockByLocation?: {
    main_store: number;
    back_store: number;
    warehouse: number;
    [key: string]: number;
  };
  costPrice: number;
  imageUrl?: string;
}

interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
}

interface TransferRecord {
  id: string;
  transferNumber: string;
  items: TransferItem[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export function StockTransfersPage() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId, branches } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessReason, setAccessReason] = useState('');

  useEffect(() => {
    checkWarehouseAccess();
  }, [user]);

  const checkWarehouseAccess = async () => {
    if (!user?.id) return;
    
    const accessResult = await checkFeatureAccess(user.id, 'warehouseManagement');
    if (!accessResult.eligible) {
      setHasAccess(false);
      setAccessReason(accessResult.reason || 'This feature is not available for your plan');
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Not Available</h3>
          <p className="text-gray-600">{accessReason}</p>
        </div>
      </div>
    );
  }
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState('');
  const [fromLocation, setFromLocation] = useState<string>('main_store');
  const [toLocation, setToLocation] = useState<string>('warehouse');
  const [notes, setNotes] = useState('');

  const locations = [
    { id: 'main_store', name: 'Main Store' },
    { id: 'back_store', name: 'Back Store' },
    { id: 'warehouse', name: 'Warehouse' },
    ...branches.map(b => ({ id: b.id, name: b.name })),
  ];

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
        const stockByLocation = data.stockByLocation || {
          main_store: data.stock || 0,
          back_store: 0,
          warehouse: 0,
        };
        
        productsList.push({
          id: doc.id,
          name: data.name || '',
          sku: data.attributes?.sku || '',
          stock: data.stock || 0,
          stockByLocation,
          costPrice: data.cost || 0,
          imageUrl: data.imageUrl || '',
        });
      });
      
      setProducts(productsList);
      
      // Load transfer history
      const transfersQuery = query(
        collection(firestore, 'businesses', businessId, 'stockTransfers'),
        orderBy('createdAt', 'desc')
      );
      
      const transfersSnapshot = await getDocs(transfersQuery);
      const transfersList: TransferRecord[] = [];
      
      transfersSnapshot.forEach(doc => {
        const data = doc.data();
        transfersList.push({
          id: doc.id,
          transferNumber: data.transferNumber,
          items: data.items || [],
          status: data.status,
          createdAt: data.createdAt,
          completedAt: data.completedAt,
        });
      });
      
      setTransferHistory(transfersList);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('❌ Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableStock = (productId: string, location: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.stockByLocation) return 0;
    return product.stockByLocation[location] || 0;
  };

  const handleAddTransferItem = () => {
    if (!selectedProduct) {
      showToast('⚠️ Please select a product');
      return;
    }
    
    const quantity = parseInt(transferQuantity) || 0;
    const availableStock = getAvailableStock(selectedProduct, fromLocation);
    
    if (quantity <= 0) {
      showToast('⚠️ Please enter a valid quantity');
      return;
    }
    
    if (quantity > availableStock) {
      showToast(`⚠️ Only ${availableStock} units available in ${locations.find(l => l.id === fromLocation)?.name}`);
      return;
    }
    
    if (fromLocation === toLocation) {
      showToast('⚠️ Source and destination cannot be the same');
      return;
    }
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Check if product already exists in transfer
    const existingIndex = transferItems.findIndex(
      item => item.productId === selectedProduct && 
               item.fromLocation === fromLocation && 
               item.toLocation === toLocation
    );
    
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...transferItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
      setTransferItems(updated);
    } else {
      // Add new
      setTransferItems([...transferItems, {
        productId: selectedProduct,
        productName: product.name,
        quantity,
        fromLocation,
        toLocation,
      }]);
    }
    
    // Reset form
    setSelectedProduct('');
    setTransferQuantity('');
  };

  const handleRemoveTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleSubmitTransfer = async () => {
    if (transferItems.length === 0) {
      showToast('⚠️ Please add at least one item to transfer');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsSubmitting(false);
        return;
      }

      // Generate transfer number
      const year = new Date().getFullYear();
      const transferNumber = `TRF-${year}-${Date.now().toString().slice(-5)}`;
      
      await runTransaction(firestore, async (transaction) => {
        // Create transfer record
        const transferRef = doc(collection(firestore, 'businesses', businessId, 'stockTransfers'));
        transaction.set(transferRef, {
          transferNumber,
          items: transferItems,
          status: 'completed',
          transferredBy: user.id,
          transferredByName: user.name || user.email || 'Unknown',
          notes: notes.trim() || undefined,
          createdAt: Timestamp.now(),
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        // Update product stock
        for (const item of transferItems) {
          const productRef = doc(firestore, 'businesses', businessId, 'products', item.productId);
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const productData = productDoc.data();
            const stockByLocation = productData.stockByLocation || {
              main_store: 0,
              back_store: 0,
              warehouse: 0,
            };
            
            // Deduct from source
            const sourceStock = stockByLocation[item.fromLocation] || 0;
            stockByLocation[item.fromLocation] = Math.max(0, sourceStock - item.quantity);
            
            // Add to destination
            const destStock = stockByLocation[item.toLocation] || 0;
            stockByLocation[item.toLocation] = destStock + item.quantity;
            
            // Update total stock
            const currentTotal = productData.stock || 0;
            
            transaction.update(productRef, {
              stock: currentTotal, // Total remains the same
              stockByLocation,
              updatedAt: Timestamp.now(),
            });
          }
        }
      });
      
      showToast('✅ Stock transferred successfully');
      
      // Reset form
      setTransferItems([]);
      setNotes('');
      setSelectedProduct('');
      setTransferQuantity('');
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error transferring stock:', error);
      showToast('❌ Failed to transfer stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || locationId;
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Move Stock</h2>
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
          <h2 className={styles.pageTitle}>Move Stock</h2>
          <p className={styles.pageDesc}>Transfer stock between locations</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Transfer Form */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>New Transfer</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Product</label>
            <select
              className={styles.select}
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">-- Select product --</option>
              {products
                .filter(p => p.stock > 0)
                .map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku && `(${product.sku})`} - {product.stock} total
                  </option>
                ))}
            </select>
          </div>
          
          <div className={styles.row2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>From</label>
              <select
                className={styles.select}
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <small className={styles.hint}>
                  Available: {getAvailableStock(selectedProduct, fromLocation)} units
                </small>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>To</label>
              <select
                className={styles.select}
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
              >
                {locations
                  .filter(l => l.id !== fromLocation)
                  .map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Quantity</label>
            <input
              type="number"
              className={styles.input}
              placeholder="0"
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(e.target.value)}
              min="1"
              max={selectedProduct ? getAvailableStock(selectedProduct, fromLocation) : undefined}
            />
          </div>
          
          <button
            className={styles.addButton}
            onClick={handleAddTransferItem}
            disabled={!selectedProduct || !transferQuantity || fromLocation === toLocation}
          >
            + Add to Transfer
          </button>
        </div>

        {/* Transfer Items */}
        {transferItems.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Transfer Items ({transferItems.length})</h3>
            
            <div className={styles.itemsList}>
              {transferItems.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.productName}</div>
                    <div className={styles.itemDetails}>
                      {item.quantity} units
                    </div>
                    <div className={styles.itemRoute}>
                      {getLocationName(item.fromLocation)} → {getLocationName(item.toLocation)}
                    </div>
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveTransferItem(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Notes (optional)</label>
              <textarea
                className={styles.textarea}
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            
            <button
              className={styles.submitButton}
              onClick={handleSubmitTransfer}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Transferring...' : `Complete Transfer (${transferItems.length} items)`}
            </button>
          </div>
        )}

        {/* Transfer History */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Recent Transfers</h3>
          
          {transferHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No transfers yet</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {transferHistory.slice(0, 10).map(transfer => (
                <div key={transfer.id} className={styles.historyCard}>
                  <div className={styles.historyHeader}>
                    <span className={styles.historyNumber}>{transfer.transferNumber}</span>
                    <span className={`${styles.statusBadge} ${styles[transfer.status]}`}>
                      {transfer.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.historyDetails}>
                    <div className={styles.historyItem}>
                      <span className={styles.historyLabel}>Items:</span>
                      <span className={styles.historyValue}>{transfer.items.length}</span>
                    </div>
                    <div className={styles.historyItem}>
                      <span className={styles.historyLabel}>Date:</span>
                      <span className={styles.historyValue}>{formatDate(transfer.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.historyItems}>
                    {transfer.items.slice(0, 3).map((item, index) => (
                      <div key={index} className={styles.historyItemLine}>
                        {item.quantity} × {item.productName}
                      </div>
                    ))}
                    {transfer.items.length > 3 && (
                      <div className={styles.historyItemLine}>
                        +{transfer.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

