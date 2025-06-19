
import { create } from 'zustand';

export interface ServiceProvider {
  id: string;
  userId: string;
  name: string;
  category: string;
  description: string;
  location: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  experience: number;
  rating: number;
  completedProjects: number;
  createdAt: string;
  isActive: boolean;
}

export interface Opportunity {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  country: string;
  budget: string;
  contactEmail: string;
  contactPhone: string;
  accessCount: number;
  maxAccess: number;
  createdAt: string;
  isActive: boolean;
}

export interface EscrowAccount {
  id: string;
  type: 'mobile_wallet' | 'bank';
  name: string;
  details: string;
  country: string;
  isActive: boolean;
}

interface AppState {
  serviceProviders: ServiceProvider[];
  opportunities: Opportunity[];
  escrowAccounts: EscrowAccount[];
  supportContacts: {
    phone: string;
    email: string;
    whatsapp: string;
  };
  
  // Actions
  addServiceProvider: (provider: Omit<ServiceProvider, 'id' | 'createdAt'>) => void;
  addOpportunity: (opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'accessCount'>) => void;
  updateEscrowAccounts: (accounts: EscrowAccount[]) => void;
  updateSupportContacts: (contacts: { phone: string; email: string; whatsapp: string }) => void;
  loadData: () => void;
}

// SADC Countries
export const SADC_COUNTRIES = [
  'Zimbabwe',
  'South Africa',
  'Botswana',
  'Zambia',
  'Namibia',
  'Angola',
  'Mozambique',
  'Malawi'
];

// Service Categories
export const SERVICE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Gardening',
  'Handyman',
  'Tech Support',
  'Tutoring',
  'Catering',
  'Transportation',
  'Other'
];

export const useAppStore = create<AppState>((set, get) => ({
  serviceProviders: [],
  opportunities: [],
  escrowAccounts: [
    {
      id: '1',
      type: 'mobile_wallet',
      name: 'Mobile Wallets (Ecocash, Omari, Innbucks)',
      details: '0788420479 - Vusa Ncube',
      country: 'Zimbabwe',
      isActive: true
    },
    {
      id: '2',
      type: 'bank',
      name: 'Innbucks MicroBank',
      details: 'Account Name: Abathwa Incubator PBC\nAccount Number: 013113351190001',
      country: 'Zimbabwe',
      isActive: true
    }
  ],
  supportContacts: {
    phone: '+263 78 998 9619',
    email: 'admin@abathwa.com',
    whatsapp: 'wa.me/789989619'
  },

  addServiceProvider: (provider) => {
    const newProvider = {
      ...provider,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    set(state => ({
      serviceProviders: [...state.serviceProviders, newProvider]
    }));
    
    // Save to localStorage
    const current = get();
    localStorage.setItem('skillzone-providers', JSON.stringify(current.serviceProviders));
  },

  addOpportunity: (opportunity) => {
    const newOpportunity = {
      ...opportunity,
      id: Date.now().toString(),
      accessCount: 0,
      createdAt: new Date().toISOString(),
    };
    
    set(state => ({
      opportunities: [...state.opportunities, newOpportunity]
    }));
    
    // Save to localStorage
    const current = get();
    localStorage.setItem('skillzone-opportunities', JSON.stringify(current.opportunities));
  },

  updateEscrowAccounts: (accounts) => {
    set({ escrowAccounts: accounts });
    localStorage.setItem('skillzone-escrow', JSON.stringify(accounts));
  },

  updateSupportContacts: (contacts) => {
    set({ supportContacts: contacts });
    localStorage.setItem('skillzone-support', JSON.stringify(contacts));
  },

  loadData: () => {
    const providers = JSON.parse(localStorage.getItem('skillzone-providers') || '[]');
    const opportunities = JSON.parse(localStorage.getItem('skillzone-opportunities') || '[]');
    const escrow = JSON.parse(localStorage.getItem('skillzone-escrow') || '[]');
    const support = JSON.parse(localStorage.getItem('skillzone-support') || 'null');
    
    set({
      serviceProviders: providers,
      opportunities: opportunities,
      escrowAccounts: escrow.length > 0 ? escrow : get().escrowAccounts,
      supportContacts: support || get().supportContacts
    });
  },
}));
