
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ServiceProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  skills: string[];
  experience_years: number;
  hourly_rate: number;
  currency: 'USD' | 'ZAR';
  portfolio_links: string[];
  certifications: string[];
  rating: number;
  total_reviews: number;
  completed_projects: number;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderReview {
  id: string;
  provider_id: string;
  client_id: string;
  client_name: string;
  opportunity_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ProviderState {
  profiles: ServiceProviderProfile[];
  reviews: ProviderReview[];
  createProfile: (profile: Omit<ServiceProviderProfile, 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews' | 'completed_projects'>) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (id: string, updates: Partial<ServiceProviderProfile>) => Promise<{ success: boolean; error?: string }>;
  getProfilesByCountry: (country: string) => ServiceProviderProfile[];
  getProfileByUserId: (userId: string) => ServiceProviderProfile | null;
  addReview: (review: Omit<ProviderReview, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  getReviewsByProvider: (providerId: string) => ProviderReview[];
  updateProviderStats: (providerId: string, completedProject: boolean) => Promise<void>;
  loadProfiles: () => Promise<void>;
}

class ProviderDB {
  private dbName = 'skillzone-providers';
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
        
        if (!db.objectStoreNames.contains('profiles')) {
          const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
          profileStore.createIndex('user_id', 'user_id');
          profileStore.createIndex('country', 'country');
        }
        
        if (!db.objectStoreNames.contains('reviews')) {
          const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
          reviewStore.createIndex('provider_id', 'provider_id');
          reviewStore.createIndex('client_id', 'client_id');
        }
      };
    });
  }

  async saveProfile(profile: ServiceProviderProfile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    await store.put(profile);
  }

  async getAllProfiles(): Promise<ServiceProviderProfile[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['profiles'], 'readonly');
    const store = transaction.objectStore('profiles');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveReview(review: ProviderReview): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['reviews'], 'readwrite');
    const store = transaction.objectStore('reviews');
    await store.put(review);
  }

  async getAllReviews(): Promise<ProviderReview[]> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(['reviews'], 'readonly');
    const store = transaction.objectStore('reviews');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

const providerDB = new ProviderDB();

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      profiles: [],
      reviews: [],

      loadProfiles: async () => {
        try {
          await providerDB.init();
          const profiles = await providerDB.getAllProfiles();
          const reviews = await providerDB.getAllReviews();
          set({ profiles, reviews });
        } catch (error) {
          console.error('Load profiles error:', error);
        }
      },

      createProfile: async (profileData) => {
        try {
          await providerDB.init();
          
          const profile: ServiceProviderProfile = {
            ...profileData,
            id: crypto.randomUUID(),
            rating: 0,
            total_reviews: 0,
            completed_projects: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await providerDB.saveProfile(profile);
          
          set(state => ({
            profiles: [...state.profiles, profile]
          }));

          return { success: true };
        } catch (error) {
          console.error('Create profile error:', error);
          return { success: false, error: 'Failed to create profile' };
        }
      },

      updateProfile: async (id, updates) => {
        try {
          await providerDB.init();
          
          const { profiles } = get();
          const profile = profiles.find(p => p.id === id);
          
          if (!profile) {
            return { success: false, error: 'Profile not found' };
          }

          const updatedProfile = {
            ...profile,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          await providerDB.saveProfile(updatedProfile);
          
          set(state => ({
            profiles: state.profiles.map(p => 
              p.id === id ? updatedProfile : p
            )
          }));

          return { success: true };
        } catch (error) {
          console.error('Update profile error:', error);
          return { success: false, error: 'Failed to update profile' };
        }
      },

      getProfilesByCountry: (country) => {
        const { profiles } = get();
        return profiles.filter(p => p.country === country);
      },

      getProfileByUserId: (userId) => {
        const { profiles } = get();
        return profiles.find(p => p.user_id === userId) || null;
      },

      addReview: async (reviewData) => {
        try {
          await providerDB.init();
          
          const review: ProviderReview = {
            ...reviewData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          };

          await providerDB.saveReview(review);
          
          // Update provider rating
          const { profiles, reviews } = get();
          const allReviews = [...reviews, review];
          const providerReviews = allReviews.filter(r => r.provider_id === reviewData.provider_id);
          const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
          
          const profile = profiles.find(p => p.id === reviewData.provider_id);
          if (profile) {
            const updatedProfile = {
              ...profile,
              rating: avgRating,
              total_reviews: providerReviews.length,
              updated_at: new Date().toISOString(),
            };
            
            await providerDB.saveProfile(updatedProfile);
            
            set(state => ({
              reviews: [...state.reviews, review],
              profiles: state.profiles.map(p => 
                p.id === reviewData.provider_id ? updatedProfile : p
              )
            }));
          } else {
            set(state => ({
              reviews: [...state.reviews, review]
            }));
          }

          return { success: true };
        } catch (error) {
          console.error('Add review error:', error);
          return { success: false, error: 'Failed to add review' };
        }
      },

      getReviewsByProvider: (providerId) => {
        const { reviews } = get();
        return reviews.filter(r => r.provider_id === providerId);
      },

      updateProviderStats: async (providerId, completedProject) => {
        try {
          const { profiles } = get();
          const profile = profiles.find(p => p.id === providerId);
          
          if (profile && completedProject) {
            const updatedProfile = {
              ...profile,
              completed_projects: profile.completed_projects + 1,
              updated_at: new Date().toISOString(),
            };
            
            await providerDB.saveProfile(updatedProfile);
            
            set(state => ({
              profiles: state.profiles.map(p => 
                p.id === providerId ? updatedProfile : p
              )
            }));
          }
        } catch (error) {
          console.error('Update provider stats error:', error);
        }
      },
    }),
    {
      name: 'skillzone-providers',
      partialize: (state) => ({
        profiles: state.profiles,
        reviews: state.reviews,
      })
    }
  )
);
