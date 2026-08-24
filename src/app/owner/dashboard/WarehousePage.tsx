'use client';

/**
 * WarehousePage — inventory locations, transfers, invoice release, adjustments.
 * Redesigned UI with clearer flows; data stays on businesses/{id}/…
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import {
  Package,
  MapPin,
  ArrowLeftRight,
  ClipboardList,
  RotateCcw,
  Plus,
  RefreshCw,
  Search,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { ensureFirebaseAuth } from '@/lib/ensure-firebase-auth';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
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
  lowStockThreshold: number;
}

interface StockLocation {
  id: string;
  name: string;
  type: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
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
  notes?: string;
  recordedBy?: { displayName?: string; role?: string };
}

type TabId =
  | 'overview'
  | 'pending'
  | 'released'
  | 'locations'
  | 'transfers'
  | 'requests'
  | 'returns';

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Stock', Icon: Package },
  { id: 'pending', label: 'To release', Icon: ClipboardList },
  { id: 'released', label: 'Released', Icon: CheckCircle2 },
  { id: 'locations', label: 'Locations', Icon: MapPin },
  { id: 'transfers', label: 'Transfers', Icon: ArrowLeftRight },
  { id: 'requests', label: 'Requests', Icon: AlertTriangle },
  { id: 'returns', label: 'Returns', Icon: RotateCcw },
];

function locLabel(id: string, locations: StockLocation[]) {
  return locations.find((l) => l.id === id)?.name || id.replace(/_/g, ' ');
}

export function WarehousePage() {
  const { showToast, user, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId: branchBusinessId } = useBranch();

  const [businessId, setBusinessId] = useState<string | null>(
    branchBusinessId || user?.businessId || null
  );
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stockRequests, setStockRequests] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  // Modals
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [creatingLocation, setCreatingLocation] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferQty, setTransferQty] = useState(1);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState<
    'damaged' | 'lost' | 'expired' | 'recount'
  >('damaged');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releasing, setReleasing] = useState(false);

  const db = () => initializeFirebase().firestore;

  const resolveBusinessId = useCallback(async (): Promise<string | null> => {
    if (branchBusinessId) return branchBusinessId;
    if (user?.businessId) return user.businessId;
    try {
      await ensureFirebaseAuth();
      const uid = user?.id || getAuthCurrentUser()?.uid;
      if (!uid) return null;
      const firestore = db();
      if (!firestore) return null;
      const snap = await getDoc(doc(firestore, 'users', uid));
      return snap.exists() ? snap.data()?.businessId || null : null;
    } catch {
      return null;
    }
  }, [branchBusinessId, user?.businessId, user?.id]);

  const loadLocations = useCallback(
    async (bid: string) => {
      const firestore = db();
      if (!firestore) return [];
      const snap = await getDocs(
        collection(firestore, 'businesses', bid, 'stockLocations')
      );
      let list: StockLocation[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || d.id,
          type: data.type || 'warehouse',
        });
      });
      list = list.filter(
        (loc, i, self) => self.findIndex((x) => x.id === loc.id) === i
      );

      if (!list.some((l) => l.id === 'main_store')) {
        await setDoc(
          doc(firestore, 'businesses', bid, 'stockLocations', 'main_store'),
          {
            name: 'Main Store',
            type: 'store',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
        list.unshift({ id: 'main_store', name: 'Main Store', type: 'store' });
      }

      const order = ['main_store', 'warehouse', 'back_store'];
      list.sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      setStockLocations(list);
      return list;
    },
    []
  );

  const loadProducts = useCallback(
    async (bid: string) => {
      const firestore = db();
      if (!firestore) return;
      const snap = await getDocs(
        collection(firestore, 'businesses', bid, 'products')
      );
      const list: Product[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (String(data.status || '').toLowerCase() === 'deleted') return;
        const stockByLocation =
          data.stockByLocation && typeof data.stockByLocation === 'object'
            ? { ...data.stockByLocation }
            : { main_store: data.stock || data.quantity || 0 };
        list.push({
          id: d.id,
          name: data.name || 'Unnamed',
          sku: data.sku || data.barcode || '',
          category: data.category || '',
          stock: data.stock ?? data.quantity ?? 0,
          stockByLocation,
          costPrice: data.cost || data.costPrice || 0,
          sellingPrice: data.price || 0,
          lowStockThreshold: data.lowStockThreshold || 10,
        });
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(list);
    },
    []
  );

  const loadTransfers = useCallback(async (bid: string) => {
    const firestore = db();
    if (!firestore) return;
    try {
      const snap = await getDocs(
        collection(firestore, 'businesses', bid, 'stockTransfers')
      );
      const rows: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        rows.push({
          id: d.id,
          ...data,
          transferredAt: data.transferredAt?.toDate
            ? data.transferredAt.toDate()
            : data.transferredAt
              ? new Date(data.transferredAt)
              : new Date(),
        });
      });
      rows.sort(
        (a, b) =>
          new Date(b.transferredAt).getTime() -
          new Date(a.transferredAt).getTime()
      );
      setTransferHistory(rows.slice(0, 80));
    } catch (e) {
      console.warn('[Warehouse] transfers load failed', e);
    }
  }, []);

  const loadInvoices = useCallback(async (bid: string) => {
    const firestore = db();
    if (!firestore) return;
    try {
      const snap = await getDocs(
        collection(firestore, 'businesses', bid, 'invoices')
      );
      const rows: Invoice[] = [];
      snap.forEach((d) => {
        const data = d.data();
        rows.push({
          id: d.id,
          invoiceNumber: data.invoiceNumber || d.id.slice(-6),
          customerName: data.customerName || 'Walk-in',
          customerPhone: data.customerPhone || '',
          items: data.items || [],
          totalAmount: data.totalAmount || data.total || 0,
          sourceLocation: data.sourceLocation || 'Main Store',
          sourceLocationId: data.sourceLocationId || 'main_store',
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          releasedBy: data.releasedBy,
          notes: data.notes,
          recordedBy: data.recordedBy,
        });
      });
      rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setInvoices(rows);
    } catch (e) {
      console.warn('[Warehouse] invoices load failed', e);
    }
  }, []);

  const loadRequests = useCallback(async (bid: string) => {
    const firestore = db();
    if (!firestore) return;
    try {
      const snap = await getDocs(
        collection(firestore, 'businesses', bid, 'stockRequests')
      );
      const rows: any[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      setStockRequests(rows);
    } catch {
      setStockRequests([]);
    }
  }, []);

  const loadReturns = useCallback(async (bid: string) => {
    const firestore = db();
    if (!firestore) return;
    try {
      const snap = await getDocs(
        collection(firestore, 'businesses', bid, 'stockReturns')
      );
      const rows: any[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      setReturns(rows);
    } catch {
      setReturns([]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await ensureFirebaseAuth();
      const bid = await resolveBusinessId();
      if (!bid) {
        showToast('No business linked. Please refresh and try again.');
        return;
      }
      setBusinessId(bid);
      await loadLocations(bid);
      await Promise.all([
        loadProducts(bid),
        loadTransfers(bid),
        loadInvoices(bid),
        loadRequests(bid),
        loadReturns(bid),
      ]);
    } catch (e) {
      console.error('[Warehouse] refresh failed', e);
      showToast('Could not load warehouse data');
    } finally {
      setIsLoading(false);
    }
  }, [
    resolveBusinessId,
    loadLocations,
    loadProducts,
    loadTransfers,
    loadInvoices,
    loadRequests,
    loadReturns,
    showToast,
  ]);

  useEffect(() => {
    refreshAll();
  }, [branchBusinessId, user?.businessId]);

  const pendingInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'pending' || i.status === 'partial'),
    [invoices]
  );
  const releasedInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'released'),
    [invoices]
  );
  const pendingRequests = useMemo(
    () =>
      stockRequests.filter(
        (r) => !r.status || r.status === 'pending' || r.status === 'open'
      ),
    [stockRequests]
  );
  const pendingReturns = useMemo(
    () =>
      returns.filter(
        (r) => !r.status || r.status === 'pending' || r.status === 'open'
      ),
    [returns]
  );

  const locationSummaries = useMemo(() => {
    return stockLocations.map((loc) => {
      let units = 0;
      let value = 0;
      let productCount = 0;
      products.forEach((p) => {
        const q = p.stockByLocation?.[loc.id] || 0;
        if (q > 0) {
          productCount += 1;
          units += q;
          value += q * (p.costPrice || 0);
        }
      });
      return { ...loc, units, value, productCount };
    });
  }, [stockLocations, products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedLocation !== 'all') {
        const at = p.stockByLocation?.[selectedLocation] ?? 0;
        // When filtering by location, show products that have (or had) stock there,
        // or whose only recorded stock is at main_store for legacy products.
        if (at <= 0) {
          const hasAnyLoc = Object.keys(p.stockByLocation || {}).length > 0;
          if (hasAnyLoc) return false;
          if (selectedLocation !== 'main_store') return false;
        }
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedLocation]);

  const displayStock = (p: Product) => {
    if (selectedLocation === 'all') return p.stock;
    return p.stockByLocation?.[selectedLocation] ?? 0;
  };

  const totalUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
  const totalValue = products.reduce(
    (s, p) => s + (p.stock || 0) * (p.costPrice || 0),
    0
  );
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
  ).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;

  // ── Actions ────────────────────────────────────────────

  const createLocation = async () => {
    const name = newLocationName.trim();
    if (!name || !businessId) return;
    setCreatingLocation(true);
    try {
      const firestore = db();
      if (!firestore) throw new Error('Unavailable');
      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      await setDoc(
        doc(firestore, 'businesses', businessId, 'stockLocations', id || `loc_${Date.now()}`),
        {
          name,
          type: 'warehouse',
          createdAt: new Date().toISOString(),
          createdBy: user?.id || null,
        },
        { merge: true }
      );
      showToast(`Location “${name}” created`);
      setShowAddLocation(false);
      setNewLocationName('');
      await loadLocations(businessId);
    } catch (e: any) {
      showToast(e?.message || 'Failed to create location');
    } finally {
      setCreatingLocation(false);
    }
  };

  const deleteLocation = async (loc: StockLocation) => {
    if (!businessId || loc.id === 'main_store') {
      showToast('Main Store cannot be deleted');
      return;
    }
    if (!confirm(`Delete location “${loc.name}”? Stock maps are not auto-moved.`))
      return;
    try {
      const firestore = db();
      if (!firestore) return;
      await deleteDoc(
        doc(firestore, 'businesses', businessId, 'stockLocations', loc.id)
      );
      showToast('Location removed');
      await loadLocations(businessId);
    } catch (e: any) {
      showToast(e?.message || 'Delete failed');
    }
  };

  const openTransfer = (p: Product) => {
    setTransferProduct(p);
    const from =
      selectedLocation !== 'all'
        ? selectedLocation
        : stockLocations[0]?.id || 'main_store';
    setTransferFrom(from);
    const other = stockLocations.find((l) => l.id !== from);
    setTransferTo(other?.id || '');
    setTransferQty(1);
    setShowTransfer(true);
  };

  const submitTransfer = async () => {
    if (!businessId || !transferProduct || !transferFrom || !transferTo) return;
    if (transferFrom === transferTo) {
      showToast('Choose different source and destination');
      return;
    }
    const available =
      transferProduct.stockByLocation?.[transferFrom] ??
      (transferFrom === 'main_store' ? transferProduct.stock : 0);
    if (transferQty <= 0 || transferQty > available) {
      showToast(`Only ${available} units available at source`);
      return;
    }
    setTransferring(true);
    try {
      const firestore = db();
      if (!firestore) throw new Error('Unavailable');
      await runTransaction(firestore, async (tx) => {
        const ref = doc(
          firestore,
          'businesses',
          businessId,
          'products',
          transferProduct.id
        );
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('Product not found');
        const data = snap.data();
        const map = {
          ...(data.stockByLocation || {
            main_store: data.stock || 0,
          }),
        };
        const src = map[transferFrom] || 0;
        if (src < transferQty) throw new Error('Insufficient stock in source');
        map[transferFrom] = src - transferQty;
        map[transferTo] = (map[transferTo] || 0) + transferQty;
        const total = Object.values(map).reduce(
          (s: number, n: any) => s + (Number(n) || 0),
          0
        );
        tx.update(ref, {
          stockByLocation: map,
          stock: total,
          updatedAt: new Date(),
        });
        const logRef = doc(
          collection(firestore, 'businesses', businessId, 'stockTransfers')
        );
        tx.set(logRef, {
          productId: transferProduct.id,
          productName: transferProduct.name,
          fromLocation: transferFrom,
          toLocation: transferTo,
          quantity: transferQty,
          transferredBy: user?.id || null,
          transferredByName: user?.name || user?.email || '',
          transferredAt: Timestamp.now(),
        });
      });
      showToast('Stock transferred');
      setShowTransfer(false);
      await loadProducts(businessId);
      await loadTransfers(businessId);
    } catch (e: any) {
      showToast(e?.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const openAdjust = (p: Product) => {
    setAdjustProduct(p);
    setAdjustQty(1);
    setAdjustReason('damaged');
    setAdjustNotes('');
    setShowAdjust(true);
  };

  const submitAdjust = async () => {
    if (!businessId || !adjustProduct) return;
    if (adjustQty <= 0) {
      showToast('Enter a valid quantity');
      return;
    }
    setAdjusting(true);
    try {
      const firestore = db();
      if (!firestore) throw new Error('Unavailable');
      const loc =
        selectedLocation !== 'all' ? selectedLocation : 'main_store';
      await runTransaction(firestore, async (tx) => {
        const ref = doc(
          firestore,
          'businesses',
          businessId,
          'products',
          adjustProduct.id
        );
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('Product not found');
        const data = snap.data();
        const map = {
          ...(data.stockByLocation || { main_store: data.stock || 0 }),
        };
        if (adjustReason === 'recount') {
          map[loc] = adjustQty;
        } else {
          const cur = map[loc] || 0;
          if (cur < adjustQty) throw new Error('Not enough stock at location');
          map[loc] = cur - adjustQty;
        }
        const total = Object.values(map).reduce(
          (s: number, n: any) => s + (Number(n) || 0),
          0
        );
        tx.update(ref, {
          stockByLocation: map,
          stock: total,
          updatedAt: new Date(),
        });
        const logRef = doc(
          collection(firestore, 'businesses', businessId, 'stockAdjustments')
        );
        tx.set(logRef, {
          productId: adjustProduct.id,
          productName: adjustProduct.name,
          location: loc,
          quantity: adjustQty,
          reason: adjustReason,
          notes: adjustNotes,
          adjustedBy: user?.id || null,
          adjustedAt: Timestamp.now(),
        });
      });
      showToast(
        adjustReason === 'recount' ? 'Stock recounted' : 'Stock adjusted'
      );
      setShowAdjust(false);
      await loadProducts(businessId);
    } catch (e: any) {
      showToast(e?.message || 'Adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  const releaseInvoice = async (partial = false) => {
    if (!businessId || !selectedInvoice) return;
    setReleasing(true);
    try {
      const firestore = db();
      if (!firestore) throw new Error('Unavailable');
      await runTransaction(firestore, async (tx) => {
        for (const item of selectedInvoice.items) {
          const ref = doc(
            firestore,
            'businesses',
            businessId,
            'products',
            item.productId
          );
          const snap = await tx.get(ref);
          if (!snap.exists()) continue;
          const data = snap.data();
          const qty = partial
            ? Math.floor(item.quantity / 2)
            : item.quantity;
          const map = { ...(data.stockByLocation || {}) };
          const locId = selectedInvoice.sourceLocationId || 'main_store';
          if (map[locId] !== undefined) {
            map[locId] = Math.max(0, (map[locId] || 0) - qty);
          }
          const newStock = Math.max(0, (data.stock || 0) - qty);
          tx.update(ref, { stock: newStock, stockByLocation: map });
        }
      });
      await updateDoc(
        doc(firestore, 'businesses', businessId, 'invoices', selectedInvoice.id),
        {
          status: partial ? 'partial' : 'released',
          releasedBy: user?.name || user?.email || 'Owner',
          releasedAt: Timestamp.now(),
          notes: releaseNotes,
        }
      );
      showToast(partial ? 'Partially released' : 'Invoice released');
      setSelectedInvoice(null);
      setReleaseNotes('');
      await loadInvoices(businessId);
      await loadProducts(businessId);
    } catch (e: any) {
      showToast(e?.message || 'Release failed');
    } finally {
      setReleasing(false);
    }
  };

  const handleRequest = async (id: string, approved: boolean) => {
    if (!businessId) return;
    try {
      const firestore = db();
      if (!firestore) return;
      await updateDoc(
        doc(firestore, 'businesses', businessId, 'stockRequests', id),
        {
          status: approved ? 'approved' : 'rejected',
          reviewedAt: Timestamp.now(),
          reviewedBy: user?.id || null,
        }
      );
      showToast(approved ? 'Request approved' : 'Request rejected');
      await loadRequests(businessId);
    } catch {
      showToast('Could not update request');
    }
  };

  const handleReturn = async (id: string, approved: boolean) => {
    if (!businessId) return;
    try {
      const firestore = db();
      if (!firestore) return;
      await updateDoc(
        doc(firestore, 'businesses', businessId, 'stockReturns', id),
        {
          status: approved ? 'approved' : 'rejected',
          reviewedAt: Timestamp.now(),
          reviewedBy: user?.id || null,
        }
      );
      showToast(approved ? 'Return approved' : 'Return rejected');
      await loadReturns(businessId);
    } catch {
      showToast('Could not update return');
    }
  };

  // ── Render ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Loading warehouse…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>
            <Warehouse size={22} strokeWidth={2.2} aria-hidden />
            Warehouse
          </h1>
          <p className={styles.heroSub}>
            Track stock by location, move inventory, and release wholesale
            invoices — all in one place.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigateTo('receive-stock' as any)}
          >
            <Package size={16} />
            Receive stock
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowAddLocation(true)}
          >
            <Plus size={16} />
            Location
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => refreshAll()}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total units</div>
          <div className={styles.statValue}>{totalUnits.toLocaleString()}</div>
          <div className={styles.statHint}>{products.length} products</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Stock value (cost)</div>
          <div className={`${styles.statValue} ${styles.statValueOk}`}>
            {formatMoney(totalValue)}
          </div>
          <div className={styles.statHint}>Across all locations</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Low stock</div>
          <div
            className={`${styles.statValue} ${
              lowStockCount ? styles.statValueWarn : ''
            }`}
          >
            {lowStockCount}
          </div>
          <div className={styles.statHint}>{outOfStock} out of stock</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Awaiting release</div>
          <div
            className={`${styles.statValue} ${
              pendingInvoices.length ? styles.statValueDanger : ''
            }`}
          >
            {pendingInvoices.length}
          </div>
          <div className={styles.statHint}>
            {stockLocations.length} locations
          </div>
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Warehouse sections">
        {TABS.map((tab) => {
          let count = 0;
          if (tab.id === 'pending') count = pendingInvoices.length;
          if (tab.id === 'requests') count = pendingRequests.length;
          if (tab.id === 'returns') count = pendingReturns.length;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${
                activeTab === tab.id ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              {tab.label}
              {count > 0 ? <span className={styles.badge}>{count}</span> : null}
            </button>
          );
        })}
      </nav>

      {/* ── Stock overview ── */}
      {activeTab === 'overview' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} aria-hidden />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
              />
            </div>
            <select
              className={styles.select}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">All locations</option>
              {stockLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {locationSummaries.length > 0 && (
            <div className={styles.locationGrid}>
              {locationSummaries.map((loc) => (
                <div
                  key={loc.id}
                  className={`${styles.locCard} ${
                    selectedLocation === loc.id ? styles.locCardActive : ''
                  }`}
                  onClick={() =>
                    setSelectedLocation(
                      selectedLocation === loc.id ? 'all' : loc.id
                    )
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    setSelectedLocation(
                      selectedLocation === loc.id ? 'all' : loc.id
                    )
                  }
                >
                  <div className={styles.locName}>{loc.name}</div>
                  <div className={styles.locMeta}>{loc.type}</div>
                  <div className={styles.locStats}>
                    <span>{loc.units} units</span>
                    <span>{loc.productCount} SKUs</span>
                    <span>{formatMoney(loc.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>
                Inventory
                {selectedLocation !== 'all'
                  ? ` · ${locLabel(selectedLocation, stockLocations)}`
                  : ''}
              </h2>
            </div>
            {filteredProducts.length === 0 ? (
              <div className={styles.empty}>
                <h3>No products found</h3>
                <p>Add products or clear filters to see stock here.</p>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => navigateTo('add-product' as any)}
                >
                  Add product
                </button>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Stock</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const qty = displayStock(p);
                      const low = qty > 0 && qty <= p.lowStockThreshold;
                      const oos = qty <= 0;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className={styles.productCell}>
                              <span className={styles.productName}>{p.name}</span>
                              {p.sku ? (
                                <span className={styles.productSku}>{p.sku}</span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <strong>{qty}</strong>
                          </td>
                          <td>{formatMoney(qty * (p.costPrice || 0))}</td>
                          <td>
                            {oos ? (
                              <span className={`${styles.pill} ${styles.pillDanger}`}>
                                Out
                              </span>
                            ) : low ? (
                              <span className={`${styles.pill} ${styles.pillWarn}`}>
                                Low
                              </span>
                            ) : (
                              <span className={`${styles.pill} ${styles.pillOk}`}>
                                OK
                              </span>
                            )}
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => openTransfer(p)}
                              >
                                Transfer
                              </button>
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => openAdjust(p)}
                              >
                                Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Pending invoices ── */}
      {activeTab === 'pending' && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Invoices to release</h2>
          </div>
          {pendingInvoices.length === 0 ? (
            <div className={styles.empty}>
              <h3>Nothing pending</h3>
              <p>Wholesale invoices waiting for warehouse release appear here.</p>
            </div>
          ) : (
            pendingInvoices.map((inv) => (
              <div key={inv.id} className={styles.listCard}>
                <div className={styles.listMain}>
                  <div className={styles.listTitle}>
                    #{inv.invoiceNumber} · {inv.customerName}
                  </div>
                  <div className={styles.listMeta}>
                    {inv.items.length} lines · {formatMoney(inv.totalAmount)} ·{' '}
                    {inv.sourceLocation} · {inv.createdAt.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    setSelectedInvoice(inv);
                    setReleaseNotes('');
                  }}
                >
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Released ── */}
      {activeTab === 'released' && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Released invoices</h2>
          </div>
          {releasedInvoices.length === 0 ? (
            <div className={styles.empty}>
              <h3>No releases yet</h3>
              <p>Completed warehouse releases will list here.</p>
            </div>
          ) : (
            releasedInvoices.slice(0, 40).map((inv) => (
              <div key={inv.id} className={styles.listCard}>
                <div className={styles.listMain}>
                  <div className={styles.listTitle}>
                    #{inv.invoiceNumber} · {inv.customerName}
                  </div>
                  <div className={styles.listMeta}>
                    {formatMoney(inv.totalAmount)} · Released by{' '}
                    {inv.releasedBy || '—'}
                  </div>
                </div>
                <span className={`${styles.pill} ${styles.pillOk}`}>Released</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Locations ── */}
      {activeTab === 'locations' && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Stock locations</h2>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setShowAddLocation(true)}
            >
              + Add
            </button>
          </div>
          <div className={styles.locationGrid}>
            {locationSummaries.map((loc) => (
              <div key={loc.id} className={styles.locCard}>
                <div className={styles.locName}>{loc.name}</div>
                <div className={styles.locMeta}>
                  {loc.type} · id: {loc.id}
                </div>
                <div className={styles.locStats}>
                  <span>{loc.units} units</span>
                  <span>{formatMoney(loc.value)}</span>
                </div>
                {loc.id !== 'main_store' && (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    style={{ marginTop: 10, width: '100%' }}
                    onClick={() => deleteLocation(loc)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transfers ── */}
      {activeTab === 'transfers' && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Transfer history</h2>
          </div>
          {transferHistory.length === 0 ? (
            <div className={styles.empty}>
              <h3>No transfers logged</h3>
              <p>Move stock between locations from the Stock tab.</p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {transferHistory.map((t) => (
                <div key={t.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div>
                    <div className={styles.listTitle}>
                      {t.productName} · {t.quantity} units
                    </div>
                    <div className={styles.listMeta}>
                      {locLabel(t.fromLocation, stockLocations)} →{' '}
                      {locLabel(t.toLocation, stockLocations)}
                      {t.transferredAt
                        ? ` · ${new Date(t.transferredAt).toLocaleString()}`
                        : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Requests ── */}
      {activeTab === 'requests' && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Stock requests</h2>
          </div>
          {stockRequests.length === 0 ? (
            <div className={styles.empty}>
              <h3>No requests</h3>
              <p>Branch or staff restock requests show up here.</p>
            </div>
          ) : (
            stockRequests.map((r) => (
              <div key={r.id} className={styles.listCard}>
                <div className={styles.listMain}>
                  <div className={styles.listTitle}>
                    {r.productName || r.title || 'Stock request'}
                  </div>
                  <div className={styles.listMeta}>
                    Qty {r.quantity || '—'} · {r.status || 'pending'}
                  </div>
                </div>
                {(!r.status || r.status === 'pending' || r.status === 'open') && (
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => handleRequest(r.id, true)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => handleRequest(r.id, false)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Returns ── */}
      {activeTab === 'returns' && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Returns</h2>
          </div>
          {returns.length === 0 ? (
            <div className={styles.empty}>
              <h3>No returns</h3>
              <p>Customer or branch returns awaiting review appear here.</p>
            </div>
          ) : (
            returns.map((r) => (
              <div key={r.id} className={styles.listCard}>
                <div className={styles.listMain}>
                  <div className={styles.listTitle}>
                    {r.productName || r.reason || 'Return'}
                  </div>
                  <div className={styles.listMeta}>
                    Qty {r.quantity || '—'} · {r.status || 'pending'}
                  </div>
                </div>
                {(!r.status || r.status === 'pending' || r.status === 'open') && (
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => handleReturn(r.id, true)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => handleReturn(r.id, false)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Add location modal ── */}
      {showAddLocation && (
        <div className={styles.overlay} onClick={() => setShowAddLocation(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className={styles.modalHead}>
              <h2>New location</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowAddLocation(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label htmlFor="loc-name">Location name</label>
                <input
                  id="loc-name"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g. Back store, Cold room"
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setShowAddLocation(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={!newLocationName.trim() || creatingLocation}
                onClick={createLocation}
              >
                {creatingLocation ? 'Creating…' : 'Create location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer modal ── */}
      {showTransfer && transferProduct && (
        <div className={styles.overlay} onClick={() => setShowTransfer(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className={styles.modalHead}>
              <h2>Transfer stock</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowTransfer(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontWeight: 650 }}>{transferProduct.name}</p>
              <div className={styles.field}>
                <label>From</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                >
                  {stockLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} (
                      {transferProduct.stockByLocation?.[l.id] || 0} available)
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>To</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                >
                  <option value="">Select destination</option>
                  {stockLocations
                    .filter((l) => l.id !== transferFrom)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={transferQty}
                  onChange={(e) =>
                    setTransferQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setShowTransfer(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={transferring || !transferTo}
                onClick={submitTransfer}
              >
                {transferring ? 'Moving…' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Adjust modal ── */}
      {showAdjust && adjustProduct && (
        <div className={styles.overlay} onClick={() => setShowAdjust(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className={styles.modalHead}>
              <h2>Adjust stock</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowAdjust(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontWeight: 650 }}>{adjustProduct.name}</p>
              <div className={styles.field}>
                <label>Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as any)}
                >
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost / theft</option>
                  <option value="expired">Expired</option>
                  <option value="recount">Recount (set absolute qty)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>
                  {adjustReason === 'recount'
                    ? 'New quantity'
                    : 'Quantity to remove'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjustQty}
                  onChange={(e) =>
                    setAdjustQty(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>Notes</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Optional details…"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setShowAdjust(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={adjusting}
                onClick={submitAdjust}
              >
                {adjusting ? 'Saving…' : 'Save adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice release modal ── */}
      {selectedInvoice && (
        <div className={styles.overlay} onClick={() => setSelectedInvoice(null)}>
          <div
            className={`${styles.modal} ${styles.modalWide}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className={styles.modalHead}>
              <h2>Release #{selectedInvoice.invoiceNumber}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div>
                  <span>Customer</span>
                  <strong>{selectedInvoice.customerName}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{selectedInvoice.customerPhone || '—'}</strong>
                </div>
                <div>
                  <span>Source</span>
                  <strong>{selectedInvoice.sourceLocation}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatMoney(selectedInvoice.totalAmount)}</strong>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.field}>
                <label>Release notes</label>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Optional notes for this release…"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setSelectedInvoice(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={releasing}
                onClick={() => releaseInvoice(true)}
              >
                Partial release
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={releasing}
                onClick={() => releaseInvoice(false)}
              >
                {releasing ? 'Releasing…' : 'Release full'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WarehousePage;
