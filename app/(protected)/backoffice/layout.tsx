"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

const tabs = [
  {
    id: "config",
    label: "Configurazione",
    icon: "⚙️",
    href: "/backoffice/config",
  },
  {
    id: "prenotazioni",
    label: "Prenotazioni",
    icon: "📋",
    href: "/backoffice/prenotazioni",
  },
  { id: "stock", label: "Stock", icon: "🚲", href: "/backoffice/stock" },
  {
    id: "statistiche",
    label: "Statistiche",
    icon: "📊",
    href: "/backoffice/statistiche",
  },
    {
    id: "riparazioni",
    label: "Riparazioni",
    icon: "🔧",
    href: "/backoffice/riparazioni",
  },
];

const SIDEBAR_WIDTH = 256;

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = (
    <ul className="menu p-4 gap-1">
      <li className="mb-4">
        <span className="text-xl font-bold pointer-events-none">
          🚲 BikeBack
        </span>
      </li>
      {tabs.map((t) => (
        <li key={t.id}>
          <Link
            href={t.href}
            className={pathname.startsWith(t.href) ? "active" : ""}
            onClick={() => setMobileOpen(false)}
          >
            <span>{t.icon}</span>
            {t.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Sidebar desktop — fixed, invisibile su mobile */}
      <aside className="hidden lg:block fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-base-200 border-r border-base-300 overflow-y-auto z-30">
        {SidebarContent}
      </aside>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-base-200 border-r border-base-300 overflow-y-auto z-50 transition-transform duration-250 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarContent}
      </aside>

      <div className="flex justify-items-start">
        <button
          className="lg:hidden btn btn-sm btn-ghost"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Children */}
      <div className="lg:ml-64 flex flex-rows">
        {/* Bottone hamburger mobile */}

        {children}
      </div>
    </>
  );
}
