/**
 * Offline Sales Storage Service
 * Stores sales in IndexedDB when user is offline
 * Syncs to Firestore when user comes back online
 */

const DB_NAME = 'busmo-offline-sales';
const DB_VERSION = 1;
const STORE_NAME = 'pending-sales';

export interface OfflineSale {
  id: string;
  businessId: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    costPrice: number;
    emoji?: string;
  }>;
  paymentType: 'cash' | 'transfer' | 'card' | 'pos' | 'credit' | 'split';
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  recordedBy: {
    uid: string;
    email: string;
    displayName: string;
    role: string;
    staffId?: string | null;
  };
  createdAt: string;
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: string;
  syncError?: string;
}

class OfflineSalesService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB database
   */
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error opening offline sales database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Offline sales database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('businessId', 'businessId', { unique: false });
          objectStore.createIndex('synced', 'synced', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Store a sale for offline sync
   */
  async storeOfflineSale(sale: Omit<OfflineSale, 'id' | 'synced' | 'syncAttempts' | 'createdAt'>): Promise<string> {
    if (!this.db) {
      await this.initDB();
    }

    const offlineSale: OfflineSale = {
      ...sale,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add(offlineSale);

      request.onsuccess = () => {
        console.log('Sale stored offline:', offlineSale.id);
        resolve(offlineSale.id);
      };

      request.onerror = () => {
        console.error('Error storing offline sale:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending (unsynced) sales
   */
  async getPendingSales(businessId?: string): Promise<OfflineSale[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        let sales = request.result;
        
        // Filter by synced status (only unsynced sales)
        sales = sales.filter((sale: OfflineSale) => !sale.synced);
        
        // Filter by businessId if provided
        if (businessId) {
          sales = sales.filter((sale: OfflineSale) => sale.businessId === businessId);
        }
        
        // Sort by creation date (oldest first)
        sales.sort((a: OfflineSale, b: OfflineSale) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        resolve(sales);
      };

      request.onerror = () => {
        console.error('Error getting pending sales:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark a sale as synced
   */
  async markAsSynced(saleId: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(saleId);

      request.onsuccess = () => {
        const sale = request.result;
        if (sale) {
          sale.synced = true;
          const updateRequest = objectStore.put(sale);
          
          updateRequest.onsuccess = () => {
            console.log('Sale marked as synced:', saleId);
            resolve();
          };
          
          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Update sync attempt count and error
   */
  async updateSyncAttempt(saleId: string, error?: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(saleId);

      request.onsuccess = () => {
        const sale = request.result;
        if (sale) {
          sale.syncAttempts += 1;
          sale.lastSyncAttempt = new Date().toISOString();
          if (error) {
            sale.syncError = error;
          }
          const updateRequest = objectStore.put(sale);
          
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete a sale from offline storage
   */
  async deleteSale(saleId: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(saleId);

      request.onsuccess = () => {
        console.log('Sale deleted from offline storage:', saleId);
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting offline sale:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get count of pending sales
   */
  async getPendingSalesCount(businessId?: string): Promise<number> {
    const sales = await this.getPendingSales(businessId);
    return sales.length;
  }

  /**
   * Clear all synced sales (cleanup)
   */
  async clearSyncedSales(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('Cleared all synced sales');
          resolve();
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Singleton instance
let offlineSalesService: OfflineSalesService | null = null;

export function getOfflineSalesService(): OfflineSalesService {
  if (!offlineSalesService) {
    offlineSalesService = new OfflineSalesService();
  }
  return offlineSalesService;
}
