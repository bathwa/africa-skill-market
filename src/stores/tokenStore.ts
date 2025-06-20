
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const TOKEN_PRICE_USD = 0.50;
export const TOKEN_PRICE_ZAR = 10;

export interface TokenPurchase {
  id: string;
  user_id: string;
  amount: number;
  currency: 'USD' | 'ZAR';
  tokens: number;
  status: 'pending' | 'approved' | 'rejected';
  reference_number: string;
  proof_of_payment?: {
    type: 'text' | 'image' | 'pdf';
    content: string;
    filename?: string;
  };
  created_at: string;
  processed_at?: string;
  processed_by?: string;
}

export interface PaymentVoucher {
  id: string;
  bank_name: string;
  account_number: string;
  currency: 'USD' | 'ZAR';
  amount: number;
  reference: string;
}

interface TokenState {
  purchases: TokenPurchase[];
  createPurchase: (userId: string, amount: number, currency: 'USD' | 'ZAR') => Promise<{ success: boolean; voucher?: PaymentVoucher; error?: string }>;
  submitProofOfPayment: (purchaseId: string, proof: any) => Promise<{ success: boolean; error?: string }>;
  processPurchase: (purchaseId: string, approved: boolean, adminId: string) => Promise<{ success: boolean; error?: string }>;
  getPendingPurchases: () => TokenPurchase[];
  loadPurchases: () => Promise<void>;
}

class TokenDB {
  private dbName = 'skillzone-tokens';
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
        
        if (!db.objectStoreNames.contains('purchases')) {
          const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id' });
          purchaseStore.createIndex('user_id', 'user_id');
          purchaseStore.createIndex('status', 'status');
        }
      };
    });
  }

  async savePurchase(purchase: TokenPurchase): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['purchases'], 'readwrite');
    const store = transaction.objectStore('purchases');
    await store.put(purchase);
  }

  async getAllPurchases(): Promise<TokenPurchase[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['purchases'], 'readonly');
    const store = transaction.objectStore('purchases');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

const tokenDB = new TokenDB();

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      purchases: [],

      loadPurchases: async () => {
        try {
          await tokenDB.init();
          const purchases = await tokenDB.getAllPurchases();
          set({ purchases });
        } catch (error) {
          console.error('Load purchases error:', error);
        }
      },

      createPurchase: async (userId, amount, currency) => {
        try {
          await tokenDB.init();
          
          const tokens = Math.floor(amount / (currency === 'USD' ? TOKEN_PRICE_USD : TOKEN_PRICE_ZAR));
          const reference = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          
          const purchase: TokenPurchase = {
            id: crypto.randomUUID(),
            user_id: userId,
            amount,
            currency,
            tokens,
            status: 'pending',
            reference_number: reference,
            created_at: new Date().toISOString(),
          };

          await tokenDB.savePurchase(purchase);
          
          set(state => ({
            purchases: [...state.purchases, purchase]
          }));

          const voucher: PaymentVoucher = {
            id: purchase.id,
            bank_name: currency === 'USD' ? 'First National Bank USD' : 'Standard Bank ZAR',
            account_number: currency === 'USD' ? '1234567890' : '9876543210',
            currency,
            amount,
            reference,
          };

          return { success: true, voucher };
        } catch (error) {
          console.error('Create purchase error:', error);
          return { success: false, error: 'Failed to create purchase' };
        }
      },

      submitProofOfPayment: async (purchaseId, proof) => {
        try {
          await tokenDB.init();
          
          const { purchases } = get();
          const purchase = purchases.find(p => p.id === purchaseId);
          
          if (!purchase) {
            return { success: false, error: 'Purchase not found' };
          }

          const updatedPurchase = {
            ...purchase,
            proof_of_payment: proof,
          };

          await tokenDB.savePurchase(updatedPurchase);
          
          set(state => ({
            purchases: state.purchases.map(p => 
              p.id === purchaseId ? updatedPurchase : p
            )
          }));

          return { success: true };
        } catch (error) {
          console.error('Submit proof error:', error);
          return { success: false, error: 'Failed to submit proof' };
        }
      },

      processPurchase: async (purchaseId, approved, adminId) => {
        try {
          await tokenDB.init();
          
          const { purchases } = get();
          const purchase = purchases.find(p => p.id === purchaseId);
          
          if (!purchase) {
            return { success: false, error: 'Purchase not found' };
          }

          const updatedPurchase = {
            ...purchase,
            status: approved ? 'approved' as const : 'rejected' as const,
            processed_at: new Date().toISOString(),
            processed_by: adminId,
          };

          await tokenDB.savePurchase(updatedPurchase);
          
          set(state => ({
            purchases: state.purchases.map(p => 
              p.id === purchaseId ? updatedPurchase : p
            )
          }));

          return { success: true };
        } catch (error) {
          console.error('Process purchase error:', error);
          return { success: false, error: 'Failed to process purchase' };
        }
      },

      getPendingPurchases: () => {
        const { purchases } = get();
        return purchases.filter(p => p.status === 'pending');
      },
    }),
    {
      name: 'skillzone-tokens',
      partialize: (state) => ({
        purchases: state.purchases,
      })
    }
  )
);
