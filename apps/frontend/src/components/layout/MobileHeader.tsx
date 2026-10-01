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
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm lg:static lg:shadow-none lg:border-0 lg:bg-transparent">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800 lg:text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>En línea</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">{user?.nombre} {user?.apellido}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{user?.rol}</span>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}