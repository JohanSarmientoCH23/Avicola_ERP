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
    label: "Reportes",
    href: "/dashboard/reports",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m3 6V7m3 10v-3M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>,
    roles: ["ADMINISTRADOR", "CONTADOR", "AUDITOR", "RESPONSABLE_PRODUCCION"],
  },
  {
    label: "Auditoría",
    href: "/dashboard/audit",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v5c0 4.418-2.91 8.457-7 9.5-4.09-1.043-7-5.082-7-9.5V6l7-3zM9 12l2 2 4-4" /></svg>,
    roles: ["ADMINISTRADOR", "AUDITOR"],
  },
  {
    label: "Usuarios",
    href: "/dashboard/users",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    roles: ["ADMINISTRADOR"],
  },
];

const rolNavConfig: Record<string, string[]> = {
  GALPONERO: ["Reporte", "Huevos", "Bandejas"],
  CONTADOR: ["Inicio", "Costos", "Conciliación", "Excel", "Reportes"],
  ADMINISTRADOR: ["Inicio", "Galpones", "Usuarios", "Reportes", "Auditoría"],
  RESPONSABLE_PRODUCCION: ["Inicio", "Reporte", "Galpones", "Excel", "Reportes"],
  ALMACENISTA: ["Inicio", "Huevos", "Bandejas"],
  AUDITOR: ["Inicio", "Reportes", "Conciliación", "Auditoría"],
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

const desktopIconNames: Record<string, string> = {
  "/dashboard": "space_dashboard",
  "/dashboard/production": "edit_note",
  "/dashboard/inventory": "inventory_2",
  "/dashboard/costs": "payments",
  "/dashboard/reconciliation": "fact_check",
  "/dashboard/excel": "upload_file",
  "/dashboard/galpones": "warehouse",
  "/dashboard/reports": "monitoring",
  "/dashboard/audit": "verified_user",
  "/dashboard/users": "group",
};

const rolLabelsShort: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  RESPONSABLE_PRODUCCION: "Resp. Producción",
  GALPONERO: "Galponero",
  AUDITOR: "Auditor",
  ALMACENISTA: "Almacenista",
};

export function DesktopSidebar({ userRole, userName, className }: DesktopSidebarProps) {
  const pathname = usePathname();
  const allowedLabels = rolNavConfig[userRole] || ["Inicio"];
  const navItems = allNavItems.filter((item) => allowedLabels.includes(item.label));

  return (
    <aside className={cn("w-72 h-screen flex flex-col bg-surface-lowest border-r border-line", className)}>
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-secondary-fixed text-[24px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
              egg_alt
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-ink text-[17px] tracking-tight leading-tight">Avícola ERP</h1>
            <p className="text-[11px] text-ink-soft font-medium tracking-wide">GESTIÓN DE GALPONES</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-line bg-surface-low/60 hover:bg-surface-low transition-colors group">
          <span className="icon-chip bg-brand-soft text-brand-strong">
            <span className="material-symbols-outlined">home_work</span>
          </span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">Granja activa</span>
            <span className="block text-sm font-semibold text-ink truncate">Granja Llano Grande</span>
          </span>
          <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-brand">expand_more</span>
        </button>
      </div>

      <div className="px-5 pb-2">
        <p className="eyebrow">Operaciones &amp; control</p>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn("nav-pill", isActive ? "nav-pill-active" : "nav-pill-idle")}
            >
              <span className="material-symbols-outlined text-[21px]">
                {desktopIconNames[item.href] || "circle"}
              </span>
              <span className="truncate">{item.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary-fixed" />}
            </a>
          );
        })}
      </nav>

      <div className="px-4 pb-3">
        <div className="rounded-2xl border border-line bg-surface-low/60 px-3 py-2.5 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-ink leading-tight">Sincronizado v2.4</p>
            <p className="text-[10px] text-ink-soft leading-tight">99.8% Online</p>
          </div>
          <span className="material-symbols-outlined text-[16px] text-ink-soft">cloud_done</span>
        </div>
      </div>

      <div className="p-4 border-t border-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-brand-dark bg-brand-soft">
            {userName ? `${userName[0]}` : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{userName || "Usuario"}</p>
            <p className="text-[11px] text-ink-soft truncate">{rolLabelsShort[userRole] || userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}