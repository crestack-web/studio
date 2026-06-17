'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc, runTransaction, Timestamp } from 'firebase/firestore';
import styles from './ReceiveStockPage.module.css';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
}

interface ReceiptItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  location: 'main_store' | 'back_store' | 'warehouse';
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export function ReceiveStockPage() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<'main_store' | 'back_store' | 'warehouse'>('main_store');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  
  // Add item form
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnitCost, setItemUnitCost] = useState('');
  const [itemLocation, setItemLocation] = useState<'main_store' | 'back_store' | 'warehouse'>('main_store');

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
        productsList.push({
          id: doc.id,
          name: data.name || '',
          sku: data.attributes?.sku || '',
          category: data.category || '',
          stock: data.stock || 0,
          costPrice: data.cost || 0,
          sellingPrice: data.price || 0,
          imageUrl: data.imageUrl || '',
        });
      });
      
      setProducts(productsList);
      
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
          email: data.email,
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

  const handleAddItem = () => {
    if (!selectedProduct) {
      showToast('⚠️ Please select a product');
      return;
    }
    
    const quantity = parseInt(itemQuantity) || 0;
    const unitCost = parseFloat(itemUnitCost) || 0;
    
    if (quantity <= 0) {
      showToast('⚠️ Please enter a valid quantity');
      return;
    }
    
    if (unitCost <= 0) {
      showToast('⚠️ Please enter a valid unit cost');
      return;
    }
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Check if product already exists in receipt
    const existingItemIndex = receiptItems.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...receiptItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        totalCost: (updatedItems[existingItemIndex].quantity + quantity) * unitCost,
        unitCost,
        location: itemLocation,
      };
      setReceiptItems(updatedItems);
    } else {
      // Add new item
      setReceiptItems([...receiptItems, {
        productId: selectedProduct,
        productName: product.name,
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
        location: itemLocation,
      }]);
    }
    
    // Reset form
    setSelectedProduct('');
    setItemQuantity('');
    setItemUnitCost('');
    setItemLocation('main_store');
  };

  const handleRemoveItem = (index: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (receiptItems.length === 0) {
      showToast('⚠️ Please add at least one product');
      return;
    }
    
    if (!selectedSupplier && !newSupplierName.trim()) {
      showToast('⚠️ Please select or enter a supplier');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsSubmitting(false);
        return;
      }

      let supplierId = selectedSupplier;
      let supplierName = suppliers.find(s => s.id === selectedSupplier)?.name || '';
      
      // Create new supplier if needed
      if (newSupplierName.trim()) {
        const supplierRef = await addDoc(collection(firestore, 'businesses', businessId, 'suppliers'), {
          name: newSupplierName.trim(),
          productsSupplied: [],
          totalAmountSpent: 0,
          lastSupplyDate: Timestamp.now(),
          supplyCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          active: true,
        });
        
        supplierId = supplierRef.id;
        supplierName = newSupplierName.trim();
      }
      
      // Generate receipt number
      const year = new Date().getFullYear();
      const receiptNumber = `REC-${year}-${Date.now().toString().slice(-5)}`;
      
      const totalQuantity = receiptItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = receiptItems.reduce((sum, item) => sum + item.totalCost, 0);
      const paid = parseFloat(paidAmount) || totalCost;
      const credit = paymentMethod === 'credit' ? totalCost - paid : 0;
      
      // Create stock receipt
      await runTransaction(firestore, async (transaction) => {
        // Add stock receipt
        const receiptRef = doc(collection(firestore, 'businesses', businessId, 'stockReceipts'));
        transaction.set(receiptRef, {
          receiptNumber,
          supplierId,
          supplierName,
          items: receiptItems,
          totalQuantity,
          totalCost,
          receivedAt: selectedLocation,
          paymentMethod,
          paidAmount: paid,
          creditAmount: credit,
          receivedBy: user.id,
          receivedByName: user.name || user.email || 'Unknown',
          notes: notes.trim() || undefined,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        // Update supplier
        const supplierRef = doc(firestore, 'businesses', businessId, 'suppliers', supplierId);
        const supplierDoc = await transaction.get(supplierRef);
        
        if (supplierDoc.exists()) {
          const supplierData = supplierDoc.data();
          const productsSupplied = supplierData.productsSupplied || [];
          
          // Add new products to supplier's list
          receiptItems.forEach(item => {
            if (!productsSupplied.includes(item.productId)) {
              productsSupplied.push(item.productId);
            }
          });
          
          transaction.update(supplierRef, {
            productsSupplied,
            totalAmountSpent: (supplierData.totalAmountSpent || 0) + totalCost,
            lastSupplyDate: Timestamp.now(),
            supplyCount: (supplierData.supplyCount || 0) + 1,
            outstandingBalance: paymentMethod === 'credit' ? (supplierData.outstandingBalance || 0) + credit : supplierData.outstandingBalance,
            updatedAt: Timestamp.now(),
          });
        }
        
        // Update product stock and supplier info
        for (const item of receiptItems) {
          const productRef = doc(firestore, 'businesses', businessId, 'products', item.productId);
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const productData = productDoc.data();
            const currentStock = productData.stock || 0;
            const stockByLocation = productData.stockByLocation || {
              main_store: 0,
              back_store: 0,
              warehouse: 0,
            };
            
            // Update stock by location
            stockByLocation[item.location] = (stockByLocation[item.location] || 0) + item.quantity;
            
            // Update suppliers list
            const suppliers = productData.suppliers || [];
            const existingSupplierIndex = suppliers.findIndex((s: any) => s.supplierId === supplierId);
            
            if (existingSupplierIndex >= 0) {
              suppliers[existingSupplierIndex] = {
                ...suppliers[existingSupplierIndex],
                lastSupplyDate: Timestamp.now(),
                lastUnitCost: item.unitCost,
              };
            } else {
              suppliers.push({
                supplierId,
                supplierName,
                lastSupplyDate: Timestamp.now(),
                lastUnitCost: item.unitCost,
              });
            }
            
            transaction.update(productRef, {
              stock: currentStock + item.quantity,
              stockByLocation,
              cost: item.unitCost, // Update cost to latest
              suppliers,
              preferredSupplierId: supplierId, // Set as preferred if first supplier
              updatedAt: Timestamp.now(),
            });
          }
        }
      });
      
      showToast('✅ Stock received successfully');
      
      // Reset form
      setSelectedSupplier('');
      setNewSupplierName('');
      setSelectedLocation('main_store');
      setPaymentMethod('cash');
      setPaidAmount('');
      setNotes('');
      setReceiptItems([]);
      setSelectedProduct('');
      setItemQuantity('');
      setItemUnitCost('');
      setItemLocation('main_store');
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error receiving stock:', error);
      showToast('❌ Failed to receive stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Receive Stock</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  const totalCost = receiptItems.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Receive Stock</h2>
          <p className={styles.pageDesc}>Record incoming stock from suppliers</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Supplier Section */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Supplier</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Supplier</label>
            <select
              className={styles.select}
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                setNewSupplierName('');
              }}
            >
              <option value="">-- Select supplier --</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.divider}>or add new</div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>New Supplier Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g., ABC Distributors"
              value={newSupplierName}
              onChange={(e) => {
                setNewSupplierName(e.target.value);
                setSelectedSupplier('');
              }}
            />
          </div>
        </div>

        {/* Add Products Section */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Add Products</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Product</label>
            <select
              className={styles.select}
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">-- Select product --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.sku && `(${product.sku})`}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.row2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity</label>
              <input
                type="number"
                className={styles.input}
                placeholder="0"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                min="1"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Unit Cost ({currency.symbol})</label>
              <input
                type="number"
                className={styles.input}
                placeholder="0.00"
                value={itemUnitCost}
                onChange={(e) => setItemUnitCost(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Location</label>
            <select
              className={styles.select}
              value={itemLocation}
              onChange={(e) => setItemLocation(e.target.value as any)}
            >
              <option value="main_store">Main Store</option>
              <option value="back_store">Back Store</option>
              <option value="warehouse">Warehouse</option>
            </select>
          </div>
          
          <button
            className={styles.addButton}
            onClick={handleAddItem}
            disabled={!selectedProduct || !itemQuantity || !itemUnitCost}
          >
            + Add to Receipt
          </button>
        </div>

        {/* Receipt Items */}
        {receiptItems.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Receipt Items ({receiptItems.length})</h3>
            
            <div className={styles.itemsList}>
              {receiptItems.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.productName}</div>
                    <div className={styles.itemDetails}>
                      {item.quantity} × {formatMoney(item.unitCost)} = {formatMoney(item.totalCost)}
                    </div>
                    <div className={styles.itemLocation}>
                      Location: {item.location.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveItem(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div className={styles.totalRow}>
              <span>Total:</span>
              <span className={styles.totalAmount}>{formatMoney(totalCost)}</span>
            </div>
          </div>
        )}

        {/* Payment & Location */}
        {receiptItems.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Payment & Location</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Default Location for This Receipt</label>
              <select
                className={styles.select}
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as any)}
              >
                <option value="main_store">Main Store</option>
                <option value="back_store">Back Store</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Payment Method</label>
              <select
                className={styles.select}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            
            {paymentMethod === 'credit' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Amount Paid Now ({currency.symbol})</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder={totalCost.toString()}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <small className={styles.hint}>
                  Credit: {formatMoney(totalCost - (parseFloat(paidAmount) || 0))}
                </small>
              </div>
            )}
            
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
          </div>
        )}

        {/* Submit Button */}
        {receiptItems.length > 0 && (
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting || (!selectedSupplier && !newSupplierName.trim())}
          >
            {isSubmitting ? 'Receiving Stock...' : `Receive Stock - ${formatMoney(totalCost)}`}
          </button>
        )}
      </div>
    </div>
  );
}
