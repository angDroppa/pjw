import { create } from "zustand"

type LoadingStore = {
  isLoading: boolean
  start: () => void
  stop: () => void
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  start: () => set({ isLoading: true }),
  stop: () => set({ isLoading: false }),
}))