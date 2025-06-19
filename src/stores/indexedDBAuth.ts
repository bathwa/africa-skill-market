
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

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { email: string; password: string; name: string; country: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  initialize: () => void;
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

// IndexedDB operations
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

  async saveUser(user: User, password: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users', 'passwords'], 'readwrite');
    const userStore = transaction.objectStore('users');
    const passwordStore = transaction.objectStore('passwords');
    
    // Simple password hashing (in production, use proper bcrypt)
    const hashedPassword = btoa(password + user.email);
    
    await userStore.put(user);
    await passwordStore.put({ userId: user.id, password: hashedPassword });
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

  async validatePassword(userId: string, password: string, email: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['passwords'], 'readonly');
    const store = transaction.objectStore('passwords');
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => {
        if (request.result) {
          const expectedHash = btoa(password + email);
          resolve(request.result.password === expectedHash);
        } else {
          resolve(false);
        }
      };
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

      initialize: () => {
        set({ isLoading: false });
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          await authDB.init();
          const user = await authDB.getUser(email);
          
          if (!user) {
            set({ isLoading: false });
            return { success: false, error: 'User not found' };
          }

          const isValidPassword = await authDB.validatePassword(user.id, password, email);
          
          if (!isValidPassword) {
            set({ isLoading: false });
            return { success: false, error: 'Invalid password' };
          }

          const profile = await authDB.getProfile(user.id);
          
          set({ 
            user,
            profile,
            isAuthenticated: true,
            isLoading: false 
          });
          
          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true });
          
          await authDB.init();
          
          // Check if user already exists
          const existingUser = await authDB.getUser(userData.email);
          if (existingUser) {
            set({ isLoading: false });
            return { success: false, error: 'User already exists' };
          }

          // Check admin count for role assignment
          const allProfiles = await authDB.getAllProfiles();
          const adminCount = allProfiles.filter(p => 
            p.role === 'admin' || p.role === 'super_admin'
          ).length;

          const userId = crypto.randomUUID();
          const now = new Date().toISOString();
          
          const user: User = {
            id: userId,
            email: userData.email,
            created_at: now,
          };

          const profile: Profile = {
            id: userId,
            email: userData.email,
            name: userData.name,
            country: userData.country,
            phone: userData.phone,
            role: adminCount < 3 ? 'admin' : 'user',
            tokens: 10,
            created_at: now,
            updated_at: now,
          };

          await authDB.saveUser(user, userData.password);
          await authDB.saveProfile(profile);
          
          set({ 
            user,
            profile,
            isAuthenticated: true,
            isLoading: false 
          });
          
          return { success: true };
        } catch (error) {
          console.error('Registration error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: () => {
        set({ 
          user: null, 
          profile: null, 
          isAuthenticated: false 
        });
      },

      updateProfile: async (updates) => {
        try {
          const { profile } = get();
          if (!profile) return { success: false, error: 'No profile found' };

          const updatedProfile = {
            ...profile,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          await authDB.init();
          await authDB.saveProfile(updatedProfile);
          
          set({ profile: updatedProfile });
          return { success: true };
        } catch (error) {
          console.error('Update profile error:', error);
          return { success: false, error: 'An unexpected error occurred' };
        }
      },
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
