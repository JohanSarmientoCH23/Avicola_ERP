"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopSidebar } from "@/components/layout/BottomNav";
import { DesktopHeader } from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      const userCookie = document.cookie.split("; ").find((c) => c.startsWith("user="));
      let parsed: any = null;
      if (userCookie) {
        try {
          parsed = JSON.parse(decodeURIComponent(userCookie.split("=").slice(1).join("=")));
          setUser(parsed);
        } catch {}
      }
      if (!parsed?.nombre || !parsed?.apellido || !parsed?.rol) {
        authService.me().then((result) => {
          if (result?.user) setUser(result.user);
        }).catch(() => {});
      }
    }
  }, [pathname]);

  const isMobile = useIsMobile(1024);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.trim().split("=")[0] + "=; path=/; max-age=0";
      });
      window.location.href = "/";
    }
  };

  const pageTitles: Record<string, string> = {
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
    "/dashboard/users": "Usuarios",
  };

  const title = pageTitles[pathname] || "Dashboard";

  const displayName =
    [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const displayUser = user
    ? {
        ...user,
        nombre: user.nombre?.trim() || user.email?.split("@")[0] || "Usuario",
        apellido: user.apellido?.trim() || "",
      }
    : user;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-canvas">
        <MobileHeader
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          user={displayUser}
        />
        <main className="pt-14 pb-20 overflow-y-auto">
          {children}
        </main>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="fixed inset-y-0 right-0 w-72 bg-surface-lowest shadow-xl animate-slide-in">
              <DesktopSidebar userRole={user?.rol} userName={displayName} />
            </div>
          </div>
        )}

        <BottomNav userRole={user?.rol} userName={displayName} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={cn(
        `${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`,
        "fixed lg:relative z-40 h-full w-72 transition-transform duration-300"
      )}>
        <DesktopSidebar userRole={user?.rol} userName={displayName} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DesktopHeader
          title={title}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={displayUser}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1500px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}