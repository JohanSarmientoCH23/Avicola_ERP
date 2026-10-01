"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface UserInfo {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

const allMenuItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", roles: ["ADMINISTRADOR", "CONTADOR", "RESPONSABLE_PRODUCCION", "GALPONERO", "AUDITOR", "ALMACENISTA"] },
  { label: "Galpones", href: "/dashboard/galpones", icon: "galpones", roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "GALPONERO", "CONTADOR", "AUDITOR"] },
  { label: "Captura Manual", href: "/dashboard/production", icon: "production", roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "GALPONERO"] },
  { label: "OCR - Imagen", href: "/dashboard/ocr", icon: "ocr", roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "GALPONERO"] },
  { label: "Importar Excel", href: "/dashboard/excel", icon: "excel", roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "CONTADOR"] },
  { label: "Comparacion", href: "/dashboard/comparison", icon: "comparison", roles: ["ADMINISTRADOR", "CONTADOR", "AUDITOR"] },
  { label: "Inventarios", href: "/dashboard/inventory", icon: "inventory", roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "ALMACENISTA", "CONTADOR", "GALPONERO"] },
  { label: "Conciliacion", href: "/dashboard/reconciliation", icon: "reconciliation", roles: ["ADMINISTRADOR", "CONTADOR", "AUDITOR"] },
  { label: "Costos", href: "/dashboard/costs", icon: "costs", roles: ["ADMINISTRADOR", "CONTADOR"] },
  { label: "Reportes", href: "/dashboard/reports", icon: "reports", roles: ["ADMINISTRADOR", "CONTADOR", "AUDITOR", "RESPONSABLE_PRODUCCION", "GALPONERO"] },
  { label: "Auditoria", href: "/dashboard/audit", icon: "audit", roles: ["ADMINISTRADOR", "AUDITOR"] },
  { label: "Usuarios", href: "/dashboard/users", icon: "users", roles: ["ADMINISTRADOR"] },
];

const icons: Record<string, JSX.Element> = {
  dashboard: <span className="material-symbols-outlined text-[20px]">space_dashboard</span>,
  galpones: <span className="material-symbols-outlined text-[20px]">warehouse</span>,
  production: <span className="material-symbols-outlined text-[20px]">edit_note</span>,
  ocr: <span className="material-symbols-outlined text-[20px]">document_scanner</span>,
  excel: <span className="material-symbols-outlined text-[20px]">upload_file</span>,
  comparison: <span className="material-symbols-outlined text-[20px]">compare_arrows</span>,
  inventory: <span className="material-symbols-outlined text-[20px]">inventory_2</span>,
  reconciliation: <span className="material-symbols-outlined text-[20px]">checklist</span>,
  costs: <span className="material-symbols-outlined text-[20px]">paid</span>,
  reports: <span className="material-symbols-outlined text-[20px]">analytics</span>,
  audit: <span className="material-symbols-outlined text-[20px]">shield</span>,
  users: <span className="material-symbols-outlined text-[20px]">group</span>,
};

const rolLabels: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  RESPONSABLE_PRODUCCION: "Resp. Produccion",
  GALPONERO: "Galponero",
  AUDITOR: "Auditor",
  ALMACENISTA: "Almacenista",
};

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userCookie = document.cookie.split('; ').find(c => c.startsWith('user='));
      if (userCookie) {
        try { setUser(JSON.parse(decodeURIComponent(userCookie.split('=').slice(1).join('=')))); } catch {}
      }
    }
  }, []);

  const menuItems = allMenuItems.filter(item =>
    user ? item.roles.includes(user.rol) : item.roles.includes("ADMINISTRADOR")
  );

  const initials = user ? `${user.nombre?.[0] || ""}${user.apellido?.[0] || ""}` : "U";

  return (
    <aside className="w-64 h-screen flex flex-col bg-primary text-on-primary">
      {/* Isotipo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#114232"/>
            <path d="M24 10C17.5 10 13 16 13 24C13 32 17.8 38 24 38C30.2 38 35 32 35 24C35 16 30.5 10 24 10Z" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 16V32M18 24H30" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="4" fill="#F59E0B"/>
            <path d="M33 13L37 9M37 13L33 9" stroke="#34D399" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">Avicola ERP</h1>
            <p className="text-xs text-on-primary/60">Llano Grande</p>
          </div>
        </div>
      </div>

      {/* Navegacion */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-on-primary/60 hover:bg-white/8 hover:text-white"
              )}
            >
              <span className={cn("flex-shrink-0", isActive ? "text-secondary-fixed" : "text-on-primary/40")}>
                {icons[item.icon]}
              </span>
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />}
            </Link>
          );
        })}
      </nav>

      {/* Usuario */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-on-primary bg-secondary">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.nombre || "Usuario"} {user?.apellido || ""}</p>
            <p className="text-xs text-on-primary/50 truncate">{rolLabels[user?.rol || ""] || user?.rol || ""}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
