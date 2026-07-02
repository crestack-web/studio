'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, runTransaction, updateDoc, getDoc } from 'firebase/firestore';
import { checkFeatureAccess, getBusinessType } from '@/lib/featureRestrictions';
import { useTranslation } from './LangContext';
import styles from './WarehousePage.module.css';

// Memoize the firebase instance to prevent re-initialization
let cachedFirebaseInstance: ReturnType<typeof initializeFirebase> | null = null;
const getFirebaseInstance = () => {
  if (!cachedFirebaseInstance) {
    cachedFirebaseInstance = initializeFirebase();
  }
  return cachedFirebaseInstance;
};

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

interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  sourceLocation: string;
  sourceLocationId: string;
  status: 'pending' | 'released' | 'rejected' | 'partial';
  createdAt: Date;
  releasedBy?: string;
  releasedAt?: Date;
  notes?: string;
  recordedBy?: {
    uid: string;
    displayName: string;
    role: string;
  };
}

export function WarehousePage() {
  const { t } = useTranslation();
  const { showToast, user, navigateTo } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId, branches } = useBranch();
  const firebaseInstance = getFirebaseInstance();
  const firestore = firebaseInstance.firestore;

  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'released' | 'locations' | 'transfers'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState<StockLocation | null>(null);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  
  // Invoice management state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  
  // Role-based access
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'warehouse_staff'>('owner');
  const [assignedLocation, setAssignedLocation] = useState<string | null>(null);
  
  const isCheckingAccessRef = useRef(false);
  const accessCheckedRef = useRef(false);

  const checkWarehouseAccess = useCallback(async () => {
    // Prevent multiple concurrent checks
    if (isCheckingAccessRef.current) return;
    
    isCheckingAccessRef.current = true;
    
    // Prevent running the check multiple times for the same user
    if (accessCheckedRef.current) {
      isCheckingAccessRef.current = false;
      return;
    }

    if (!user?.id) {
      setHasAccess(false);
      setAccessReason('Please log in to access this feature');
      accessCheckedRef.current = true;
      isCheckingAccessRef.current = false;
      return;
    }

    try {
      const businessType = await getBusinessType(user.id);
      const isRetailOrWholesale = businessType.toLowerCase().includes('retail') ||
                                   businessType.toLowerCase().includes('wholesale') ||
                                   businessType.toLowerCase().includes('distributor');

      if (isRetailOrWholesale) {
        setHasAccess(true);
        accessCheckedRef.current = true;
        isCheckingAccessRef.current = false;
        return;
      }

      const accessResult = await checkFeatureAccess(user.id, 'warehouseManagement');
      if (accessResult.eligible) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        setAccessReason(accessResult.reason || 'This feature is not available for your plan');
      }
      accessCheckedRef.current = true;
    } catch (error) {
      console.error('Error checking warehouse access:', error);
      setHasAccess(true);
      accessCheckedRef.current = true;
    } finally {
      isCheckingAccessRef.current = false;
    }
  }, [user]);

  // Run access check when component mounts or user changes
  useEffect(() => {
    // Reset the check when user changes
    if (user) {
      accessCheckedRef.current = false;
    }
    checkWarehouseAccess();
  }, [user, checkWarehouseAccess]);

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
          type: data.type || doc.id,
        });
      });

      // Deduplicate locations by name to prevent duplicates
      const uniqueLocations = loadedLocations.filter((location, index, self) =>
        index === self.findIndex(l => l.name.toLowerCase() === location.name.toLowerCase())
      );

      // Ensure Main Store always exists - use fixed ID to prevent duplicates
      const hasMainStore = uniqueLocations.some(loc => loc.id === 'main_store');
      
      if (!hasMainStore) {
        try {
          // Use setDoc with specific document ID to prevent duplicates
          const { setDoc } = await import('firebase/firestore');
          await setDoc(
            doc(firestore, 'businesses', businessId, 'stockLocations', 'main_store'),
            {
              name: 'Main Store',
              type: 'main_store',
              createdAt: new Date(),
            }
          );
          
          // Add to loaded locations
          uniqueLocations.push({
            id: 'main_store',
            name: 'Main Store',
            type: 'main_store',
          });
        } catch (error) {
          console.error('Error creating main store:', error);
        }
      }

      const sorted = uniqueLocations.sort((a, b) => {
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

  const loadTransferHistory = async () => {
    if (!businessId || !firestore) return;

    try {
      const transfersQuery = query(
        collection(firestore, 'businesses', businessId, 'stockTransfers')
      );
      const transfersSnapshot = await getDocs(transfersQuery);
      const transfers: any[] = [];

      transfersSnapshot.forEach(doc => {
        const data = doc.data();
        transfers.push({
          id: doc.id,
          ...data,
          transferredAt: data.transferredAt?.toDate() || new Date(),
        });
      });

      transfers.sort((a, b) => b.transferredAt - a.transferredAt);
      setTransferHistory(transfers.slice(0, 50));
    } catch (error) {
      console.error('Error loading transfer history:', error);
    }
  };

  const loadInvoices = async () => {
    if (!businessId || !firestore) return;

    try {
      const invoicesQuery = query(
        collection(firestore, 'businesses', businessId, 'invoices')
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const loadedInvoices: Invoice[] = [];

      invoicesSnapshot.forEach(doc => {
        const data = doc.data();
        loadedInvoices.push({
          id: doc.id,
          invoiceNumber: data.invoiceNumber || '',
          saleId: data.saleId || '',
          customerName: data.customerName || '',
          customerPhone: data.customerPhone || '',
          items: data.items || [],
          totalAmount: data.totalAmount || 0,
          sourceLocation: data.sourceLocation || '',
          sourceLocationId: data.sourceLocationId || '',
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
          releasedBy: data.releasedBy,
          releasedAt: data.releasedAt?.toDate(),
          notes: data.notes,
          recordedBy: data.recordedBy,
        });
      });

      setInvoices(loadedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleReleaseInvoice = async (invoice: Invoice, partial: boolean = false) => {
    if (!businessId || !firestore) return;

    try {
      const { Timestamp } = await import('firebase/firestore');
      
      // Deduct inventory
      await runTransaction(firestore, async (transaction) => {
        for (const item of invoice.items) {
          const productRef = doc(firestore, 'businesses', businessId, 'products', item.productId);
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const data = productDoc.data();
            const currentStock = data.stock || data.quantity || 0;
            const quantityToDeduct = partial ? Math.floor(item.quantity / 2) : item.quantity;
            const newStock = Math.max(0, currentStock - quantityToDeduct);
            
            // Update stockByLocation
            const stockByLocation = data.stockByLocation || {};
            if (invoice.sourceLocationId && stockByLocation[invoice.sourceLocationId] !== undefined) {
              const currentLocationStock = stockByLocation[invoice.sourceLocationId] || 0;
              const newLocationStock = Math.max(0, currentLocationStock - quantityToDeduct);
              stockByLocation[invoice.sourceLocationId] = newLocationStock;
            }
            
            transaction.update(productRef, {
              stock: newStock,
              stockByLocation: stockByLocation,
            });
          }
        }
      });

      // Update invoice status
      const invoiceRef = doc(firestore, 'businesses', businessId, 'invoices', invoice.id);
      await updateDoc(invoiceRef, {
        status: partial ? 'partial' : 'released',
        releasedBy: user?.name || user?.email || 'Unknown',
        releasedAt: Timestamp.now(),
        notes: releaseNotes,
      });

      showToast(`✅ Invoice ${partial ? 'partially' : ''} released successfully`);
      setShowInvoiceModal(false);
      setSelectedInvoice(null);
      setReleaseNotes('');
      loadInvoices();
      loadProducts();
    } catch (error) {
      console.error('Error releasing invoice:', error);
      showToast('❌ Failed to release invoice');
    }
  };

  const loadProducts = async () => {
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // First, load locations to ensure main_store exists
      await loadStockLocations();
      
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('active', '==', true)
      );

      const productsSnapshot = await getDocs(productsQuery);
      const productsList: Product[] = [];
      
      // Get current location IDs after locations are loaded
      const currentLocations = stockLocations;
      const locationIds = currentLocations.map(l => l.id);
      
      // Ensure stockByLocation has all current locations
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        let stockByLocation = data.stockByLocation || {};
        
        // If no stockByLocation or missing main_store, initialize with all stock in main_store
        if (!stockByLocation || Object.keys(stockByLocation).length === 0) {
          stockByLocation = {
            main_store: data.stock || 0,
          };
        } else {
          // Ensure main_store exists in stockByLocation
          if (!('main_store' in stockByLocation)) {
            stockByLocation.main_store = data.stock || 0;
          }
        }
        
        // Ensure all current locations have values (default to 0 if not set)
        locationIds.forEach(locId => {
          if (!(locId in stockByLocation)) {
            stockByLocation[locId] = 0;
          }
        });

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
      await loadTransferHistory();
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('❌ Failed to load warehouse data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadInvoices();
    loadUserRole();
  }, [businessId]);

  const loadUserRole = async () => {
    if (!user?.id || !firestore) return;

    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role || 'owner');
        setAssignedLocation(data.assignedWarehouseLocation || null);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

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

  // While checking access, show loading state
  if (hasAccess === null) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Warehouse</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  // If no access, show lock state with upgrade prompt
  if (hasAccess === false) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
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
        <div className={styles.lockOverlay}>
          <div className={styles.lockContent}>
            <div className={styles.lockIcon}>🔒</div>
            <h3 className={styles.lockTitle}>Feature Not Available</h3>
            <p className={styles.lockReason}>{accessReason}</p>
            <button className={styles.lockButton} onClick={() => window.location.href = '/pricing'}>
              Upgrade Plan
            </button>
          </div>
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

  // User has access - show full warehouse page
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const releasedInvoices = invoices.filter(inv => inv.status === 'released' || inv.status === 'partial');

  // Filter invoices by assigned location for warehouse staff
  const filteredPendingInvoices = userRole === 'warehouse_staff' && assignedLocation
    ? pendingInvoices.filter(inv => inv.sourceLocationId === assignedLocation)
    : pendingInvoices;

  const filteredReleasedInvoices = userRole === 'warehouse_staff' && assignedLocation
    ? releasedInvoices.filter(inv => inv.sourceLocationId === assignedLocation)
    : releasedInvoices;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Warehouse</h2>
          <p className={styles.pageDesc}>
            {userRole === 'warehouse_staff' 
              ? `Manage stock for: ${assignedLocation || 'All Locations'}` 
              : 'Manage stock, releases, and transfers'}
          </p>
        </div>
        {userRole === 'owner' || userRole === 'admin' ? (
          <div className={styles.headerActions}>
            <button
              className={`${styles.actionButton} ${styles.addButton}`}
              onClick={() => setShowAddModal(true)}
            >
              + Add Warehouse
            </button>
          </div>
        ) : null}
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          📋 Pending Releases
          {filteredPendingInvoices.length > 0 && <span className={styles.tabBadge}>{filteredPendingInvoices.length}</span>}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'released' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('released')}
        >
          ✅ Released History
        </button>
        {(userRole === 'owner' || userRole === 'admin') && (
          <button
            className={`${styles.tabButton} ${activeTab === 'locations' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            🏢 Locations
          </button>
        )}
        <button
          className={`${styles.tabButton} ${activeTab === 'transfers' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          🔄 Transfers
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className={styles.totalStats}>
            <div className={styles.totalStat}>
              <span className={styles.totalStatLabel}>Total Stock</span>
              <span className={styles.totalStatValue}>{getTotalStockCount().toLocaleString()} units</span>
            </div>
            <div className={styles.totalStat}>
              <span className={styles.totalStatLabel}>Total Value</span>
              <span className={styles.totalStatValue}>{formatMoney(getTotalStockValue())}</span>
            </div>
            <div className={styles.totalStat}>
              <span className={styles.totalStatLabel}>Pending Releases</span>
              <span className={styles.totalStatValue}>{pendingInvoices.length}</span>
            </div>
            <div className={styles.totalStat}>
              <span className={styles.totalStatLabel}>Released Today</span>
              <span className={styles.totalStatValue}>
                {releasedInvoices.filter(inv => {
                  const today = new Date();
                  return inv.releasedAt && 
                    inv.releasedAt.toDateString() === today.toDateString();
                }).length}
              </span>
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
        </>
      )}

      {/* Pending Releases Tab */}
      {activeTab === 'pending' && (
        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h3 className={styles.productsTitle}>Pending Releases</h3>
            <div className={styles.headerRight}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search invoice number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredPendingInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No Pending Releases</h3>
              <p>{userRole === 'warehouse_staff' ? 'No pending releases for your assigned location' : 'All invoices have been processed'}</p>
            </div>
          ) : (
            <div className={styles.invoiceList}>
              {filteredPendingInvoices.filter(inv => 
                inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(invoice => (
                <div key={invoice.id} className={styles.invoiceCard}>
                  <div className={styles.invoiceHeader}>
                    <div>
                      <h3>{invoice.invoiceNumber}</h3>
                      <p className={styles.customerInfo}>{invoice.customerName}</p>
                    </div>
                    <div className={styles.invoiceMeta}>
                      <span className={styles.date}>{invoice.createdAt.toLocaleDateString()}</span>
                      <span className={styles.invoiceAmount}>{formatMoney(invoice.totalAmount)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.invoiceDetails}>
                    <p><strong>Items:</strong> {invoice.items.length}</p>
                    <p><strong>Warehouse:</strong> {invoice.sourceLocation}</p>
                    <p><strong>Salesperson:</strong> {invoice.recordedBy?.displayName || 'Unknown'}</p>
                  </div>
                  
                  <div className={styles.invoiceActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowInvoiceModal(true);
                      }}
                    >
                      Review & Release
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Released History Tab */}
      {activeTab === 'released' && (
        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h3 className={styles.productsTitle}>Released History</h3>
            <div className={styles.headerRight}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search invoice number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredReleasedInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✅</div>
              <h3>No Released Invoices</h3>
              <p>{userRole === 'warehouse_staff' ? 'No released invoices for your assigned location' : 'No invoices have been released yet'}</p>
            </div>
          ) : (
            <div className={styles.invoiceList}>
              {filteredReleasedInvoices.filter(inv => 
                inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(invoice => (
                <div key={invoice.id} className={styles.invoiceCard}>
                  <div className={styles.invoiceHeader}>
                    <div>
                      <h3>{invoice.invoiceNumber}</h3>
                      <p className={styles.customerInfo}>{invoice.customerName}</p>
                    </div>
                    <div className={styles.invoiceMeta}>
                      <span className={styles.date}>{invoice.releasedAt?.toLocaleDateString() || invoice.createdAt.toLocaleDateString()}</span>
                      <span className={`${styles.statusBadge} ${styles.statusReleased}`}>{invoice.status}</span>
                    </div>
                  </div>
                  
                  <div className={styles.invoiceDetails}>
                    <p><strong>Released By:</strong> {invoice.releasedBy}</p>
                    <p><strong>Warehouse:</strong> {invoice.sourceLocation}</p>
                    <p><strong>Total:</strong> {formatMoney(invoice.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h3 className={styles.productsTitle}>Stock Locations</h3>
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
          </div>
        </div>
      )}

      {/* Transfers Tab */}
      {activeTab === 'transfers' && (
        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h3 className={styles.productsTitle}>Stock Transfer History</h3>
          </div>
          {transferHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>�</div>
              <h3>No Transfer History</h3>
              <p>No stock transfers have been recorded yet</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {transferHistory.map(transfer => (
                <div key={transfer.id} className={styles.historyItem}>
                  <div className={styles.historyIcon}>🔄</div>
                  <div className={styles.historyContent}>
                    <div className={styles.historyProduct}>{transfer.productName}</div>
                    <div className={styles.historyDetails}>
                      {transfer.fromLocation} → {transfer.toLocation} • {transfer.quantity} units
                    </div>
                  </div>
                  <div className={styles.historyTime}>
                    {new Date(transfer.transferredAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invoice Review Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setShowInvoiceModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Review Invoice: {selectedInvoice.invoiceNumber}</h2>
              <button className={styles.modalClose} onClick={() => setShowInvoiceModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.invoiceDetailsFull}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Customer:</span>
                  <span>{selectedInvoice.customerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Phone:</span>
                  <span>{selectedInvoice.customerPhone || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Source Location:</span>
                  <span>{selectedInvoice.sourceLocation}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Date:</span>
                  <span>{selectedInvoice.createdAt.toLocaleString()}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Salesperson:</span>
                  <span>{selectedInvoice.recordedBy?.displayName || 'Unknown'}</span>
                </div>
              </div>
              
              <h3>Items</h3>
              <div className={styles.itemsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatMoney(item.price)}</td>
                        <td>{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className={styles.totalRow}>
                <strong>Total: {formatMoney(selectedInvoice.totalAmount)}</strong>
              </div>
              
              <div className={styles.notesSection}>
                <label>Release Notes:</label>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Add any notes about this release..."
                  className={styles.notesTextarea}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalBtn}
                onClick={() => setShowInvoiceModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => handleReleaseInvoice(selectedInvoice, false)}
              >
                Release Goods
              </button>
              <button 
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => handleReleaseInvoice(selectedInvoice, true)}
              >
                Partial Release
              </button>
            </div>
          </div>
        </div>
      )}

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