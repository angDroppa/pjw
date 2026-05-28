"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const hideNavbarOn = ["/login", "/register"];

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isClient = useIsClient();

  if (hideNavbarOn.includes(pathname)) return null;

  return (
    <div className="w-full">
      <div className="w-full h-16 border-b flex items-center justify-between px-4">
        <div className="ml-auto">
          {isClient && (user ? (
            <Link href="/profile">NavUser</Link>
          ) : (
            <Link href="/login" className="btn btn-sm btn-primary">
              Login
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}