"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/galpones": "Galpones",
  "/dashboard/production": "Captura Manual",
  "/dashboard/ocr": "OCR - Imagen",
  "/dashboard/excel": "Importar Excel",
  "/dashboard/comparison": "Comparacion",
  "/dashboard/inventory": "Inventarios",
  "/dashboard/reconciliation": "Conciliacion",
  "/dashboard/costs": "Costos",
  "/dashboard/reports": "Reportes",
  "/dashboard/audit": "Auditoria",
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/");
  };

  const currentPage = pageNames[pathname] || "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 lg:hidden">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{currentPage}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>En linea</span>
        </div>
        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">{user?.nombre} {user?.apellido}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{user?.rol}</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
