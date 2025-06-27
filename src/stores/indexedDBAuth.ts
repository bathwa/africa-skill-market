
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, supabaseHelpers } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin' | 'client' | 'service_provider';
  country: string;
  tokens: number;
  phone?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name: string, country: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string, adminKey?: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { email: string; password: string; name: string; country: string; phone?: string; role?: 'client' | 'service_provider' }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
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

// Super admin emails
const SUPER_ADMIN_EMAILS = ['admin@abathwa.com', 'abathwabiz@gmail.com'];
const ADMIN_KEY = 'vvv.ndev';

// Token pricing
export const TOKEN_PRICE_USD = 0.50;
export const TOKEN_PRICE_ZAR = 10;

// Helper function to map database roles to frontend roles
const mapDatabaseRoleToFrontend = (dbRole: string): Profile['role'] => {
  switch (dbRole) {
    case 'user': return 'client'; // Default users are clients
    case 'admin': return 'admin';
    case 'super_admin': return 'super_admin';
    default: return 'client';
  }
};

// Helper function to map frontend roles to database roles
const mapFrontendRoleToDatabase = (frontendRole: Profile['role']): string => {
  switch (frontendRole) {
    case 'client': return 'user';
    case 'service_provider': return 'user';
    case 'admin': return 'admin';
    case 'super_admin': return 'super_admin';
    default: return 'user';
  }
};

// IndexedDB operations for offline functionality
class AuthDB {
  private dbName = 'skillzone-auth';
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
        
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }
        
        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        
        // Passwords store (hashed)
        if (!db.objectStoreNames.contains('passwords')) {
          db.createObjectStore('passwords', { keyPath: 'userId' });
        }
      };
    });
  }

  async saveUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    await store.put(user);
  }

  async getUser(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('email');
    
    return new Promise((resolve, reject) => {
      const request = index.get(email);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProfile(profile: Profile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    await store.put(profile);
  }

  async getProfile(userId: string): Promise<Profile | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['profiles'], 'readonly');
    const store = transaction.objectStore('profiles');
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProfiles(): Promise<Profile[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['profiles'], 'readonly');
    const store = transaction.objectStore('profiles');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

const authDB = new AuthDB();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Initialize IndexedDB
          await authDB.init();
          
          // Check for existing Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name,
              created_at: session.user.created_at
            };
            
            // Try to get profile from Supabase first
            const { data: profile, error: profileError } = await supabaseHelpers.getProfile(user.id);
            
            if (profile && !profileError) {
              const typedProfile: Profile = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: mapDatabaseRoleToFrontend(profile.role),
                country: profile.country,
                tokens: profile.tokens,
                phone: profile.phone || undefined,
                profile_picture_url: profile.profile_picture_url || undefined,
                created_at: profile.created_at,
                updated_at: profile.updated_at
              };
              
              set({
                user,
                profile: typedProfile,
                isAuthenticated: true,
                isLoading: false
              });
              
              // Cache in IndexedDB
              await authDB.saveUser(user);
              await authDB.saveProfile(typedProfile);
            } else {
              // Fallback to IndexedDB
              const cachedProfile = await authDB.getProfile(user.id);
              if (cachedProfile) {
                set({
                  user,
                  profile: cachedProfile,
                  isAuthenticated: true,
                  isLoading: false
                });
              } else {
                set({
                  user,
                  isAuthenticated: true,
                  isLoading: false
                });
              }
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({ isLoading: false });
        }
      },

      signUp: async (email: string, password: string, name: string, country: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Sign up with Supabase
          const { data, error } = await supabaseHelpers.signUp(email, password, {
            name,
            country
          });
          
          if (error) throw error;
          
          if (data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name,
              created_at: data.user.created_at
            };
            
            set({ user, isAuthenticated: true, isLoading: false });
            
            // Cache in IndexedDB
            await authDB.saveUser(user);
            
            // Fetch the created profile
            await get().refreshProfile();
          }
        } catch (error: any) {
          console.error('Sign up failed:', error);
          set({ 
            error: error.message || 'Sign up failed', 
            isLoading: false 
          });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Sign in with Supabase
          const { data, error } = await supabaseHelpers.signIn(email, password);
          
          if (error) throw error;
          
          if (data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name,
              created_at: data.user.created_at
            };
            
            // Fetch profile
            const { data: profile, error: profileError } = await supabaseHelpers.getProfile(user.id);
            
            if (profile && !profileError) {
              const typedProfile: Profile = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: mapDatabaseRoleToFrontend(profile.role),
                country: profile.country,
                tokens: profile.tokens,
                phone: profile.phone || undefined,
                profile_picture_url: profile.profile_picture_url || undefined,
                created_at: profile.created_at,
                updated_at: profile.updated_at
              };
              
              set({
                user,
                profile: typedProfile,
                isAuthenticated: true,
                isLoading: false
              });
              
              // Cache in IndexedDB
              await authDB.saveUser(user);
              await authDB.saveProfile(typedProfile);
            } else {
              // Fallback to cached profile
              const cachedProfile = await authDB.getProfile(user.id);
              set({
                user,
                profile: cachedProfile,
                isAuthenticated: true,
                isLoading: false
              });
            }
          }
        } catch (error: any) {
          console.error('Sign in failed:', error);
          set({ 
            error: error.message || 'Sign in failed', 
            isLoading: false 
          });
        }
      },

      // Alias methods for compatibility
      login: async (email: string, password: string, adminKey?: string) => {
        try {
          // Check for admin access
          if (SUPER_ADMIN_EMAILS.includes(email) && adminKey === ADMIN_KEY) {
            // Admin login logic
          }
          
          await get().signIn(email, password);
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message || 'Login failed' };
        }
      },

      register: async (userData) => {
        try {
          await get().signUp(userData.email, userData.password, userData.name, userData.country);
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message || 'Registration failed' };
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });
          
          // Sign out from Supabase
          await supabaseHelpers.signOut();
          
          // Clear local state
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error) {
          console.error('Sign out failed:', error);
          set({ isLoading: false });
        }
      },

      // Alias for compatibility
      logout: async () => {
        await get().signOut();
      },

      updateProfile: async (updates: Partial<Profile>) => {
        try {
          const { profile } = get();
          if (!profile) throw new Error('No profile to update');
          
          // Map frontend role to database role if updating role
          const dbUpdates = { ...updates };
          if (updates.role) {
            dbUpdates.role = mapFrontendRoleToDatabase(updates.role) as any;
          }
          
          // Update in Supabase
          const { data, error } = await supabaseHelpers.updateProfile(profile.id, dbUpdates);
          
          if (error) throw error;
          
          if (data) {
            const updatedProfile = { ...profile, ...updates };
            set({ profile: updatedProfile });
            
            // Cache in IndexedDB
            await authDB.saveProfile(updatedProfile);
          }
        } catch (error: any) {
          console.error('Profile update failed:', error);
          set({ error: error.message || 'Profile update failed' });
        }
      },

      refreshProfile: async () => {
        try {
          const { user } = get();
          if (!user) return;
          
          // Fetch from Supabase
          const { data: profile, error } = await supabaseHelpers.getProfile(user.id);
          
          if (profile && !error) {
            const typedProfile: Profile = {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: mapDatabaseRoleToFrontend(profile.role),
              country: profile.country,
              tokens: profile.tokens,
              phone: profile.phone || undefined,
              profile_picture_url: profile.profile_picture_url || undefined,
              created_at: profile.created_at,
              updated_at: profile.updated_at
            };
            
            set({ profile: typedProfile });
            
            // Cache in IndexedDB
            await authDB.saveProfile(typedProfile);
          }
        } catch (error) {
          console.error('Profile refresh failed:', error);
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'skillzone-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Listen for auth state changes from Supabase
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name,
      created_at: session.user.created_at
    };
    
    // Fetch profile
    const { data: profile } = await supabaseHelpers.getProfile(user.id);
    
    let typedProfile: Profile | null = null;
    if (profile) {
      typedProfile = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: mapDatabaseRoleToFrontend(profile.role),
        country: profile.country,
        tokens: profile.tokens,
        phone: profile.phone || undefined,
        profile_picture_url: profile.profile_picture_url || undefined,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
    }
    
    useAuthStore.setState({
      user,
      profile: typedProfile,
      isAuthenticated: true
    });
    
    // Cache in IndexedDB
    await authDB.saveUser(user);
    if (typedProfile) {
      await authDB.saveProfile(typedProfile);
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false
    });
  }
});
