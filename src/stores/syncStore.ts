
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: string;
  retries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

interface SyncState {
  operations: SyncOperation[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAttempt: string | null;
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries' | 'status'>) => void;
  setOnlineStatus: (online: boolean) => void;
  syncOperations: () => Promise<void>;
  clearCompletedOperations: () => void;
  retryFailedOperations: () => Promise<void>;
}

class SyncDB {
  private dbName = 'skillzone-sync';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('sync_operations')) {
          const syncStore = db.createObjectStore('sync_operations', { keyPath: 'id' });
          syncStore.createIndex('status', 'status');
          syncStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async saveOperation(operation: SyncOperation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['sync_operations'], 'readwrite');
    const store = transaction.objectStore('sync_operations');
    await store.put(operation);
  }

  async getAllOperations(): Promise<SyncOperation[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['sync_operations'], 'readonly');
    const store = transaction.objectStore('sync_operations');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteOperation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['sync_operations'], 'readwrite');
    const store = transaction.objectStore('sync_operations');
    await store.delete(id);
  }
}

const syncDB = new SyncDB();

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      operations: [],
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncAttempt: null,

      addOperation: (operationData) => {
        const operation: SyncOperation = {
          ...operationData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          retries: 0,
          status: 'pending'
        };

        set(state => ({
          operations: [...state.operations, operation]
        }));

        // Auto-sync if online
        if (get().isOnline && !get().isSyncing) {
          setTimeout(() => get().syncOperations(), 1000);
        }
      },

      setOnlineStatus: (online) => {
        set({ isOnline: online });
        
        if (online && !get().isSyncing) {
          // Trigger sync when coming back online
          setTimeout(() => get().syncOperations(), 2000);
        }
      },

      syncOperations: async () => {
        const { operations, isOnline, isSyncing } = get();
        
        if (!isOnline || isSyncing || operations.filter(op => op.status === 'pending').length === 0) {
          return;
        }

        set({ isSyncing: true, lastSyncAttempt: new Date().toISOString() });

        try {
          await syncDB.init();
          
          const pendingOps = operations.filter(op => op.status === 'pending');
          
          for (const operation of pendingOps) {
            try {
              // Update operation status to syncing
              const updatedOp = { ...operation, status: 'syncing' as const };
              await syncDB.saveOperation(updatedOp);
              
              set(state => ({
                operations: state.operations.map(op => 
                  op.id === operation.id ? updatedOp : op
                )
              }));

              // Simulate sync operation (replace with actual Supabase calls when enabled)
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Mark as completed
              const completedOp = { ...updatedOp, status: 'completed' as const };
              await syncDB.saveOperation(completedOp);
              
              set(state => ({
                operations: state.operations.map(op => 
                  op.id === operation.id ? completedOp : op
                )
              }));

            } catch (error) {
              console.error('Sync operation failed:', error);
              
              const failedOp = { 
                ...operation, 
                status: 'failed' as const, 
                retries: operation.retries + 1 
              };
              
              await syncDB.saveOperation(failedOp);
              
              set(state => ({
                operations: state.operations.map(op => 
                  op.id === operation.id ? failedOp : op
                )
              }));
            }
          }
        } catch (error) {
          console.error('Sync process failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      clearCompletedOperations: () => {
        set(state => ({
          operations: state.operations.filter(op => op.status !== 'completed')
        }));
      },

      retryFailedOperations: async () => {
        set(state => ({
          operations: state.operations.map(op => 
            op.status === 'failed' ? { ...op, status: 'pending' } : op
          )
        }));
        
        await get().syncOperations();
      }
    }),
    {
      name: 'skillzone-sync',
      partialize: (state) => ({
        operations: state.operations,
        lastSyncAttempt: state.lastSyncAttempt
      })
    }
  )
);

// Initialize online/offline detection
window.addEventListener('online', () => {
  useSyncStore.getState().setOnlineStatus(true);
});

window.addEventListener('offline', () => {
  useSyncStore.getState().setOnlineStatus(false);
});
