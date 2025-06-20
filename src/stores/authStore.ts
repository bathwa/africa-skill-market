import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  country: string;
  tokens: number;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { email: string; password: string; name: string; country: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  loadProfile: () => Promise<void>;
  createProfile: () => Promise<void>;
  initialize: () => Promise<void>;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: async () => {
        set({ isLoading: false });
      },

      login: async (email: string, password: string) => {
        // Deprecated - redirect to indexedDBAuth
        return { success: false, error: 'Use indexedDBAuth instead' };
      },

      register: async (userData) => {
        // Deprecated - redirect to indexedDBAuth
        return { success: false, error: 'Use indexedDBAuth instead' };
      },

      logout: async () => {
        set({ 
          user: null, 
          profile: null, 
          session: null, 
          isAuthenticated: false 
        });
      },

      updateProfile: async (updates) => {
        return { success: false, error: 'Use indexedDBAuth instead' };
      },

      loadProfile: async () => {
        // Deprecated
      },

      createProfile: async () => {
        // Deprecated
      }
    }),
    {
      name: 'skillzone-auth-deprecated',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
