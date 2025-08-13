import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (userData, authToken) => set({
        user: userData,
        token: authToken,
        isAuthenticated: true,
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
      
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData },
      })),
      
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
