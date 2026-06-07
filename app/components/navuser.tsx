"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { getCarrelloCount } from "@/lib/carrello";

type NavUserProps = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
  };
};

export default function NavUser({ user }: NavUserProps) {
  const isAdmin = user.roleName === "ADMIN";
  const isCliente = user.roleName === "CUSTOMER";

  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCarrelloCount());

    update();

    window.addEventListener("carrello-updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("carrello-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="flex flex-row">
      <div className="flex flex-row gap-3">
        {isAdmin && (
          <Link href="/backoffice/config" className="font-bold">
            Admin Panel
          </Link>
        )}

        {isCliente && (
          <Link href="/dashboard" className="font-bold">
            Dashboard
          </Link>
        )}

        {isCliente && (
          <Link href="/carrello" className="relative font-bold">
            <ShoppingCart size={20} />

            {count > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold">
                {count}
              </span>
            )}
          </Link>
        )}
      </div>

      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
          {user.firstName} {user.lastName}
          <span className="badge badge-sm badge-primary ml-1">
            {user.roleName}
          </span>
        </div>

        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow"
        >
          {isAdmin && (
            <li>
              <a href="/backoffice/config">Dashboard</a>
            </li>
          )}

          {isCliente && (
            <li>
              <a href="/dashboard">Le mie prenotazioni</a>
            </li>
          )}

          <li className="menu-title text-xs opacity-50">{user.email}</li>

          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </div>
  );
}