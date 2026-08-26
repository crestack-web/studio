/**
 * Busmo Offline Manager
 * - Tracks online/offline state
 * - Caches products for offline POS
 * - Queues sales while offline and syncs when back online
 */

import { getOfflineSalesService, type OfflineSale } from '@/lib/services/offline-sales-service';

const PRODUCT_CACHE_DB = 'busmo-offline-products';
const PRODUCT_CACHE_STORE = 'products';
const PRODUCT_CACHE_VERSION = 1;

export type NetworkStatus = 'online' | 'offline';

type StatusListener = (status: NetworkStatus) => void;
type PendingCountListener = (count: number) => void;

class OfflineManager {
  private status: NetworkStatus = 'online';
  private statusListeners = new Set<StatusListener>();
  private pendingListeners = new Set<PendingCountListener>();
  private syncing = false;
  private productDb: IDBDatabase | null = null;
  private initialized = false;

  init() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;
    this.status = navigator.onLine ? 'online' : 'offline';

    window.addEventListener('online', () => {
      this.setStatus('online');
      void this.syncPendingSales();
    });
    window.addEventListener('offline', () => this.setStatus('offline'));

    // Kick a sync if we came back with pending work
    if (this.status === 'online') {
      void this.syncPendingSales();
    }
  }

  isOnline() {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine && this.status === 'online';
  }

  getStatus(): NetworkStatus {
    return this.status;
  }

  subscribe(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  subscribePendingCount(listener: PendingCountListener) {
    this.pendingListeners.add(listener);
    void this.emitPendingCount();
    return () => this.pendingListeners.delete(listener);
  }

  private setStatus(status: NetworkStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  private async emitPendingCount() {
    try {
      const count = await getOfflineSalesService().getPendingSalesCount();
      this.pendingListeners.forEach((l) => l(count));
    } catch {
      /* ignore */
    }
  }

  // ── Product cache (IndexedDB) ──────────────────────────────────────────

  private async openProductDb(): Promise<IDBDatabase> {
    if (this.productDb) return this.productDb;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(PRODUCT_CACHE_DB, PRODUCT_CACHE_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        this.productDb = req.result;
        resolve(req.result);
      };
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PRODUCT_CACHE_STORE)) {
          const store = db.createObjectStore(PRODUCT_CACHE_STORE, { keyPath: 'id' });
          store.createIndex('businessId', 'businessId', { unique: false });
        }
      };
    });
  }

  async cacheProducts(
    businessId: string,
    products: Array<{
      id: string;
      name: string;
      price: number;
      costPrice?: number;
      stock?: number;
      emoji?: string;
      category?: string;
      imageUrl?: string;
      active?: boolean;
    }>
  ) {
    if (typeof indexedDB === 'undefined') return;
    try {
      const db = await this.openProductDb();
      const tx = db.transaction(PRODUCT_CACHE_STORE, 'readwrite');
      const store = tx.objectStore(PRODUCT_CACHE_STORE);
      // Clear previous products for this business
      const index = store.index('businessId');
      const existing = await new Promise<IDBCursorWithValue | null>((resolve) => {
        const r = index.openCursor(IDBKeyRange.only(businessId));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => resolve(null);
      });
      // Delete one-by-one via cursor
      await new Promise<void>((resolve) => {
        const r = index.openCursor(IDBKeyRange.only(businessId));
        r.onsuccess = () => {
          const cursor = r.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        r.onerror = () => resolve();
      });
      for (const p of products) {
        store.put({ ...p, businessId, cachedAt: Date.now() });
      }
    } catch (e) {
      console.warn('[offline] product cache failed', e);
    }
  }

  async getCachedProducts(businessId: string) {
    if (typeof indexedDB === 'undefined') return [];
    try {
      const db = await this.openProductDb();
      return new Promise<any[]>((resolve) => {
        const tx = db.transaction(PRODUCT_CACHE_STORE, 'readonly');
        const index = tx.objectStore(PRODUCT_CACHE_STORE).index('businessId');
        const req = index.getAll(IDBKeyRange.only(businessId));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  // ── Offline sales queue ────────────────────────────────────────────────

  async queueSale(sale: Omit<OfflineSale, 'id' | 'synced' | 'syncAttempts' | 'createdAt'>) {
    const id = await getOfflineSalesService().storeOfflineSale(sale);
    await this.emitPendingCount();
    return id;
  }

  async getPendingCount(businessId?: string) {
    return getOfflineSalesService().getPendingSalesCount(businessId);
  }

  async syncPendingSales(businessId?: string): Promise<{ synced: number; failed: number }> {
    if (this.syncing || !this.isOnline()) return { synced: 0, failed: 0 };
    this.syncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pending = await getOfflineSalesService().getPendingSales(businessId);
      if (!pending.length) {
        await this.emitPendingCount();
        return { synced: 0, failed: 0 };
      }

      // Prefer server API (service role) — same path as online staff sales.
      // Firestore client writes fail under current auth/RLS and left the UI stuck.
      let token: string | null = null;
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token || null;
      } catch (e) {
        console.warn('[offline] could not read session for sync', e);
      }

      for (const sale of pending) {
        try {
          if (token) {
            await this.writeSaleViaApi(sale, token);
          } else {
            // Last resort: try client Supabase layer
            await this.writeSaleViaSupabaseClient(sale);
          }
          await getOfflineSalesService().markAsSynced(sale.id);
          synced += 1;
        } catch (err: any) {
          console.error('[offline] sync failed for', sale.id, err);
          failed += 1;
          await getOfflineSalesService().updateSyncAttempt(
            sale.id,
            err?.message || 'Sync failed'
          );
        }
      }

      await getOfflineSalesService().clearSyncedSales();
      await this.emitPendingCount();
    } finally {
      this.syncing = false;
    }

    return { synced, failed };
  }

  private async writeSaleViaApi(sale: OfflineSale, token: string) {
    const res = await fetch('/api/staff/record-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessId: sale.businessId,
        products: sale.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          costPrice: i.costPrice,
          quantity: i.quantity,
        })),
        total: sale.totalRevenue,
        paymentMethod: sale.paymentType || 'cash',
        paymentMethods: { [sale.paymentType || 'cash']: sale.totalRevenue },
        staffId: sale.recordedBy.staffId || sale.recordedBy.uid,
        staffName: sale.recordedBy.displayName,
        staffRole: sale.recordedBy.role,
        offlineId: sale.id,
        note: 'Synced from offline queue',
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || json.message || `Sync HTTP ${res.status}`);
    }
    return json.saleId as string;
  }

  private async writeSaleViaSupabaseClient(sale: OfflineSale) {
    const { addDoc, updateDoc, fetchDoc } = await import('@/lib/supabase-client-data');
    const products = sale.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      costPrice: i.costPrice,
      quantity: i.quantity,
    }));
    const id = await addDoc(`businesses/${sale.businessId}/sales`, {
      id: crypto.randomUUID(),
      products,
      items: products,
      total: sale.totalRevenue,
      totalRevenue: sale.totalRevenue,
      profit: sale.totalProfit,
      paymentMethod: sale.paymentType || 'cash',
      businessId: sale.businessId,
      soldBy: sale.recordedBy.staffId || sale.recordedBy.uid,
      soldByName: sale.recordedBy.displayName,
      recordedBy: sale.recordedBy,
      note: 'Synced from offline queue',
      offlineId: sale.id,
      status: 'completed',
      createdAt: sale.createdAt || new Date().toISOString(),
    });
    for (const item of sale.items) {
      try {
        const prod = await fetchDoc(`businesses/${sale.businessId}/products`, item.productId);
        if (prod) {
          const current = Number((prod as any).stock ?? (prod as any).stock_level ?? 0);
          await updateDoc(`businesses/${sale.businessId}/products`, item.productId, {
            stock: Math.max(0, current - item.quantity),
          });
        }
      } catch {
        /* ignore stock */
      }
    }
    return id;
  }

}

export const offlineManager = new OfflineManager();

/** Hook-friendly helpers */
export function isBrowserOffline() {
  if (typeof navigator === 'undefined') return false;
  return !navigator.onLine;
}
