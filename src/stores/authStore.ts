
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  country: string;
  tokens: number;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'tokens' | 'createdAt'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateTokens: (tokens: number) => void;
}

// Super admin emails and configuration
const SUPER_ADMIN_EMAILS = [
  'abathwabiz@gmail.com',
  'admin@abathwa.com',
  'vvv.skillzone@gmail.com'
];

const ADMIN_USER_KEY = 'vvv.ndev';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          // Get users from IndexedDB
          const users = JSON.parse(localStorage.getItem('skillzone-users') || '[]');
          const user = users.find((u: any) => u.email === email && u.password === password);
          
          if (user) {
            const { password: _, ...userWithoutPassword } = user;
            set({ user: userWithoutPassword, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      register: async (userData) => {
        try {
          const users = JSON.parse(localStorage.getItem('skillzone-users') || '[]');
          
          // Check if user already exists
          if (users.find((u: any) => u.email === userData.email)) {
            return false;
          }

          // Determine role based on email
          let role = 'user';
          if (SUPER_ADMIN_EMAILS.includes(userData.email)) {
            role = 'super_admin';
          }

          const newUser = {
            id: Date.now().toString(),
            ...userData,
            role,
            tokens: 10, // Free tokens for new users
            createdAt: new Date().toISOString(),
          };

          users.push(newUser);
          localStorage.setItem('skillzone-users', JSON.stringify(users));

          const { password: _, ...userWithoutPassword } = newUser;
          set({ user: userWithoutPassword, isAuthenticated: true });
          return true;
        } catch (error) {
          console.error('Registration error:', error);
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateTokens: (tokens: number) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, tokens };
          set({ user: updatedUser });
          
          // Update in localStorage
          const users = JSON.parse(localStorage.getItem('skillzone-users') || '[]');
          const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
          if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], tokens };
            localStorage.setItem('skillzone-users', JSON.stringify(users));
          }
        }
      },
    }),
    {
      name: 'skillzone-auth',
    }
  )
);
