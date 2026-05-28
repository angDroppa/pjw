"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import { authApi } from "@/lib/axios/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSyncExternalStore } from "react";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

const hideNavbarOn = ['/login', '/register']

export default function Navbar() {
  const { user, refreshToken, clearTokens } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname()
  const isClient = useIsClient()

  if (hideNavbarOn.some(p => pathname.startsWith(p))) return null

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearTokens();
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="navbar bg-base-300 shadow-sm px-4">
      <div className="flex-1">
        <Link href="/" className="text-xl font-bold">
          MyApp
        </Link>
      </div>

      <div className="flex-none">
        {isClient && user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-70">{user.firstName} {user.lastName}</span>
            <button className="btn btn-sm btn-error" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : isClient ? (
          <Link href="/login" className="btn btn-sm btn-primary">
            Login
          </Link>
        ) : null}
      </div>
    </div>
  );
}