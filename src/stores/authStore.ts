
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
  user: User | null;
  profile: Profile | null;
  session: Session | null;
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
        try {
          set({ isLoading: true });
          
          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            set({ isLoading: false });
            return;
          }

          if (session?.user) {
            set({ 
              user: session.user, 
              session, 
              isAuthenticated: true 
            });
            
            // Load profile after setting user
            await get().loadProfile();
          }
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Initialize error:', error);
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user && data.session) {
            set({ 
              user: data.user, 
              session: data.session, 
              isAuthenticated: true 
            });
            
            // Load profile
            await get().loadProfile();
            set({ isLoading: false });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Login failed' };
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                name: userData.name,
                country: userData.country,
                phone: userData.phone,
              }
            }
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // For email confirmation disabled, user will be automatically signed in
            if (data.session) {
              set({ 
                user: data.user, 
                session: data.session, 
                isAuthenticated: true 
              });
              await get().loadProfile();
            } else {
              // Email confirmation enabled - user needs to verify email
              set({ 
                user: data.user, 
                session: null, 
                isAuthenticated: false 
              });
            }
            
            set({ isLoading: false });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Registration failed' };
        } catch (error) {
          console.error('Registration error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ 
            user: null, 
            profile: null, 
            session: null, 
            isAuthenticated: false 
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      updateProfile: async (updates) => {
        try {
          const { profile } = get();
          if (!profile) return { success: false, error: 'No profile found' };

          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profile.id)
            .select()
            .single();

          if (error) {
            return { success: false, error: error.message };
          }

          set({ profile: data });
          return { success: true };
        } catch (error) {
          console.error('Update profile error:', error);
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      loadProfile: async () => {
        try {
          const { user } = get();
          if (!user) return;

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Load profile error:', error);
            return;
          }

          if (data) {
            set({ profile: data });
          } else {
            // Profile doesn't exist, create it
            console.log('Profile not found, creating...');
            await get().createProfile();
          }
        } catch (error) {
          console.error('Load profile error:', error);
        }
      },

      createProfile: async () => {
        try {
          const { user } = get();
          if (!user) return;

          const profileData = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email || 'User',
            country: user.user_metadata?.country || 'Zimbabwe',
            phone: user.user_metadata?.phone,
            role: 'user' as const,
            tokens: 10
          };

          const { data, error } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (error) {
            console.error('Create profile error:', error);
            return;
          }

          set({ profile: data });
        } catch (error) {
          console.error('Create profile error:', error);
        }
      }
    }),
    {
      name: 'skillzone-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Initialize auth state on app load with proper error handling
let authInitialized = false;

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event, session?.user?.id || 'no user');
  
  const store = useAuthStore.getState();
  
  if (session?.user) {
    useAuthStore.setState({ 
      user: session.user, 
      session, 
      isAuthenticated: true 
    });
    
    // Load profile in next tick to avoid recursion
    setTimeout(async () => {
      await store.loadProfile();
    }, 0);
  } else {
    useAuthStore.setState({ 
      user: null, 
      profile: null, 
      session: null, 
      isAuthenticated: false 
    });
  }
  
  // Initialize on first auth state change
  if (!authInitialized) {
    authInitialized = true;
    useAuthStore.setState({ isLoading: false });
  }
});
