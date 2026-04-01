import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface UserState {
  user: User | null
  role: 'admin' | 'member' | null
  isAuthLoaded: boolean
  setUser: (user: User | null) => void
  setRole: (role: 'admin' | 'member' | null) => void
  setAuthLoaded: (loaded: boolean) => void
  clearAuth: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  role: null,
  isAuthLoaded: false,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setAuthLoaded: (loaded) => set({ isAuthLoaded: loaded }),
  clearAuth: () => set({ user: null, role: null, isAuthLoaded: true }),
}))
