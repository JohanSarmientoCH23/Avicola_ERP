"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-sm border border-line p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-error-container rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink mb-1">Error en el módulo</h2>
        <p className="text-ink-soft text-sm mb-5">
          No se pudo cargar esta sección. Verifica tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
