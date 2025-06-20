
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  client_id: string;
  client_name: string;
  client_country: string;
  client_phone?: string;
  client_email: string;
  budget: number;
  currency: 'USD' | 'ZAR';
  category: string;
  skills_required: string[];
  files?: File[];
  created_at: string;
  updated_at: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assigned_provider_id?: string;
  completion_acknowledged?: boolean;
  client_rating?: number;
  provider_rating?: number;
}

export interface OpportunityAccess {
  id: string;
  opportunity_id: string;
  provider_id: string;
  purchased_at: string;
}

interface OpportunityState {
  opportunities: Opportunity[];
  accessRecords: OpportunityAccess[];
  createOpportunity: (opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<{ success: boolean; error?: string }>;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => Promise<{ success: boolean; error?: string }>;
  getOpportunitiesByCountry: (country: string) => Opportunity[];
  purchaseAccess: (opportunityId: string, providerId: string) => Promise<{ success: boolean; error?: string }>;
  hasAccess: (opportunityId: string, providerId: string) => boolean;
  getOpportunityById: (id: string) => Opportunity | null;
  loadOpportunities: () => Promise<void>;
}

class OpportunityDB {
  private dbName = 'skillzone-opportunities';
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
        
        if (!db.objectStoreNames.contains('opportunities')) {
          const oppStore = db.createObjectStore('opportunities', { keyPath: 'id' });
          oppStore.createIndex('client_country', 'client_country');
          oppStore.createIndex('status', 'status');
        }
        
        if (!db.objectStoreNames.contains('access_records')) {
          const accessStore = db.createObjectStore('access_records', { keyPath: 'id' });
          accessStore.createIndex('opportunity_id', 'opportunity_id');
          accessStore.createIndex('provider_id', 'provider_id');
        }
      };
    });
  }

  async saveOpportunity(opportunity: Opportunity): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['opportunities'], 'readwrite');
    const store = transaction.objectStore('opportunities');
    await store.put(opportunity);
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['opportunities'], 'readonly');
    const store = transaction.objectStore('opportunities');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAccessRecord(record: OpportunityAccess): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['access_records'], 'readwrite');
    const store = transaction.objectStore('access_records');
    await store.put(record);
  }

  async getAllAccessRecords(): Promise<OpportunityAccess[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['access_records'], 'readonly');
    const store = transaction.objectStore('access_records');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

const opportunityDB = new OpportunityDB();

export const useOpportunityStore = create<OpportunityState>()(
  persist(
    (set, get) => ({
      opportunities: [],
      accessRecords: [],

      loadOpportunities: async () => {
        try {
          await opportunityDB.init();
          const opportunities = await opportunityDB.getAllOpportunities();
          const accessRecords = await opportunityDB.getAllAccessRecords();
          set({ opportunities, accessRecords });
        } catch (error) {
          console.error('Load opportunities error:', error);
        }
      },

      createOpportunity: async (opportunityData) => {
        try {
          await opportunityDB.init();
          
          const opportunity: Opportunity = {
            ...opportunityData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'open',
          };

          await opportunityDB.saveOpportunity(opportunity);
          
          set(state => ({
            opportunities: [...state.opportunities, opportunity]
          }));

          return { success: true };
        } catch (error) {
          console.error('Create opportunity error:', error);
          return { success: false, error: 'Failed to create opportunity' };
        }
      },

      updateOpportunity: async (id, updates) => {
        try {
          await opportunityDB.init();
          
          const { opportunities } = get();
          const opportunity = opportunities.find(o => o.id === id);
          
          if (!opportunity) {
            return { success: false, error: 'Opportunity not found' };
          }

          const updatedOpportunity = {
            ...opportunity,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          await opportunityDB.saveOpportunity(updatedOpportunity);
          
          set(state => ({
            opportunities: state.opportunities.map(o => 
              o.id === id ? updatedOpportunity : o
            )
          }));

          return { success: true };
        } catch (error) {
          console.error('Update opportunity error:', error);
          return { success: false, error: 'Failed to update opportunity' };
        }
      },

      getOpportunitiesByCountry: (country) => {
        const { opportunities } = get();
        return opportunities.filter(o => o.client_country === country && o.status === 'open');
      },

      purchaseAccess: async (opportunityId, providerId) => {
        try {
          await opportunityDB.init();
          
          const accessRecord: OpportunityAccess = {
            id: crypto.randomUUID(),
            opportunity_id: opportunityId,
            provider_id: providerId,
            purchased_at: new Date().toISOString(),
          };

          await opportunityDB.saveAccessRecord(accessRecord);
          
          set(state => ({
            accessRecords: [...state.accessRecords, accessRecord]
          }));

          return { success: true };
        } catch (error) {
          console.error('Purchase access error:', error);
          return { success: false, error: 'Failed to purchase access' };
        }
      },

      hasAccess: (opportunityId, providerId) => {
        const { accessRecords } = get();
        return accessRecords.some(record => 
          record.opportunity_id === opportunityId && record.provider_id === providerId
        );
      },

      getOpportunityById: (id) => {
        const { opportunities } = get();
        return opportunities.find(o => o.id === id) || null;
      },
    }),
    {
      name: 'skillzone-opportunities',
      partialize: (state) => ({
        opportunities: state.opportunities,
        accessRecords: state.accessRecords,
      })
    }
  )
);
