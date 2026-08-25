'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { fetchDocs, fetchDoc, addDoc } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { checkFeatureAccess, Plan, BusinessCategory } from '@/lib/featureRegistry';
import { Supplier } from './types';
import styles from './SuppliersPage.module.css';

interface StockReceipt {
  id: string;
  businessId: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    location?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  receivedDate: Date;
  notes?: string;
  receivedBy: string;
  receivedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  imageUrl?: string;
}

export default function SuppliersPage() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { t } = useTranslation();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierReceipts, setSupplierReceipts] = useState<StockReceipt[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessReason, setAccessReason] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  useEffect(() => {
    checkSupplierAccess();
  }, [user]);

  useEffect(() => {
    loadSuppliers();
  }, [user?.businessId]);

  const checkSupplierAccess = async () => {
    if (!user?.id) return;
    
    try {
      const currentUserId = getAuthCurrentUser()?.uid || '';
      
      if (!currentUserId) return;

      const { data: ownerData } = await getSupabase()
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();

      const businessId = ownerData?.businessId || 'default';
      const category = ownerData?.category || ownerData?.selectedCategory || 'retail';
      const features = ownerData?.selectedFeatures || [];
      const prefs = ownerData?.featurePreferences || {};
      const plan = ownerData?.plan || 'starter';
      const subscriptionStatus = ownerData?.subscriptionStatus;
      const trialEndDate = ownerData?.trialEndDate ? new Date(ownerData.trialEndDate) : undefined;
      
      // Check if user is in trial
      const now = new Date();
      const inTrial = subscriptionStatus === 'trial' && trialEndDate && trialEndDate > now;
      
      // Normalize feature names to registry format
      const normalizeFeatureName = (name: string): string => {
        const nameMap: Record<string, string> = {
          'Supplier Management': 'supplier-management',
        };
        return nameMap[name] || name.toLowerCase().replace(/\s+/g, '-');
      };
      
      const normalizedFeatures = Array.isArray(features) 
        ? features.map(f => normalizeFeatureName(f))
        : [];
      
      // Combine selectedFeatures (onboarding) and featurePreferences (settings page)
      const enabledFeaturesSet = new Set(
        inTrial ? normalizedFeatures : 
        Object.keys(prefs).filter(key => prefs[key])
      );
      
      const accessResult = checkFeatureAccess(
        'supplier-management',
        plan as Plan,
        category.toLowerCase() as BusinessCategory,
        enabledFeaturesSet
      );
      
      if (!accessResult.eligible) {
        setHasAccess(false);
        setAccessReason(accessResult.reason || 'This feature is not available for your plan');
      }
    } catch (error) {
      console.error('Error checking supplier access:', error);
      // On error, allow access to prevent blocking
      setHasAccess(true);
    }
  };

  const loadSuppliers = async () => {
    if (!user?.businessId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const suppliersData = await fetchDocs<Record<string, unknown>>(
        `businesses/${user.businessId}/suppliers`
      );
      const suppliersList: Supplier[] = [];

      suppliersData.forEach((data: Record<string, unknown>) => {
        if (data.status === 'active') {
          suppliersList.push({
            id: data.id as string,
            businessId: (data.businessId as string) || user.businessId || '',
            supplierName: (data.supplierName as string) || (data.businessName as string) || 'Unnamed Supplier',
            businessName: (data.businessName as string) || (data.supplierName as string) || 'Unnamed Supplier',
            phone: (data.phone as string) || '',
            email: data.email as string,
            address: data.address as string,
            notes: data.notes as string,
            paymentTerms: ((data.paymentTerms as string) || 'net_30') as any,
            customPaymentDays: data.customPaymentDays as number,
            creditLimit: (data.creditLimit as number) || 0,
            openingBalance: (data.openingBalance as number) || 0,
            currentBalance: (data.currentBalance as number) || 0,
            category: ((data.category as string) || 'general') as any,
            status: ((data.status as string) || 'active') as any,
            taxId: data.taxId as string,
            bankAccount: data.bankAccount as any,
            contactPerson: data.contactPerson as any,
            createdAt: new Date(data.createdAt as string),
            updatedAt: new Date(data.updatedAt as string),
            lastPurchaseDate: data.lastPurchaseDate ? new Date(data.lastPurchaseDate as string) : undefined,
            lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate as string) : undefined,
            totalPurchases: (data.totalPurchases as number) || 0,
            totalPayments: (data.totalPayments as number) || 0,
            purchaseCount: (data.purchaseCount as number) || 0,
            paymentCount: (data.paymentCount as number) || 0,
            averagePaymentDays: (data.averagePaymentDays as number) || 0,
            creditUtilization: (data.creditUtilization as number) || 0,
          });
        }
      });

      // Sort by total purchases (most relevant first)
      suppliersList.sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0));

      setSuppliers(suppliersList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast(t('toast.suppliersLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsLoadingDetails(true);
    
    try {
      if (!user?.businessId) {
        showToast(t('toast.businessIdNotFound'));
        setIsLoadingDetails(false);
        return;
      }

      const businessId = user.businessId;

      // Load stock receipts for this supplier
      const receiptsData = await fetchDocs<Record<string, unknown>>(
        `businesses/${businessId}/stockReceipts`,
        {
          filters: [{ field: 'supplierId', op: '=', value: supplier.id }],
          orderBy: { field: 'created_at', ascending: false },
        }
      );
      const receiptsList: StockReceipt[] = [];
      
      receiptsData.forEach((data: Record<string, unknown>) => {
        const createdAtDate = new Date(data.createdAt as string);
        const receivedDate = data.receivedAt ? new Date(data.receivedAt as string) : createdAtDate;
        
        receiptsList.push({
          id: data.id as string,
          businessId,
          supplierId: data.supplierId as string,
          supplierName: (data.supplierName as string) || supplier.businessName || 'Unknown Supplier',
          purchaseOrderId: data.purchaseOrderId as string,
          receiptNumber: (data.receiptNumber as string) || (data.id as string),
          items: (data.items as StockReceipt['items']) || [],
          subtotal: (data.subtotal as number) || 0,
          tax: (data.tax as number) || 0,
          total: (data.total as number) || 0,
          receivedDate,
          notes: data.notes as string,
          receivedBy: (data.receivedBy as string) || user.id,
          receivedByName: (data.receivedByName as string) || 'Unknown',
          createdAt: createdAtDate,
          updatedAt: new Date(data.updatedAt as string),
        });
      });
      
      setSupplierReceipts(receiptsList);
      
      // Extract unique products from receipts
      const productIds = new Set<string>();
      receiptsList.forEach(receipt => {
        receipt.items.forEach(item => {
          if (item.productId) {
            productIds.add(item.productId);
          }
        });
      });
      
      // Load product details
      const productsList: Product[] = [];
      for (const productId of Array.from(productIds)) {
        try {
          const productData = await fetchDoc<Record<string, unknown>>(
            `businesses/${businessId}/products`,
            productId
          );
          if (productData) {
            productsList.push({
              id: productData.id as string,
              name: (productData.name as string) || '',
              sku: productData.sku as string,
              imageUrl: productData.imageUrl as string,
            });
          }
        } catch (error) {
          console.error('Error loading product:', productId, error);
        }
      }
      
      setSupplierProducts(productsList);
    } catch (error) {
      console.error('Error loading supplier details:', error);
      showToast(t('toast.supplierDetailsFailed'));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (timestamp: Date | string | undefined) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleCreateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.businessId) {
      showToast(t('toast.businessIdNotFound'));
      return;
    }

    setIsCreatingSupplier(true);
    try {
      const formData = new FormData(e.currentTarget);
      const supplierName = formData.get('supplierName') as string;
      const businessName = formData.get('businessName') as string;
      const phone = formData.get('phone') as string;
      const email = formData.get('email') as string;
      const address = formData.get('address') as string;
      const paymentTerms = formData.get('paymentTerms') as string;

      const newSupplier = {
        id: crypto.randomUUID(),
        businessId: user.businessId,
        supplierName,
        businessName,
        phone,
        email: email || null,
        address: address || null,
        paymentTerms,
        customPaymentDays: null,
        creditLimit: 0,
        openingBalance: 0,
        currentBalance: 0,
        category: 'general',
        status: 'active',
        taxId: null,
        bankAccount: null,
        contactPerson: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastPurchaseDate: null,
        lastPaymentDate: null,
        totalPurchases: 0,
        totalPayments: 0,
        purchaseCount: 0,
        paymentCount: 0,
        averagePaymentDays: 0,
        creditUtilization: 0,
      };

      await addDoc(`businesses/${user.businessId}/suppliers`, newSupplier);
      showToast(t('toast.supplierCreated'));
      setShowAddSupplierModal(false);
      loadSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      showToast(t('toast.supplierCreateFailed'));
    } finally {
      setIsCreatingSupplier(false);
    }
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
          <p className={styles.pageDesc}>Manage your supplier relationships and purchase history</p>
        </div>
        <button className={styles.addButton} onClick={() => setShowAddSupplierModal(true)}>
          <span className={styles.addButtonIcon}>+</span>
          Add Supplier
        </button>
      </div>

      {suppliers.length === 0 && !showAddSupplierModal ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏢</div>
          <h3>No Suppliers Yet</h3>
          <p>Add suppliers when receiving stock or create them here</p>
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
                    <h3 className={styles.supplierName}>{supplier.businessName || supplier.supplierName}</h3>
                    <p className={styles.supplierMeta}>
                      {supplier.purchaseCount} purchases • Last: {supplier.lastPurchaseDate ? formatDate(supplier.lastPurchaseDate) : 'Never'}
                    </p>
                    {supplier.phone && <p className={styles.supplierContact}>📞 {supplier.phone}</p>}
                    {supplier.email && <p className={styles.supplierContact}>✉️ {supplier.email}</p>}
                  </div>
                </div>
                <div className={styles.supplierStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Total Purchases</span>
                    <span className={styles.statValue}>{formatMoney(supplier.totalPurchases)}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Balance</span>
                    <span className={styles.statValue}>{formatMoney(supplier.currentBalance)}</span>
                  </div>
                </div>
                {(supplier.currentBalance || 0) > 0 && (
                  <div className={styles.creditBadge}>
                    Outstanding: {formatMoney(supplier.currentBalance)}
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
                    <h3 className={styles.detailTitle}>{selectedSupplier.businessName || selectedSupplier.supplierName}</h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Total Purchases</span>
                        <span className={styles.detailValue}>{formatMoney(selectedSupplier.totalPurchases)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Purchase Count</span>
                        <span className={styles.detailValue}>{selectedSupplier.purchaseCount}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Current Balance</span>
                        <span className={styles.detailValue}>{formatMoney(selectedSupplier.currentBalance)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Last Purchase</span>
                        <span className={styles.detailValue}>{selectedSupplier.lastPurchaseDate ? formatDate(selectedSupplier.lastPurchaseDate) : 'Never'}</span>
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
                      {(selectedSupplier.currentBalance || 0) > 0 && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Outstanding Balance</span>
                          <span className={styles.detailValue} style={{ color: '#ef4444' }}>
                            {formatMoney(selectedSupplier.currentBalance)}
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
                                <span className={styles.receiptLabel}>Total:</span>
                                <span className={styles.receiptValue}>{formatMoney(receipt.total)}</span>
                              </div>
                              <div className={styles.receiptItem}>
                                <span className={styles.receiptLabel}>Date:</span>
                                <span className={styles.receiptValue}>{formatDate(receipt.receivedDate)}</span>
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
                                  {item.productName} × {item.quantity} @ {formatMoney(item.unitCost)}
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

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New Supplier</h2>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier}>
              <div className={styles.form}>
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Basic Information</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Supplier Name *</label>
                      <input
                        type="text"
                        name="supplierName"
                        className={styles.formInput}
                        required
                        placeholder="Contact person name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Business Name *</label>
                      <input
                        type="text"
                        name="businessName"
                        className={styles.formInput}
                        required
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        className={styles.formInput}
                        required
                        placeholder="+234 XXX XXX XXXX"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Email</label>
                      <input
                        type="email"
                        name="email"
                        className={styles.formInput}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Address</label>
                    <input
                      type="text"
                      name="address"
                      className={styles.formInput}
                      placeholder="Full address"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Payment Terms</label>
                    <select
                      name="paymentTerms"
                      className={styles.formInput}
                      defaultValue="net_30"
                    >
                      <option value="cash">Cash on Delivery</option>
                      <option value="net_7">Net 7 days</option>
                      <option value="net_14">Net 14 days</option>
                      <option value="net_30">Net 30 days</option>
                      <option value="net_60">Net 60 days</option>
                      <option value="net_90">Net 90 days</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSupplier}
                    className={styles.submitButton}
                  >
                    {isCreatingSupplier ? 'Creating...' : 'Create Supplier'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
