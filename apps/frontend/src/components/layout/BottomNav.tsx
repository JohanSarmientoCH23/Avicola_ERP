"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  roles: string[];
}

const allNavItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    roles: ["ADMINISTRADOR", "CONTADOR", "RESPONSABLE_PRODUCCION", "GALPONERO", "AUDITOR", "ALMACENISTA"],
  },
  {
    label: "Reporte",
    href: "/dashboard/production",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "GALPONERO"],
  },
  {
    label: "Huevos",
    href: "/dashboard/inventory",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "ALMACENISTA", "CONTADOR", "GALPONERO"],
  },
  {
    label: "Bandejas",
    href: "/dashboard/inventory?tab=bandejas",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "ALMACENISTA", "GALPONERO"],
  },
  {
    label: "Costos",
    href: "/dashboard/costs",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    roles: ["ADMINISTRADOR", "CONTADOR"],
  },
  {
    label: "Conciliación",
    href: "/dashboard/reconciliation",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    roles: ["ADMINISTRADOR", "CONTADOR", "AUDITOR"],
  },
  {
    label: "Excel",
    href: "/dashboard/excel",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
    roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "CONTADOR"],
  },
  {
    label: "Galpones",
    href: "/dashboard/galpones",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    roles: ["ADMINISTRADOR", "RESPONSABLE_PRODUCCION", "GALPONERO", "CONTADOR", "AUDITOR"],
  },
  {
    label: "Usuarios",
    href: "/dashboard/users",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    roles: ["ADMINISTRADOR"],
  },
];

const rolNavConfig: Record<string, string[]> = {
  GALPONERO: ["Inicio", "Reporte", "Huevos", "Bandejas", "Perfil"],
  CONTADOR: ["Inicio", "Costos", "Conciliación", "Excel", "Perfil"],
  ADMINISTRADOR: ["Inicio", "Galpones", "Usuarios", "Reportes", "Perfil"],
  RESPONSABLE_PRODUCCION: ["Inicio", "Reporte", "Galpones", "Excel", "Perfil"],
  ALMACENISTA: ["Inicio", "Huevos", "Bandejas", "Inventario", "Perfil"],
  AUDITOR: ["Inicio", "Reportes", "Conciliación", "Auditoría", "Perfil"],
};

interface BottomNavProps {
  userRole: string;
  userName?: string;
  className?: string;
}

export function BottomNav({ userRole, userName, className }: BottomNavProps) {
  const pathname = usePathname();
  const allowedLabels = rolNavConfig[userRole] || ["Inicio", "Perfil"];
  const navItems = allNavItems.filter((item) => allowedLabels.includes(item.label));

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
        "safe-area-inset-bottom",
        className
      )}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isLast = index === navItems.length - 1;

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-200",
                "min-w-[60px] flex-1",
                isActive
                  ? "text-green-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={cn("relative", item.badge && "pr-5")}>
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

interface DesktopSidebarProps {
  userRole: string;
  userName?: string;
  className?: string;
}

export function DesktopSidebar({ userRole, userName, className }: DesktopSidebarProps) {
  const pathname = usePathname();
  const allowedLabels = rolNavConfig[userRole] || [];
  const navItems = allNavItems.filter((item) => allowedLabels.includes(item.label));

  return (
    <aside className={cn("w-64 h-screen flex flex-col bg-green-900 text-white", className)}>
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#114232" />
            <path d="M24 10C17.5 10 13 16 13 24C13 32 17.8 38 24 38C30.2 38 35 32 35 24C35 16 30.5 10 24 10Z" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 16V32M18 24H30" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="24" r="4" fill="#F59E0B" />
            <path d="M33 13L37 9M37 13L33 9" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">Avicola ERP</h1>
            <p className="text-xs text-green-300/60">Llano Grande</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-green-100 hover:bg-white/8 hover:text-white"
              )}
            >
              <span className={cn("flex-shrink-0", isActive ? "text-green-300" : "text-green-300/40")}>
                {item.icon}
              </span>
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-green-900 bg-green-300">
            {userName ? `${userName[0]}` : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || "Usuario"}</p>
            <p className="text-xs text-green-300/50 truncate capitalize">{userRole?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}