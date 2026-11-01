"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  showBack?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
  user?: {
    nombre: string;
    apellido: string;
    rol: string;
  };
  className?: string;
}

export function MobileHeader({
  title,
  onMenuClick,
  onProfileClick,
  showBack = false,
  onBackClick,
  actions,
  user,
  className,
}: MobileHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rolLabels: Record<string, string> = {
    ADMINISTRADOR: "Administrador",
    CONTADOR: "Contador",
    RESPONSABLE_PRODUCCION: "Resp. Producción",
    GALPONERO: "Galponero",
    AUDITOR: "Auditor",
    ALMACENISTA: "Almacenista",
  };

  const initials = user ? `${user.nombre?.[0] || ""}${user.apellido?.[0] || ""}` : "U";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200",
        "flex items-center justify-between px-4",
        "shadow-sm backdrop-blur-sm bg-white/95",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && onBackClick ? (
          <button
            onClick={onBackClick}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : onMenuClick ? (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}
        <h1 className="text-base font-semibold text-gray-800 truncate flex-1 text-center">{title}</h1>
      </div>

      <div className="flex items-center gap-2 relative">
        {actions}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={showProfile}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-green-600">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-[10px] text-gray-500 truncate max-w-[120px]">
                  {rolLabels[user.rol] || user.rol}
                </p>
              </div>
              <svg className={cn("w-4 h-4 text-gray-400 transition-transform", showProfile && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{user.nombre} {user.apellido}</p>
                  <p className="text-xs text-gray-500 capitalize">{rolLabels[user.rol]?.toLowerCase() || user.rol.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    // TODO: navigate to profile
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mi perfil
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    // TODO: logout
                  }}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================
// DESKTOP HEADER (para layout desktop)
// ============================================================

interface DesktopHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  user?: any;
  onLogout: () => void;
}

export function DesktopHeader({
  title,
  onToggleSidebar,
  user,
  onLogout,
}: DesktopHeaderProps) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

  const rolLabels: Record<string, string> = {
    ADMINISTRADOR: "Administrador",
    CONTADOR: "Contador",
    RESPONSABLE_PRODUCCION: "Resp. de Producción",
    GALPONERO: "Galponero",
    AUDITOR: "Auditor",
    ALMACENISTA: "Almacenista",
  };

  const initials = user ? `${user.nombre?.[0] || ""}${user.apellido?.[0] || ""}` : "U";

  return (
    <header className="h-[76px] flex-shrink-0 bg-surface-lowest/90 backdrop-blur border-b border-line flex items-center justify-between gap-4 px-5 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-surface-low transition-colors lg:hidden"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-ink-soft font-medium">
            <span className="hover:text-brand cursor-default">Granja Llano Grande</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-ink">Centro de Mando Operacional</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-ink tracking-tight truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden xl:flex items-center gap-2 px-3 h-10 rounded-xl border border-line bg-surface-low/60 text-[12px] font-semibold text-ink-soft">
          <span className="material-symbols-outlined text-[17px] text-brand">calendar_month</span>
          <span>{fmt(start)}</span>
          <span className="text-outline">—</span>
          <span>{fmt(end)}</span>
          <span className="material-symbols-outlined text-[17px] text-outline">expand_more</span>
        </div>

        <a
          href="/dashboard/production"
          className="hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand text-white text-[13px] font-semibold shadow-sm hover:bg-brand-strong transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Movimiento
        </a>

        <button
          className="relative w-10 h-10 rounded-xl border border-line bg-surface-lowest flex items-center justify-center text-ink-soft hover:text-brand hover:border-brand/30 transition-colors"
          aria-label="Notificaciones"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-error ring-2 ring-surface-lowest" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-line">
          <div className="w-9 h-9 rounded-full bg-brand-soft text-brand-dark flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-[13px] font-semibold text-ink truncate max-w-[140px]">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-[11px] text-ink-soft truncate max-w-[140px]">
              {rolLabels[user?.rol] || user?.rol}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-outline hover:text-error hover:bg-error-container/40 transition-colors"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <span className="material-symbols-outlined text-[19px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}