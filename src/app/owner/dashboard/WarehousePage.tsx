'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { checkFeatureAccess, getBusinessType } from '@/lib/featureRestrictions';
import { useTranslation } from './LangContext';
import styles from './WarehousePage.module.css';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  stock: number;
  stockByLocation: Record<string, number>;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
  lowStockThreshold: number;
}

interface LocationSummary {
  name: string;
  type: string;
  stockCount: number;
  stockValue: number;
  productCount: number;
}

interface StockLocation {
  id: string;
  name: string;
  type: string;
}

export function WarehousePage() {
  const { t } = useTranslation();
  const { showToast, user, navigateTo } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId, branches } = useBranch();
  const { firestore } = initializeFirebase();

  const [products, setProducts] = useState<Product[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState<StockLocation | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      checkWarehouseAccess();
    }
  }, [user, isMounted]);

  if (!isMounted) {
    return null;
  }

  const checkWarehouseAccess = async () => {
    if (!user?.id) return;

    const businessType = await getBusinessType(user.id);
    const isRetailOrWholesale = businessType.toLowerCase().includes('retail') ||
                                 businessType.toLowerCase().includes('wholesale') ||
                                 businessType.toLowerCase().includes('distributor');

    if (isRetailOrWholesale) {
      setHasAccess(true);
      return;
    }

    const accessResult = await checkFeatureAccess(user.id, 'warehouseManagement');
    if (!accessResult.eligible) {
      setHasAccess(false);
      setAccessReason(accessResult.reason || 'This feature is not available for your plan');
    }
  };

  if (!hasAccess) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Warehouse</h2>
        </div>
        <div className={styles.lockState}>
          <div className={styles.lockIcon}>🔒</div>
          <h3 className={styles.lockTitle}>Feature Not Available</h3>
          <p className={styles.lockReason}>{accessReason}</p>
          <button className={styles.lockButton} onClick={() => window.location.href = '/pricing'}>
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  const loadStockLocations = async () => {
    if (!businessId || !firestore) return;

    try {
      const locationsQuery = query(
        collection(firestore, 'businesses', businessId, 'stockLocations')
      );
      const locationsSnapshot = await getDocs(locationsQuery);
      const loadedLocations: StockLocation[] = [];

      locationsSnapshot.forEach((doc) => {
        const data = doc.data();
        loadedLocations.push({
          id: doc.id,
          name: data.name,
          type: doc.id,
        });
      });

      const sorted = loadedLocations.sort((a, b) => {
        const order = ['main_store', 'warehouse', 'back_store'];
        const aIndex = order.indexOf(a.id);
        const bIndex = order.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
      });

      setStockLocations(sorted);
    } catch (error) {
      console.error('Error loading stock locations:', error);
    }
  };

  const loadProducts = async () => {
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

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
          category: data.category || '',
          stock: data.stock || 0,
          stockByLocation,
          costPrice: data.cost || 0,
          sellingPrice: data.price || 0,
          imageUrl: data.imageUrl || '',
          lowStockThreshold: data.lowStockThreshold || 10,
        });
      });

      setProducts(productsList);
      await loadStockLocations();
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('❌ Failed to load warehouse data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [businessId, firestore]);

  const getLocationSummary = (): LocationSummary[] => {
    const locations: LocationSummary[] = [];

    const addLocation = (type: string, name: string, isDefault: boolean) => {
      const stockCount = products.reduce((sum, p) => sum + (p.stockByLocation?.[type] || 0), 0);
      const stockValue = products.reduce((sum, p) => sum + ((p.stockByLocation?.[type] || 0) * p.costPrice), 0);
      const productCount = products.filter(p => (p.stockByLocation?.[type] || 0) > 0).length;

      if (!isDefault || stockCount > 0) {
        locations.push({
          name,
          type,
          stockCount,
          stockValue,
          productCount,
        });
      }
    };

    if (stockLocations.length > 0) {
      stockLocations.forEach(loc => {
        addLocation(loc.type, loc.name, false);
      });
    } else {
      addLocation('main_store', 'Main Store', true);
      addLocation('back_store', 'Back Store', true);
      addLocation('warehouse', 'Warehouse', true);
    }

    return locations;
  };

  const getFilteredProducts = () => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(p => (p.stockByLocation?.[selectedLocation] || 0) > 0);
    }

    return filtered;
  };

  const getTotalStockValue = () => {
    return products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  };

  const getTotalStockCount = () => {
    return products.reduce((sum, p) => sum + p.stock, 0);
  };

  const locationSummary = getLocationSummary();
  const filteredProducts = getFilteredProducts();

  const handleTransfer = async (product: Product, target: string, quantity: number) => {
    if (!businessId || !firestore) {
      showToast('❌ Business information not available');
      return;
    }

    if (quantity <= 0 || quantity > product.stock) {
      showToast('❌ Invalid transfer quantity');
      return;
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const productRef = doc(firestore, 'businesses', businessId, 'products', product.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error('Product not found');
        }

        const data = productDoc.data();
        const stockByLocation = data.stockByLocation || {
          main_store: data.stock || 0,
          back_store: 0,
          warehouse: 0,
        };

        const sourceStock = stockByLocation[selectedLocation];
        const targetStock = stockByLocation[target] || 0;

        if (!sourceStock || sourceStock < quantity) {
          throw new Error(`Insufficient stock in selected location`);
        }

        stockByLocation[selectedLocation] = sourceStock - quantity;
        stockByLocation[target] = targetStock + quantity;

        transaction.update(productRef, {
          stockByLocation,
          updatedAt: new Date(),
        });

        const transferLogRef = doc(collection(firestore, 'businesses', businessId, 'stockTransfers'));
        transaction.set(transferLogRef, {
          productId: product.id,
          productName: product.name,
          fromLocation: selectedLocation,
          toLocation: target,
          quantity: quantity,
          transferredBy: user?.id,
          transferredAt: new Date(),
        });
      });

      showToast('✅ Stock transferred successfully');
      await loadProducts();
      setSelectedLocation('all');
    } catch (error: any) {
      console.error('Error transferring product:', error);
      showToast(`❌ Transfer failed: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Warehouse</h2>
          <p className={styles.pageDesc}>Loading warehouse data...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  const availableLocations = stockLocations.length > 0
    ? stockLocations
    : [
        { id: 'main_store', name: 'Main Store', type: 'main_store' },
        { id: 'warehouse', name: 'Warehouse', type: 'warehouse' },
        { id: 'back_store', name: 'Back Store', type: 'back_store' },
      ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Warehouse</h2>
          <p className={styles.pageDesc}>View stock across all locations</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.actionButton} ${styles.addButton}`}
            onClick={() => setShowAddModal(true)}
          >
            + Add Warehouse
          </button>
        </div>
        <div className={styles.totalStats}>
          <div className={styles.totalStat}>
            <span className={styles.totalStatLabel}>Total Stock</span>
            <span className={styles.totalStatValue}>{getTotalStockCount().toLocaleString()} units</span>
          </div>
          <div className={styles.totalStat}>
            <span className={styles.totalStatLabel}>Total Value</span>
            <span className={styles.totalStatValue}>{formatMoney(getTotalStockValue())}</span>
          </div>
        </div>
      </div>

      <div className={styles.locationsGrid}>
        {locationSummary.map(location => (
          <div
            key={location.type}
            className={`${styles.locationCard} ${selectedLocation === location.type ? styles.active : ''}`}
            onClick={() => setSelectedLocation(selectedLocation === location.type ? 'all' : location.type)}
          >
            <div className={styles.locationHeader}>
              <div className={styles.locationContent}>
                <div className={styles.locationIcon}>
                  {location.type === 'main_store' && '🏪'}
                  {location.type === 'back_store' && '📦'}
                  {location.type === 'warehouse' && '🏭'}
                  {!['main_store', 'back_store', 'warehouse'].includes(location.type) && '🏢'}
                </div>
                <h3 className={styles.locationName}>{location.name}</h3>
              </div>
              {!['main_store', 'back_store', 'warehouse'].includes(location.type) && (
                <button
                  className={styles.deleteLocationBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    const loc = stockLocations.find(l => l.type === location.type);
                    if (loc) setLocationToDelete(loc);
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <div className={styles.locationStats}>
              <div className={styles.locationStat}>
                <span className={styles.locationStatLabel}>Stock</span>
                <span className={styles.locationStatValue}>{location.stockCount.toLocaleString()}</span>
              </div>
              <div className={styles.locationStat}>
                <span className={styles.locationStatLabel}>Value</span>
                <span className={styles.locationStatValue}>{formatMoney(location.stockValue)}</span>
              </div>
              <div className={styles.locationStat}>
                <span className={styles.locationStatLabel}>Products</span>
                <span className={styles.locationStatValue}>{location.productCount}</span>
              </div>
            </div>
          </div>
        ))}

        <div
          className={`${styles.locationCard} ${selectedLocation === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedLocation('all')}
        >
          <div className={styles.locationHeader}>
            <div className={styles.locationContent}>
              <div className={styles.locationIcon}>📊</div>
              <h3 className={styles.locationName}>All Locations</h3>
            </div>
          </div>
          <div className={styles.locationStats}>
            <div className={styles.locationStat}>
              <span className={styles.locationStatLabel}>Stock</span>
              <span className={styles.locationStatValue}>{getTotalStockCount().toLocaleString()}</span>
            </div>
            <div className={styles.locationStat}>
              <span className={styles.locationStatLabel}>Value</span>
              <span className={styles.locationStatValue}>{formatMoney(getTotalStockValue())}</span>
            </div>
            <div className={styles.locationStat}>
              <span className={styles.locationStatLabel}>Products</span>
              <span className={styles.locationStatValue}>{products.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <h3 className={styles.productsTitle}>
            {selectedLocation === 'all' ? 'All Products' : locationSummary.find(l => l.type === selectedLocation)?.name || 'Products'}
          </h3>
          <div className={styles.headerRight}>
            {selectedLocation !== 'all' && (
              <button
                className={styles.transferButton}
                onClick={() => {
                  const productId = prompt('Enter Product ID or Name to transfer:');
                  if (productId) {
                    const product = products.find(p => p.id === productId || p.name.toLowerCase().includes(productId.toLowerCase()));
                    if (product) {
                      const target = prompt('Enter target warehouse:');
                      const qty = prompt('Enter quantity:');
                      if (target && qty) {
                        handleTransfer(product, target, parseInt(qty) || 0);
                      }
                    } else {
                      showToast('❌ Product not found');
                    }
                  }
                }}
              >
                Quick Transfer
              </button>
            )}
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>No Products Found</h3>
            <p>Try adjusting your search or location filter</p>
          </div>
        ) : (
          <div className={styles.productsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Product</div>
              {availableLocations.map(loc => (
                <div key={loc.id} className={styles.tableCell}>{loc.name}</div>
              ))}
              <div className={styles.tableCell}>Total</div>
              <div className={styles.tableCell}>Value</div>
            </div>

            {filteredProducts.map(product => (
              <div key={product.id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <div className={styles.productCell}>
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt="" className={styles.productImage} />
                    )}
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{product.name}</div>
                      {product.sku && (
                        <div className={styles.productSku}>{product.sku}</div>
                      )}
                    </div>
                  </div>
                </div>
                {availableLocations.map(loc => (
                  <div key={loc.id} className={styles.tableCell}>
                    <span className={styles.stockValue}>{product.stockByLocation?.[loc.id] || 0}</span>
                  </div>
                ))}
                <div className={styles.tableCell}>
                  <span className={`${styles.stockValue} ${styles.totalStock}`}>{product.stock}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.valueText}>{formatMoney(product.stock * product.costPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Warehouse</h2>
              <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Warehouse Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., Cold Room, Display Area"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                  onClick={async () => {
                    if (!newLocationName.trim() || !businessId || !firestore) return;

                    const slug = newLocationName
                      .trim()
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '_')
                      .replace(/^_+|_+$/g, '');

                    if (!slug) {
                      showToast('❌ Invalid warehouse name');
                      return;
                    }

                    try {
                      await addDoc(
                        collection(firestore, 'businesses', businessId, 'stockLocations'),
                        {
                          name: newLocationName.trim(),
                          type: slug,
                          createdAt: new Date(),
                        }
                      );

                      await loadStockLocations();
                      setShowAddModal(false);
                      setNewLocationName('');
                      showToast('✅ Warehouse created successfully');
                    } catch (error) {
                      console.error('Error creating warehouse:', error);
                      showToast('❌ Failed to create warehouse');
                    }
                  }}
                  disabled={!newLocationName.trim()}
                >
                  Create Warehouse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {locationToDelete && (
        <div className={styles.modalOverlay} onClick={() => setLocationToDelete(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Delete Warehouse</h2>
              <button className={styles.modalClose} onClick={() => setLocationToDelete(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Are you sure you want to delete "<strong>{locationToDelete.name}</strong>"? This will remove this warehouse location from stock tracking.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.modalBtn} onClick={() => setLocationToDelete(null)}>Cancel</button>
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                  onClick={async () => {
                    if (!locationToDelete || !businessId || !firestore) return;

                    try {
                      await deleteDoc(
                        doc(firestore, 'businesses', businessId, 'stockLocations', locationToDelete.id)
                      );

                      if (selectedLocation === locationToDelete.type) {
                        setSelectedLocation('all');
                      }

                      await loadProducts();
                      setLocationToDelete(null);
                      showToast('✅ Warehouse deleted successfully');
                    } catch (error) {
                      console.error('Error deleting warehouse:', error);
                      showToast('❌ Failed to delete warehouse');
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}