'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import styles from './SuppliersPage.module.css';

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  productsSupplied: string[];
  totalAmountSpent: number;
  lastSupplyDate: Timestamp;
  supplyCount: number;
  outstandingBalance?: number;
  createdAt: Timestamp;
  active: boolean;
}

interface StockReceipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  totalQuantity: number;
  totalCost: number;
  paymentMethod: string;
  paidAmount: number;
  creditAmount?: number;
  receivedAt: string;
  receivedBy: string;
  receivedByName: string;
  notes?: string;
  createdAt: Timestamp;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  imageUrl?: string;
}

export function SuppliersPage() {
  const { showToast } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierReceipts, setSupplierReceipts] = useState<StockReceipt[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [businessId, firestore]);

  const loadSuppliers = async () => {
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const suppliersQuery = query(
        collection(firestore, 'businesses', businessId, 'suppliers'),
        where('active', '==', true),
        orderBy('totalAmountSpent', 'desc')
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
          address: data.address,
          productsSupplied: data.productsSupplied || [],
          totalAmountSpent: data.totalAmountSpent || 0,
          lastSupplyDate: data.lastSupplyDate,
          supplyCount: data.supplyCount || 0,
          outstandingBalance: data.outstandingBalance,
          createdAt: data.createdAt,
          active: data.active,
        });
      });
      
      setSuppliers(suppliersList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast('❌ Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsLoadingDetails(true);
    
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsLoadingDetails(false);
        return;
      }

      // Load stock receipts for this supplier
      const receiptsQuery = query(
        collection(firestore, 'businesses', businessId, 'stockReceipts'),
        where('supplierId', '==', supplier.id),
        orderBy('createdAt', 'desc')
      );
      
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const receiptsList: StockReceipt[] = [];
      
      receiptsSnapshot.forEach(doc => {
        const data = doc.data();
        receiptsList.push({
          id: doc.id,
          receiptNumber: data.receiptNumber,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          items: data.items || [],
          totalQuantity: data.totalQuantity || 0,
          totalCost: data.totalCost || 0,
          paymentMethod: data.paymentMethod,
          paidAmount: data.paidAmount || 0,
          creditAmount: data.creditAmount,
          receivedAt: data.receivedAt,
          receivedBy: data.receivedBy,
          receivedByName: data.receivedByName,
          notes: data.notes,
          createdAt: data.createdAt,
        });
      });
      
      setSupplierReceipts(receiptsList);
      
      // Load products supplied by this supplier
      const productsList: Product[] = [];
      for (const productId of supplier.productsSupplied) {
        try {
          const productDoc = await getDoc(doc(firestore, 'businesses', businessId, 'products', productId));
          if (productDoc.exists()) {
            const data = productDoc.data();
            productsList.push({
              id: productDoc.id,
              name: data.name || '',
              sku: data.attributes?.sku,
              imageUrl: data.imageUrl,
            });
          }
        } catch (error) {
          console.error('Error loading product:', productId, error);
        }
      }
      
      setSupplierProducts(productsList);
    } catch (error) {
      console.error('Error loading supplier details:', error);
      showToast('❌ Failed to load supplier details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Suppliers</h2>
          <p className={styles.pageDesc}>Loading suppliers...</p>
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
          <h2 className={styles.pageTitle}>Suppliers</h2>
          <p className={styles.pageDesc}>Auto-generated from stock receipts</p>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>No Suppliers Yet</h3>
          <p>Suppliers are automatically created when you receive stock</p>
        </div>
      ) : (
        <div className={styles.content}>
          {/* Suppliers List */}
          <div className={styles.suppliersList}>
            {suppliers.map(supplier => (
              <div
                key={supplier.id}
                className={styles.supplierCard}
                onClick={() => handleSupplierClick(supplier)}
              >
                <div className={styles.supplierHeader}>
                  <div className={styles.supplierIcon}>🏢</div>
                  <div className={styles.supplierInfo}>
                    <h3 className={styles.supplierName}>{supplier.name}</h3>
                    <p className={styles.supplierMeta}>
                      {supplier.supplyCount} supply • Last: {formatDate(supplier.lastSupplyDate)}
                    </p>
                  </div>
                </div>
                <div className={styles.supplierStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Total Spent</span>
                    <span className={styles.statValue}>{formatMoney(supplier.totalAmountSpent)}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Products</span>
                    <span className={styles.statValue}>{supplier.productsSupplied.length}</span>
                  </div>
                </div>
                {supplier.outstandingBalance && supplier.outstandingBalance > 0 && (
                  <div className={styles.creditBadge}>
                    Credit: {formatMoney(supplier.outstandingBalance)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Supplier Detail Panel */}
          {selectedSupplier && (
            <div className={styles.detailPanel}>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedSupplier(null)}
              >
                ✕
              </button>

              {isLoadingDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div className={styles.spinner}></div>
                </div>
              ) : (
                <>
                  {/* Supplier Info */}
                  <div className={styles.detailSection}>
                    <h3 className={styles.detailTitle}>{selectedSupplier.name}</h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Total Spent</span>
                        <span className={styles.detailValue}>{formatMoney(selectedSupplier.totalAmountSpent)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Supplies</span>
                        <span className={styles.detailValue}>{selectedSupplier.supplyCount}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Products</span>
                        <span className={styles.detailValue}>{selectedSupplier.productsSupplied.length}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Last Supply</span>
                        <span className={styles.detailValue}>{formatDate(selectedSupplier.lastSupplyDate)}</span>
                      </div>
                      {selectedSupplier.phone && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Phone</span>
                          <span className={styles.detailValue}>{selectedSupplier.phone}</span>
                        </div>
                      )}
                      {selectedSupplier.email && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Email</span>
                          <span className={styles.detailValue}>{selectedSupplier.email}</span>
                        </div>
                      )}
                      {selectedSupplier.outstandingBalance && selectedSupplier.outstandingBalance > 0 && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Outstanding Balance</span>
                          <span className={styles.detailValue} style={{ color: '#ef4444' }}>
                            {formatMoney(selectedSupplier.outstandingBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Products Supplied */}
                  {supplierProducts.length > 0 && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionTitle}>Products Supplied ({supplierProducts.length})</h4>
                      <div className={styles.productsGrid}>
                        {supplierProducts.map(product => (
                          <div key={product.id} className={styles.productChip}>
                            {product.imageUrl && (
                              <img src={product.imageUrl} alt="" className={styles.productImage} />
                            )}
                            <span className={styles.productName}>{product.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Purchase History */}
                  {supplierReceipts.length > 0 && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionTitle}>Purchase History ({supplierReceipts.length})</h4>
                      <div className={styles.receiptsList}>
                        {supplierReceipts.map(receipt => (
                          <div key={receipt.id} className={styles.receiptCard}>
                            <div className={styles.receiptHeader}>
                              <span className={styles.receiptNumber}>{receipt.receiptNumber}</span>
                              <span className={styles.receiptDate}>{formatDate(receipt.createdAt)}</span>
                            </div>
                            <div className={styles.receiptDetails}>
                              <div className={styles.receiptItem}>
                                <span className={styles.receiptLabel}>Items:</span>
                                <span className={styles.receiptValue}>{receipt.totalQuantity}</span>
                              </div>
                              <div className={styles.receiptItem}>
                                <span className={styles.receiptLabel}>Total:</span>
                                <span className={styles.receiptValue}>{formatMoney(receipt.totalCost)}</span>
                              </div>
                              <div className={styles.receiptItem}>
                                <span className={styles.receiptLabel}>Payment:</span>
                                <span className={styles.receiptValue}>{receipt.paymentMethod}</span>
                              </div>
                              <div className={styles.receiptItem}>
                                <span className={styles.receiptLabel}>Location:</span>
                                <span className={styles.receiptValue}>{receipt.receivedAt.replace('_', ' ')}</span>
                              </div>
                            </div>
                            {receipt.notes && (
                              <div className={styles.receiptNotes}>
                                <span className={styles.notesLabel}>Notes:</span>
                                <span className={styles.notesText}>{receipt.notes}</span>
                              </div>
                            )}
                            <div className={styles.receiptItems}>
                              {receipt.items.slice(0, 3).map((item, index) => (
                                <div key={index} className={styles.receiptItemLine}>
                                  {item.productName} × {item.quantity}
                                </div>
                              ))}
                              {receipt.items.length > 3 && (
                                <div className={styles.receiptItemLine}>
                                  +{receipt.items.length - 3} more items
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
