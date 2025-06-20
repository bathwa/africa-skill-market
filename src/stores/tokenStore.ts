
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TokenPurchase {
  id: string;
  user_id: string;
  amount: number;
  tokens: number;
  currency: 'USD' | 'ZAR';
  status: 'pending' | 'confirmed' | 'rejected';
  voucher_details: {
    bank_name: string;
    account_number: string;
    reference: string;
    amount: number;
    currency: 'USD' | 'ZAR';
  };
  proof_of_payment?: {
    type: 'text' | 'image' | 'pdf';
    content: string; // base64 for files, text for text
    filename?: string;
  };
  created_at: string;
  processed_at?: string;
  processed_by?: string;
}

export interface EscrowAccount {
  id: string;
  country: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  currency: 'USD' | 'ZAR';
  created_by: string;
  created_at: string;
}

interface TokenState {
  purchases: TokenPurchase[];
  escrowAccounts: EscrowAccount[];
  createPurchase: (userId: string, amount: number, currency: 'USD' | 'ZAR') => Promise<{ success: boolean; voucher?: TokenPurchase['voucher_details']; error?: string }>;
  submitProofOfPayment: (purchaseId: string, proof: TokenPurchase['proof_of_payment']) => Promise<{ success: boolean; error?: string }>;
  processPurchase: (purchaseId: string, status: 'confirmed' | 'rejected', processedBy: string) => Promise<{ success: boolean; error?: string }>;
  createEscrowAccount: (account: Omit<EscrowAccount, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  getEscrowByCountry: (country: string) => EscrowAccount | null;
  loadTokenData: () => Promise<void>;
}

const TOKEN_PRICES = {
  USD: 0.50,
  ZAR: 10,
};

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
        
        if (!db.objectStoreNames.contains('escrow_accounts')) {
          const escrowStore = db.createObjectStore('escrow_accounts', { keyPath: 'id' });
          escrowStore.createIndex('country', 'country');
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

  async saveEscrowAccount(account: EscrowAccount): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['escrow_accounts'], 'readwrite');
    const store = transaction.objectStore('escrow_accounts');
    await store.put(account);
  }

  async getAllEscrowAccounts(): Promise<EscrowAccount[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['escrow_accounts'], 'readonly');
    const store = transaction.objectStore('escrow_accounts');
    
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
      escrowAccounts: [],

      loadTokenData: async () => {
        try {
          await tokenDB.init();
          const purchases = await tokenDB.getAllPurchases();
          const escrowAccounts = await tokenDB.getAllEscrowAccounts();
          set({ purchases, escrowAccounts });
        } catch (error) {
          console.error('Load token data error:', error);
        }
      },

      createPurchase: async (userId, amount, currency) => {
        try {
          await tokenDB.init();
          
          const tokenCount = Math.floor(amount / TOKEN_PRICES[currency]);
          if (tokenCount === 0) {
            return { success: false, error: 'Amount too small to purchase tokens' };
          }

          const voucher_details = {
            bank_name: 'SkillZone Escrow Bank',
            account_number: `ESC${currency}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            reference: `TKN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            amount,
            currency,
          };

          const purchase: TokenPurchase = {
            id: crypto.randomUUID(),
            user_id: userId,
            amount,
            tokens: tokenCount,
            currency,
            status: 'pending',
            voucher_details,
            created_at: new Date().toISOString(),
          };

          await tokenDB.savePurchase(purchase);
          
          set(state => ({
            purchases: [...state.purchases, purchase]
          }));

          return { success: true, voucher: voucher_details };
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
          return { success: false, error: 'Failed to submit proof of payment' };
        }
      },

      processPurchase: async (purchaseId, status, processedBy) => {
        try {
          await tokenDB.init();
          
          const { purchases } = get();
          const purchase = purchases.find(p => p.id === purchaseId);
          
          if (!purchase) {
            return { success: false, error: 'Purchase not found' };
          }

          const updatedPurchase = {
            ...purchase,
            status,
            processed_at: new Date().toISOString(),
            processed_by: processedBy,
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

      createEscrowAccount: async (accountData) => {
        try {
          await tokenDB.init();
          
          const account: EscrowAccount = {
            ...accountData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          };

          await tokenDB.saveEscrowAccount(account);
          
          set(state => ({
            escrowAccounts: [...state.escrowAccounts, account]
          }));

          return { success: true };
        } catch (error) {
          console.error('Create escrow account error:', error);
          return { success: false, error: 'Failed to create escrow account' };
        }
      },

      getEscrowByCountry: (country) => {
        const { escrowAccounts } = get();
        return escrowAccounts.find(acc => acc.country === country) || null;
      },
    }),
    {
      name: 'skillzone-tokens',
      partialize: (state) => ({
        purchases: state.purchases,
        escrowAccounts: state.escrowAccounts,
      })
    }
  )
);
