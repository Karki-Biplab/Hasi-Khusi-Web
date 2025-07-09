import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      error: null,
      
      setUser: (user) => set({ user, error: null }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      logout: () => set({ user: null, error: null }),
      
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        
        const roles = {
          owner: ['owner'],
          lv2: ['owner', 'lv2'],
          lv1: ['owner', 'lv2', 'lv1']
        };
        
        return roles[role]?.includes(user.role) || false;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Set loading to false after rehydration
        if (state) {
          state.isLoading = false;
        }
      }
    }
  )
);