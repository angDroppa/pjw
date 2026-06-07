import { create } from "zustand"

type LoadingStore = {
  isLoading: boolean
  timer: NodeJS.Timeout | null
  start: () => void
  stop: () => void
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  isLoading: false,
  timer: null,

  start: () => {
    const existingTimer = get().timer
    if (existingTimer) clearTimeout(existingTimer)

    const timer = setTimeout(() => {
      set({ isLoading: true, timer: null })
    }, 1000)

    set({ timer })
  },

  stop: () => {
    const timer = get().timer
    if (timer) clearTimeout(timer)

    set({ isLoading: false, timer: null })
  },
}))