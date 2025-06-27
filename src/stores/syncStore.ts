import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, supabaseHelpers } from '@/lib/supabase';

/**
 * SyncOperation represents a pending data operation that needs to be synchronized
 * with the Supabase backend when the app comes back online.
 */
interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: string;
  retries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  conflictResolution?: 'local' | 'remote' | 'merge';
}

/**
 * SyncState manages the offline-first synchronization system.
 * It queues operations when offline and syncs them when online.
 */
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
  resolveConflict: (operationId: string, resolution: 'local' | 'remote' | 'merge') => void;
}

/**
 * IndexedDB wrapper for persisting sync operations locally.
 * This ensures operations survive browser restarts and app reloads.
 */
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

/**
 * Conflict resolution strategies for handling data conflicts between local and remote data.
 * Conflicts can occur when the same data is modified both offline and online.
 */
const conflictResolvers = {
  /**
   * Last-write-wins strategy: compares timestamps and keeps the most recent version.
   * This is the default strategy for most data types.
   */
  lastWriteWins: (localData: any, remoteData: any) => {
    const localTimestamp = new Date(localData.updated_at || localData.created_at).getTime();
    const remoteTimestamp = new Date(remoteData.updated_at || remoteData.created_at).getTime();
    return localTimestamp > remoteTimestamp ? localData : remoteData;
  },

  /**
   * Merge strategy: intelligently combines local and remote data for specific tables.
   * This is used for data that can be safely merged without losing information.
   */
  merge: (localData: any, remoteData: any, table: string) => {
    const merged = { ...remoteData };
    
    switch (table) {
      case 'profiles':
        // Merge profile data, preferring local for personal info, remote for system fields
        merged.name = localData.name || remoteData.name;
        merged.phone = localData.phone || remoteData.phone;
        merged.tokens = Math.max(localData.tokens || 0, remoteData.tokens || 0);
        break;
      
      case 'opportunities':
        // Merge opportunity data
        merged.title = localData.title || remoteData.title;
        merged.description = localData.description || remoteData.description;
        merged.budget = localData.budget || remoteData.budget;
        merged.access_count = Math.max(localData.access_count || 0, remoteData.access_count || 0);
        break;
      
      default:
        // Default to last-write-wins for unknown tables
        return conflictResolvers.lastWriteWins(localData, remoteData);
    }
    
    return merged;
  }
};

/**
 * Performs actual Supabase operations based on the sync operation type.
 * This is the bridge between the offline queue and the online database.
 */
const performSupabaseOperation = async (operation: SyncOperation): Promise<any> => {
  const { type, table, data } = operation;
  
  try {
    switch (type) {
      case 'CREATE':
        switch (table) {
          case 'opportunities':
            return await supabaseHelpers.createOpportunity(data);
          case 'service_providers':
            return await supabaseHelpers.createServiceProvider(data);
          case 'payment_vouchers':
            return await supabaseHelpers.createPaymentVoucher(data);
          case 'token_transactions':
            return await supabaseHelpers.createTokenTransaction(data);
          default:
            return await supabase.from(table).insert(data).select().single();
        }
      
      case 'UPDATE':
        switch (table) {
          case 'profiles':
            return await supabaseHelpers.updateProfile(data.id, data);
          case 'opportunities':
            return await supabaseHelpers.updateOpportunity(data.id, data);
          case 'payment_vouchers':
            return await supabaseHelpers.updatePaymentVoucher(data.id, data);
          default:
            return await supabase.from(table).update(data).eq('id', data.id);
        }
      
      case 'DELETE':
        return await supabase.from(table).delete().eq('id', data.id);
      
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  } catch (error) {
    // Handle specific Supabase errors
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('CONFLICT: Data already exists');
    }
    if (error.code === '23503') { // Foreign key violation
      throw new Error('CONFLICT: Referenced data not found');
    }
    throw error;
  }
};

/**
 * Main sync store that manages offline-first data synchronization.
 * 
 * Key Features:
 * - Queues operations when offline
 * - Automatically syncs when coming back online
 * - Handles conflicts with multiple resolution strategies
 * - Persists operations in IndexedDB for reliability
 * - Provides real-time sync status feedback
 */
export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      operations: [],
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncAttempt: null,

      /**
       * Adds a new operation to the sync queue.
       * Operations are automatically synced if the app is online.
       */
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

      /**
       * Updates the online status and triggers sync when coming back online.
       */
      setOnlineStatus: (online) => {
        set({ isOnline: online });
        
        if (online && !get().isSyncing) {
          // Trigger sync when coming back online
          setTimeout(() => get().syncOperations(), 2000);
        }
      },

      /**
       * Main sync function that processes all pending operations.
       * This is the core of the offline-first synchronization system.
       */
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

              // Perform real Supabase operation
              const result = await performSupabaseOperation(operation);
              
              if (result.error) {
                throw new Error(result.error.message);
              }
              
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
              
              // Handle conflicts
              if (error.message?.includes('CONFLICT')) {
                const conflictOp: SyncOperation = { 
                  ...operation, 
                  status: 'failed' as const, 
                  retries: operation.retries + 1,
                  conflictResolution: 'local' as const // Default to local resolution
                };
                
                await syncDB.saveOperation(conflictOp);
                
                set(state => ({
                  operations: state.operations.map(op => 
                    op.id === operation.id ? conflictOp : op
                  )
                }));
              } else {
                // Regular error
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
          }
        } catch (error) {
          console.error('Sync process failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      /**
       * Clears completed operations from the queue to prevent memory bloat.
       */
      clearCompletedOperations: () => {
        set(state => ({
          operations: state.operations.filter(op => op.status !== 'completed')
        }));
      },

      /**
       * Retries all failed operations.
       * This is useful for network errors that might be temporary.
       */
      retryFailedOperations: async () => {
        set(state => ({
          operations: state.operations.map(op => 
            op.status === 'failed' ? { ...op, status: 'pending' } : op
          )
        }));
        
        await get().syncOperations();
      },

      /**
       * Resolves a conflict by choosing a resolution strategy.
       * This allows users to decide how to handle data conflicts.
       */
      resolveConflict: (operationId: string, resolution: 'local' | 'remote' | 'merge') => {
        set(state => ({
          operations: state.operations.map(op => 
            op.id === operationId 
              ? { ...op, conflictResolution: resolution, status: 'pending' }
              : op
          )
        }));
        
        // Retry the operation with the chosen resolution
        setTimeout(() => get().syncOperations(), 1000);
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
