"use client";

import { authApi } from "@/lib/axios/auth";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navuser() {
  const { user, refreshToken, clearTokens } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearTokens();
      router.replace("/");
    }
  };

  return (
    <div className="flex items-center gap-3">
      {user?.roleName === "ADMIN" && (
        <Link
          href="/backoffice"
          className="text-xs font-medium text-gray-500 hover:text-black transition-colors"
        >
          Backoffice
        </Link>
      )}
      <span className="text-sm text-gray-700 font-medium">
        {user?.firstName} {user?.lastName}
      </span>
      <button
        className="btn btn-sm btn-ghost text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        onClick={handleLogout}
      >
        Esci
      </button>
    </div>
  );
}