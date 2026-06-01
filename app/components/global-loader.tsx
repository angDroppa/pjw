"use client"

import { useLoadingStore } from "@/lib/store/loading.store"

export default function GlobalLoader() {
  const isLoading = useLoadingStore((state) => state.isLoading)

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  )
}