'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, runTransaction, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { useTranslation } from './LangContext';
import { NavIcons } from './NavIcons';
import styles from './WarehousePage.module.css';

// Icon component wrapper for consistent usage
const Icon = ({ name, size = 18 }: { name: string; size?: number }) => (
  <NavIcons id={name} size={size} />
);

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

  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'released' | 'locations' | 'transfers' | 'requests' | 'returns'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationToDelete, setLocationToDelete] = useState<StockLocation | null>(null);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  
  // Invoice management state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  
  // Stock transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [transferTarget, setTransferTarget] = useState('');
  
  // Stock adjustment modal state
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentProduct, setAdjustmentProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState<'damaged' | 'lost' | 'expired' | 'recount'>('damaged');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  
  // Stock requests state
  const [stockRequests, setStockRequests] = useState<any[]>([]);
  const [selectedStockRequest, setSelectedStockRequest] = useState<any | null>(null);
  const [showStockRequestModal, setShowStockRequestModal] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  
  // Returns state
  const [returns, setReturns] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');

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
    loadStockRequests();
    loadReturns();
  }, [businessId]);

  const loadReturns = async () => {
    if (!businessId || !firestore) return;

    try {
      const returnsQuery = query(
        collection(firestore, 'businesses', businessId, 'returns'),
        orderBy('returnedAt', 'desc')
      );
      const snapshot = await getDocs(returnsQuery);
      const returnsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReturns(returnsList);
    } catch (error) {
      console.error('Error loading returns:', error);
    }
  };

  const loadStockRequests = async () => {
    if (!businessId || !firestore) return;

    try {
      const requestsQuery = query(
        collection(firestore, 'businesses', businessId, 'stockRequests'),
        orderBy('requestedAt', 'desc')
      );
      const snapshot = await getDocs(requestsQuery);
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStockRequests(requestsList);
    } catch (error) {
      console.error('Error loading stock requests:', error);
    }
  };

  const getLocationSummary = (): LocationSummary[] => {
    const locations: LocationSummary[] = [];
    const addedTypes = new Set<string>();

    const addLocation = (type: string, name: string, isDefault: boolean) => {
      // Skip if already added this type
      if (addedTypes.has(type)) {
        return;
      }

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
        addedTypes.add(type);
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

  const handleAdjustment = async (product: Product, quantity: number, reason: 'damaged' | 'lost' | 'expired' | 'recount', notes: string) => {
    if (!businessId || !firestore) {
      showToast('❌ Business information not available');
      return;
    }

    if (quantity <= 0 || quantity > product.stock) {
      showToast('❌ Invalid adjustment quantity');
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

        const locationStock = stockByLocation[selectedLocation] || 0;

        if (locationStock < quantity) {
          throw new Error(`Insufficient stock in selected location`);
        }

        stockByLocation[selectedLocation] = locationStock - quantity;
        const newTotalStock = Object.values(stockByLocation).reduce((sum: number, val: any) => sum + val, 0);

        transaction.update(productRef, {
          stock: newTotalStock,
          stockByLocation,
          updatedAt: new Date(),
        });

        const adjustmentLogRef = doc(collection(firestore, 'businesses', businessId, 'stockAdjustments'));
        transaction.set(adjustmentLogRef, {
          productId: product.id,
          productName: product.name,
          location: selectedLocation,
          quantity: quantity,
          reason: reason,
          notes: notes,
          adjustedBy: user?.id,
          adjustedAt: new Date(),
        });
      });

      showToast(`✅ Stock adjusted successfully (${reason})`);
      await loadProducts();
      setShowAdjustmentModal(false);
      setAdjustmentProduct(null);
      setAdjustmentQuantity(1);
      setAdjustmentNotes('');
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      showToast(`❌ Adjustment failed: ${error.message}`);
    }
  };

  const handleStockRequest = async (requestId: string, approved: boolean) => {
    if (!businessId || !firestore) {
      showToast('❌ Business information not available');
      return;
    }

    try {
      const requestRef = doc(firestore, 'businesses', businessId, 'stockRequests', requestId);
      await updateDoc(requestRef, {
        status: approved ? 'approved' : 'rejected',
        processedBy: user?.id,
        processedAt: new Date(),
        notes: requestNotes,
      });

      showToast(`✅ Stock request ${approved ? 'approved' : 'rejected'}`);
      await loadStockRequests();
      setShowStockRequestModal(false);
      setSelectedStockRequest(null);
      setRequestNotes('');
    } catch (error) {
      console.error('Error processing stock request:', error);
      showToast('❌ Failed to process stock request');
    }
  };

  const handleReturn = async (returnId: string, approved: boolean) => {
    if (!businessId || !firestore) {
      showToast('❌ Business information not available');
      return;
    }

    try {
      const returnRef = doc(firestore, 'businesses', businessId, 'returns', returnId);
      
      if (approved) {
        await runTransaction(firestore, async (transaction) => {
          const returnDoc = await transaction.get(returnRef);
          if (!returnDoc.exists()) {
            throw new Error('Return not found');
          }

          const returnData = returnDoc.data();
          
          // Update product stock
          const productRef = doc(firestore, 'businesses', businessId, 'products', returnData.productId);
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const productData = productDoc.data();
            const stockByLocation = productData.stockByLocation || {};
            const locationStock = stockByLocation[returnData.location] || 0;
            
            stockByLocation[returnData.location] = locationStock + returnData.quantity;
            const newTotalStock = Object.values(stockByLocation).reduce((sum: number, val: any) => sum + val, 0);

            transaction.update(productRef, {
              stock: newTotalStock,
              stockByLocation,
              updatedAt: new Date(),
            });
          }

          transaction.update(returnRef, {
            status: 'approved',
            processedBy: user?.id,
            processedAt: new Date(),
            notes: returnNotes,
          });
        });
      } else {
        await updateDoc(returnRef, {
          status: 'rejected',
          processedBy: user?.id,
          processedAt: new Date(),
          notes: returnNotes,
        });
      }

      showToast(`✅ Return ${approved ? 'approved' : 'rejected'}`);
      await loadReturns();
      await loadProducts();
      setShowReturnModal(false);
      setSelectedReturn(null);
      setReturnNotes('');
    } catch (error) {
      console.error('Error processing return:', error);
      showToast('❌ Failed to process return');
    }
  };

  const availableLocations = stockLocations.length > 0
    ? stockLocations
    : [
        { id: 'main_store', name: 'Main Store', type: 'main_store' },
        { id: 'warehouse', name: 'Warehouse', type: 'warehouse' },
        { id: 'back_store', name: 'Back Store', type: 'back_store' },
      ];

  // Show full warehouse page
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const releasedInvoices = invoices.filter(inv => inv.status === 'released' || inv.status === 'partial');

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Warehouse</h2>
          <p className={styles.pageDesc}>Manage stock, releases, and transfers</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products, invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`${styles.actionButton} ${styles.addButton}`}
            onClick={() => setShowAdjustmentModal(true)}
          >
            <Icon name="inventory" size={18} />
            <span style={{ marginLeft: 8 }}>Stock Adjustment</span>
          </button>
          <button
            className={`${styles.actionButton} ${styles.addButton}`}
            onClick={() => setShowAddModal(true)}
          >
            <Icon name="add" size={18} />
            <span style={{ marginLeft: 8 }}>Add Warehouse</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Icon name="home" size={16} />
          <span style={{ marginLeft: 6 }}>Overview</span>
        </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'pending' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Icon name="inbox" size={16} />
            <span style={{ marginLeft: 6 }}>Pending Releases</span>
            {pendingInvoices.length > 0 && <span className={styles.tabBadge}>{pendingInvoices.length}</span>}
          </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'released' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('released')}
        >
          <Icon name="check-circle" size={16} />
          <span style={{ marginLeft: 6 }}>Released History</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'locations' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          <Icon name="warehouse" size={16} />
          <span style={{ marginLeft: 6 }}>Locations</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'transfers' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          <Icon name="stock-transfers" size={16} />
          <span style={{ marginLeft: 6 }}>Transfers</span>
        </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'requests' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Icon name="package" size={16} />
            <span style={{ marginLeft: 6 }}>Stock Requests</span>
            {stockRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className={styles.tabBadge}>{stockRequests.filter(r => r.status === 'pending').length}</span>
            )}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'returns' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            <Icon name="rotate" size={16} />
            <span style={{ marginLeft: 6 }}>Returns</span>
            {returns.filter(r => r.status === 'pending').length > 0 && (
              <span className={styles.tabBadge}>{returns.filter(r => r.status === 'pending').length}</span>
            )}
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

          {/* Low Stock Alerts */}
          <div className={styles.lowStockSection}>
            <h3 className={styles.sectionTitle}>
              <Icon name="alert-triangle" size={20} />
              <span style={{ marginLeft: 8 }}>Low Stock Alerts</span>
            </h3>
            {products.filter(p => p.stock < 10).length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Icon name="check-circle" size={48} />
                </div>
                <h3>All Stock Levels Healthy</h3>
                <p>No products are running low on stock</p>
              </div>
            ) : (
              <div className={styles.lowStockList}>
                {products.filter(p => p.stock < 10).slice(0, 5).map(product => (
                  <div key={product.id} className={styles.lowStockItem}>
                    <div className={styles.lowStockInfo}>
                      <div className={styles.lowStockName}>{product.name}</div>
                      <div className={styles.lowStockLevel}>
                        Stock: <span className={styles.lowStockCount}>{product.stock}</span>
                      </div>
                    </div>
                    <div className={styles.lowStockActions}>
                      <button
                        className={styles.quickActionBtn}
                        onClick={() => {
                          setAdjustmentProduct(product);
                          setAdjustmentReason('recount');
                          setShowAdjustmentModal(true);
                        }}
                      >
                        Adjust
                      </button>
                      <button
                        className={styles.quickActionBtn}
                        onClick={() => {
                          setTransferProduct(product);
                          setShowTransferModal(true);
                        }}
                      >
                        Transfer
                      </button>
                    </div>
                  </div>
                ))}
                {products.filter(p => p.stock < 10).length > 5 && (
                  <div className={styles.viewAllLink}>
                    + {products.filter(p => p.stock < 10).length - 5} more products
                  </div>
                )}
              </div>
            )}
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
                      {location.type === 'main_store' && <Icon name="shop" size={24} />}
                      {location.type === 'back_store' && <Icon name="package" size={24} />}
                      {location.type === 'warehouse' && <Icon name="warehouse" size={24} />}
                      {!['main_store', 'back_store', 'warehouse'].includes(location.type) && <Icon name="map-pin" size={24} />}
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
                   <div className={styles.locationIcon}><Icon name="branches" size={24} /></div>
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

          {pendingInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="check-circle" size={48} />
              </div>
              <h3>No Pending Releases</h3>
              <p>All invoices have been processed</p>
            </div>
          ) : (
            <div className={styles.invoiceList}>
              {pendingInvoices.filter(inv => 
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
                      <Icon name="clipboard" size={16} />
                      <span style={{ marginLeft: 6 }}>Review & Release</span>
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

          {releasedInvoices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="check-circle" size={48} />
              </div>
              <h3>No Released Invoices</h3>
              <p>No invoices have been released yet</p>
            </div>
          ) : (
            <div className={styles.invoiceList}>
              {releasedInvoices.filter(inv => 
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

      {/* Stock Requests Tab */}
      {activeTab === 'requests' && (
        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h3 className={styles.productsTitle}>Stock Requests</h3>
          </div>
          
          {stockRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="inbox" size={48} />
              </div>
              <h3>No Stock Requests</h3>
              <p>No stock requests have been submitted yet</p>
            </div>
          ) : (
            <div className={styles.invoiceList}>
              {stockRequests.map(request => (
                <div key={request.id} className={styles.invoiceCard}>
                  <div className={styles.invoiceHeader}>
                    <div>
                      <h3>{request.productName}</h3>
                      <p className={styles.customerInfo}>Quantity: {request.quantity}</p>
                    </div>
                    <div className={styles.invoiceMeta}>
                      <span className={styles.date}>{new Date(request.requestedAt?.toDate?.() || request.requestedAt).toLocaleDateString()}</span>
                      <span className={`${styles.statusBadge} ${
                        request.status === 'pending' ? styles.statusPending :
                        request.status === 'approved' ? styles.statusReleased :
                        styles.statusRejected
                      }`}>{request.status}</span>
                    </div>
                  </div>
                  
                  <div className={styles.invoiceDetails}>
                    <p><strong>Location:</strong> {request.location}</p>
                    <p><strong>Requested By:</strong> {request.requestedBy}</p>
                    {request.status === 'pending' && (
                      <div className={styles.invoiceActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => {
                            setSelectedStockRequest(request);
                            setShowStockRequestModal(true);
                          }}
                        >
                          Process Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h3 className={styles.productsTitle}>Returns</h3>
          </div>
          
          {returns.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="archive" size={48} />
              </div>
              <h3>No Returns</h3>
              <p>No returns have been submitted yet</p>
            </div>
          ) : (
            <div className={styles.invoiceList}>
              {returns.map(returnItem => (
                <div key={returnItem.id} className={styles.invoiceCard}>
                  <div className={styles.invoiceHeader}>
                    <div>
                      <h3>{returnItem.productName}</h3>
                      <p className={styles.customerInfo}>Quantity: {returnItem.quantity}</p>
                    </div>
                    <div className={styles.invoiceMeta}>
                      <span className={styles.date}>{new Date(returnItem.returnedAt?.toDate?.() || returnItem.returnedAt).toLocaleDateString()}</span>
                      <span className={`${styles.statusBadge} ${
                        returnItem.status === 'pending' ? styles.statusPending :
                        returnItem.status === 'approved' ? styles.statusReleased :
                        styles.statusRejected
                      }`}>{returnItem.status}</span>
                    </div>
                  </div>
                  
                  <div className={styles.invoiceDetails}>
                    <p><strong>Location:</strong> {returnItem.location}</p>
                    <p><strong>Reason:</strong> {returnItem.reason}</p>
                    <p><strong>Customer:</strong> {returnItem.customerName}</p>
                    {returnItem.status === 'pending' && (
                      <div className={styles.invoiceActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setShowReturnModal(true);
                          }}
                        >
                          Process Return
                        </button>
                      </div>
                    )}
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
                      {location.type === 'main_store' && <Icon name="shop" size={24} />}
                      {location.type === 'back_store' && <Icon name="package" size={24} />}
                      {location.type === 'warehouse' && <Icon name="warehouse" size={24} />}
                      {!['main_store', 'back_store', 'warehouse'].includes(location.type) && <Icon name="map-pin" size={24} />}
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
            <h3 className={styles.productsTitle}>Stock Transfers</h3>
            <button
              className={`${styles.actionButton} ${styles.addButton}`}
              onClick={() => setShowTransferModal(true)}
            >
              + New Transfer
            </button>
          </div>
          
          {transferHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="truck" size={48} />
              </div>
              <h3>No Transfer History</h3>
              <p>No stock transfers have been recorded yet</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {transferHistory.map(transfer => (
                <div key={transfer.id} className={styles.historyItem}>
                  <div className={styles.historyIcon}>
                    <Icon name="truck" size={24} />
                  </div>
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

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTransferModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Stock Transfer</h2>
              <button className={styles.modalClose} onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Product</label>
                <select
                  className={styles.formInput}
                  value={transferProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setTransferProduct(product || null);
                  }}
                >
                  <option value="">Select a product...</option>
                  {products.filter(p => p.stock > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              {transferProduct && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Source Location</label>
                    <select
                      className={styles.formInput}
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      {locationSummary.map(loc => (
                        <option key={loc.type} value={loc.type}>
                          {loc.name} (Stock: {transferProduct.stockByLocation?.[loc.type] || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Location</label>
                    <select
                      className={styles.formInput}
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                    >
                      <option value="">Select target location...</option>
                      {locationSummary
                        .filter(loc => loc.type !== selectedLocation)
                        .map(loc => (
                          <option key={loc.type} value={loc.type}>
                            {loc.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Quantity</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      min="1"
                      max={transferProduct.stockByLocation?.[selectedLocation] || 0}
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
                    />
                    <small>Available: {transferProduct.stockByLocation?.[selectedLocation] || 0}</small>
                  </div>
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalBtn} onClick={() => setShowTransferModal(false)}>Cancel</button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => {
                  if (transferProduct && transferTarget) {
                    handleTransfer(transferProduct, transferTarget, transferQuantity);
                    setShowTransferModal(false);
                    setTransferProduct(null);
                    setTransferQuantity(1);
                    setTransferTarget('');
                  }
                }}
                disabled={!transferProduct || !transferTarget || transferQuantity <= 0}
              >
                Transfer Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAdjustmentModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Stock Adjustment</h2>
              <button className={styles.modalClose} onClick={() => setShowAdjustmentModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Product</label>
                <select
                  className={styles.formInput}
                  value={adjustmentProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setAdjustmentProduct(product || null);
                  }}
                >
                  <option value="">Select a product...</option>
                  {products.filter(p => p.stock > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              {adjustmentProduct && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Location</label>
                    <select
                      className={styles.formInput}
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      {locationSummary.map(loc => (
                        <option key={loc.type} value={loc.type}>
                          {loc.name} (Stock: {adjustmentProduct.stockByLocation?.[loc.type] || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reason</label>
                    <select
                      className={styles.formInput}
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value as any)}
                    >
                      <option value="damaged">Damaged</option>
                      <option value="lost">Lost</option>
                      <option value="expired">Expired</option>
                      <option value="recount">Recount</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Quantity</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      min="1"
                      max={adjustmentProduct.stockByLocation?.[selectedLocation] || 0}
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 1)}
                    />
                    <small>Available: {adjustmentProduct.stockByLocation?.[selectedLocation] || 0}</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Notes</label>
                    <textarea
                      className={styles.formInput}
                      value={adjustmentNotes}
                      onChange={(e) => setAdjustmentNotes(e.target.value)}
                      placeholder="Add any additional notes..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalBtn} onClick={() => setShowAdjustmentModal(false)}>Cancel</button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => {
                  if (adjustmentProduct) {
                    handleAdjustment(adjustmentProduct, adjustmentQuantity, adjustmentReason, adjustmentNotes);
                  }
                }}
                disabled={!adjustmentProduct || adjustmentQuantity <= 0}
              >
                Adjust Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Request Modal */}
      {showStockRequestModal && selectedStockRequest && (
        <div className={styles.modalOverlay} onClick={() => setShowStockRequestModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Process Stock Request</h2>
              <button className={styles.modalClose} onClick={() => setShowStockRequestModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.invoiceDetails}>
                <p><strong>Product:</strong> {selectedStockRequest.productName}</p>
                <p><strong>Quantity:</strong> {selectedStockRequest.quantity}</p>
                <p><strong>Location:</strong> {selectedStockRequest.location}</p>
                <p><strong>Requested By:</strong> {selectedStockRequest.requestedBy}</p>
                <p><strong>Requested At:</strong> {new Date(selectedStockRequest.requestedAt?.toDate?.() || selectedStockRequest.requestedAt).toLocaleString()}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea
                  className={styles.formInput}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Add notes for this request..."
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalBtn} onClick={() => setShowStockRequestModal(false)}>Cancel</button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                onClick={() => handleStockRequest(selectedStockRequest.id, false)}
              >
                Reject
              </button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => handleStockRequest(selectedStockRequest.id, true)}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedReturn && (
        <div className={styles.modalOverlay} onClick={() => setShowReturnModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Process Return</h2>
              <button className={styles.modalClose} onClick={() => setShowReturnModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.invoiceDetails}>
                <p><strong>Product:</strong> {selectedReturn.productName}</p>
                <p><strong>Quantity:</strong> {selectedReturn.quantity}</p>
                <p><strong>Location:</strong> {selectedReturn.location}</p>
                <p><strong>Reason:</strong> {selectedReturn.reason}</p>
                <p><strong>Customer:</strong> {selectedReturn.customerName}</p>
                <p><strong>Returned At:</strong> {new Date(selectedReturn.returnedAt?.toDate?.() || selectedReturn.returnedAt).toLocaleString()}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea
                  className={styles.formInput}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Add notes for this return..."
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalBtn} onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                onClick={() => handleReturn(selectedReturn.id, false)}
              >
                Reject
              </button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => handleReturn(selectedReturn.id, true)}
              >
                Approve & Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}