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
      <div className="fixed top-0 left-0 w-full z-50 bg-gray-100">
        <div className="h-16 flex items-center justify-between px-4">
          <div className="flex-1">
            <Link href="/" className="text-xl font-bold">
              MyApp
            </Link>
          </div>
          <div className="ml-auto">
            {isClient &&
              (user ? (
                <Navuser />
              ) : (
                <Link href="/login" className="btn btn-sm btn-primary">
                  Login
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className="h-16 border"></div>
    </div>
  );
}
