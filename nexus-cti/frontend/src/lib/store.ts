// lib/store.ts — Zustand global state
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  username: string | null
  role: string | null
  setAuth: (token: string, username: string, role: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      role: null,
      setAuth: (token, username, role) => {
        localStorage.setItem('nexus_token', token)
        set({ token, username, role })
      },
      clearAuth: () => {
        localStorage.removeItem('nexus_token')
        set({ token: null, username: null, role: null })
      },
    }),
    { name: 'nexus-auth' },
  ),
)

// Alert count (open alerts badge in sidebar)
interface UIState {
  openAlertCount: number
  setOpenAlertCount: (n: number) => void
  activePanel: string
  setActivePanel: (p: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  openAlertCount: 0,
  setOpenAlertCount: (n) => set({ openAlertCount: n }),
  activePanel: 'dashboard',
  setActivePanel: (p) => set({ activePanel: p }),
}))
