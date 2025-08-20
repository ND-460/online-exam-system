import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import {jwtDecode} from "jwt-decode"; 

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, authToken) =>
        set({
          user: userData,
          token: authToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      setToken: (token) => set({ token }),

    
      fetchProfile: async () => {
        try {
          const { token } = get();
          if (!token) return;

          // decode token to extract user id
          const decoded = jwtDecode(token);
          const userId = decoded.user.id;

          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/user/profile/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          set({ user: res.data.obj, isAuthenticated: true });
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
