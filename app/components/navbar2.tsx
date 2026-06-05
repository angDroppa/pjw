"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import Navuser from "./navuser";

const hideNavbarOn = ["/login", "/register"];

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isClient = useIsClient();

  if (hideNavbarOn.includes(pathname)) return null;

  return (
    <div className="w-full">
      <div className="fixed top-0 left-0 w-full z-50 bg-gray-100 border-b border-gray-200">
        <div className="h-16 flex items-center justify-between px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-black">
              BikeStore
            </Link>
            {isClient && user && (
              <nav className="flex items-center gap-4 ml-4">
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/"
                      ? "text-emerald-600 border-b-2 border-emerald-600"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Catalogo
                </Link>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith("/dashboard")
                      ? "text-emerald-600 border-b-2 border-emerald-600"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Dashboard
                </Link>
              </nav>
            )}
          </div>
          <div className="ml-auto">
            {isClient &&
              (user ? (
                <Navuser />
              ) : (
                <Link href="/login" className="btn btn-sm btn-primary">
                  Accedi
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className="h-16"></div>
    </div>
  );
}
