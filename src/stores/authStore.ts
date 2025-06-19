
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { email: string; password: string; name: string; country: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  loadProfile: () => Promise<void>;
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
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data.user) {
            set({ user: data.user, isAuthenticated: true });
            await get().loadProfile();
            return { success: true };
          }

          return { success: false, error: 'Login failed' };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      register: async (userData) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                name: userData.name,
                country: userData.country,
                phone: userData.phone,
              },
              emailRedirectTo: `${window.location.origin}/dashboard`
            }
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data.user) {
            set({ user: data.user, isAuthenticated: true });
            await get().loadProfile();
            return { success: true };
          }

          return { success: false, error: 'Registration failed' };
        } catch (error) {
          console.error('Registration error:', error);
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, profile: null, isAuthenticated: false });
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
            .single();

          if (error) {
            console.error('Load profile error:', error);
            return;
          }

          set({ profile: data });
        } catch (error) {
          console.error('Load profile error:', error);
        }
      },
    }),
    {
      name: 'skillzone-auth',
    }
  )
);

// Initialize auth state on app load
supabase.auth.onAuthStateChange(async (event, session) => {
  const { set, get } = useAuthStore.getState();
  
  if (session?.user) {
    set({ user: session.user, isAuthenticated: true });
    await get().loadProfile();
  } else {
    set({ user: null, profile: null, isAuthenticated: false });
  }
});
