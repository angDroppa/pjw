"use client";

import { authApi } from "@/lib/axios/auth";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";

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
    <div className="flex items-center gap-4">
      <span className="text-sm opacity-70">
        {user?.firstName} {user?.lastName}
      </span>
      <button className="btn btn-sm btn-error" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}