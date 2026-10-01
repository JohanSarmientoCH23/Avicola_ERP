"use client";

import { useState, useEffect } from "react";
import { reconciliationService } from "@/lib/api";

interface DetalleItem {
  concepto: string;
  valorImagen: number;
  valorExcel: number;
  diferencia: number;
  estado: string;
}

interface ConciliacionData {
  id: string;
  fecha: string;
  estado: string;
  _count?: { detalles: number };
  detalles?: DetalleItem[];
}

function getEstadoBadge(estado: string) {
  const map: Record<string, { bg: string; text: string; icon: string }> = {
    APROBADA: { bg: "bg-secondary-fixed/40 text-on-secondary-fixed-variant", text: "Aprobada", icon: "check_circle" },
    RECHAZADA: { bg: "bg-error-container text-on-error-container", text: "Rechazada", icon: "cancel" },
    PENDIENTE: { bg: "bg-surface-container text-on-surface-variant", text: "Pendiente", icon: "schedule" },
  };
  const s = map[estado] || map.PENDIENTE;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-data-sm font-label-data-sm font-semibold ${s.bg}`}>
      <span className="material-symbols-outlined text-sm">{s.icon}</span>
      {s.text}
    </span>
  );
}

function getDetalleBadge(estado: string) {
  const map: Record<string, { bg: string; icon: string }> = {
    CORRECTO: { bg: "bg-secondary-fixed/40 text-on-secondary-fixed-variant", icon: "check_circle" },
    REVISAR: { bg: "bg-tertiary-fixed text-on-tertiary-fixed-variant", icon: "warning" },
    ERROR: { bg: "bg-error-container text-on-error-container", icon: "error" },
  };
  const s = map[estado] || map.ERROR;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-data-sm font-label-data-sm font-semibold ${s.bg}`}>
      <span className="material-symbols-outlined text-sm">{s.icon}</span>
      {estado}
    </span>
  );
}

export default function ReconciliationPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [conciliaciones, setConciliaciones] = useState<ConciliacionData[]>([]);
  const [selected, setSelected] = useState<ConciliacionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadConciliaciones(); }, []);

  const loadConciliaciones = async () => {
    try {
      const response = await reconciliationService.getAll({ page: 1, limit: 20 });
      setConciliaciones(response.data?.data || []);
    } catch (error) { console.error(error); }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const response = await reconciliationService.generate(fecha);
      setSelected(response.data);
      loadConciliaciones();
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    try {
      await reconciliationService.approve(id);
      alert("Conciliación aprobada");
      loadConciliaciones();
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const totalImagen = selected?.detalles?.reduce((s, d) => s + d.valorImagen, 0) || 0;
  const totalExcel = selected?.detalles?.reduce((s, d) => s + d.valorExcel, 0) || 0;
  const totalDiferencia = selected?.detalles?.reduce((s, d) => s + d.diferencia, 0) || 0;
  const totalCorrectos = selected?.detalles?.filter((d) => d.estado === "CORRECTO").length || 0;
  const totalRevisar = selected?.detalles?.filter((d) => d.estado === "REVISAR" || d.estado === "ERROR").length || 0;
  const conciliacionesPendientes = conciliaciones.filter((c) => c.estado === "PENDIENTE").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-label-ui uppercase tracking-wider text-secondary font-semibold bg-secondary-fixed/50 px-2 py-0.5 rounded">Operación en Vivo</span>
          </div>
          <h1 className="page-title">Conciliación OCR vs Excel</h1>
          <p className="page-subtitle">Revisión automática de datos de producción vs. fuente oficial</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input-field w-full sm:w-40"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="btn-success flex items-center gap-2 px-4 py-2.5"
          >
            <span className="material-symbols-outlined text-lg">
              {loading ? "sync" : "refresh"}
            </span>
            {loading ? "Generando..." : "Generar"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-surface-lowest rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
          <span className="text-label-ui uppercase tracking-wider text-outline font-semibold">Estado</span>
          <div className="mt-2 text-label-data-md font-bold text-primary">
            {selected?.estado || "Sin seleccionar"}
          </div>
          <p className="text-label-data-sm text-outline mt-0.5">Seleccionar o generar</p>
        </div>
        <div className="bg-surface-lowest rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-on-tertiary-container" />
          <span className="text-label-ui uppercase tracking-wider text-outline font-semibold">Diferencia Total</span>
          <div className={`mt-2 text-label-data-md font-bold ${totalDiferencia !== 0 ? "text-error" : "text-secondary"}`}>
            {totalDiferencia.toLocaleString()}
          </div>
          <p className="text-label-data-sm text-outline mt-0.5">Diferencias a revisar</p>
        </div>
        <div className="bg-surface-lowest rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-outline-variant" />
          <span className="text-label-ui uppercase tracking-wider text-outline font-semibold">Total Fila</span>
          <div className="mt-2 text-label-data-md font-bold text-on-surface">{selected?.detalles?.length || 0}</div>
          <p className="text-label-data-sm text-outline mt-0.5">Filas de datos</p>
        </div>
        <div className="bg-surface-lowest rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
          <span className="text-label-ui uppercase tracking-wider text-outline font-semibold">Correctos</span>
          <div className="mt-2 text-label-data-md font-bold text-secondary">{totalCorrectos}</div>
          <p className="text-label-data-sm text-outline mt-0.5">Concuerdan perfecto</p>
        </div>
        <div className="bg-surface-lowest rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-error" />
          <span className="text-label-ui uppercase tracking-wider text-outline font-semibold">Revisar / Error</span>
          <div className="mt-2 text-label-data-md font-bold text-error">{totalRevisar}</div>
          <p className="text-label-data-sm text-outline mt-0.5">Requieren intervención</p>
        </div>
      </div>

      {/* Tabla principal */}
      <div className="bg-surface-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="section-title">Conciliaciones Recientes</h2>
            <p className="text-body-sm text-outline">{conciliacionesPendientes} pendientes de aprobación</p>
          </div>
          <span className="text-label-data-sm text-outline font-semibold">Últimas 20 conciliaciones</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="p-3 text-left text-label-ui">Fecha</th>
                <th className="p-3 text-center text-label-ui">Estado</th>
                <th className="p-3 text-right text-label-ui">Detalles</th>
                <th className="p-3 text-center text-label-ui">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conciliaciones.map((c) => (
                <tr
                  key={c.id}
                  className={`table-row cursor-pointer ${selected?.id === c.id ? "bg-secondary-fixed/20" : ""}`}
                  onClick={() => setSelected(c)}
                >
                  <td className="p-3 text-body-sm text-on-surface">
                    {new Date(c.fecha).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
                  </td>
                  <td className="p-3 text-center">{getEstadoBadge(c.estado)}</td>
                  <td className="p-3 text-right text-label-data-sm font-bold text-primary">
                    {c._count?.detalles || 0} registros
                  </td>
                  <td className="p-3 text-center">
                    {c.estado === "PENDIENTE" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); approve(c.id); }}
                        className="btn-success px-3 py-1.5 text-label-data-sm"
                      >
                        Aprobar
                      </button>
                    )}
                    {c.estado !== "PENDIENTE" && (
                      <button className="btn-outline px-3 py-1.5 text-label-data-sm">
                        Ver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de conciliación */}
      {selected && (
        <div className="bg-surface-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="section-title">
                Detalle de Conciliación —{" "}
                {new Date(selected.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </h2>
              <p className="text-body-sm text-outline">
                Comparación de valores de imagen OCR vs. datos Excel
              </p>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-label-ui text-outline uppercase block">Imagen OCR</span>
                <span className="text-label-data-md font-bold text-primary">{totalImagen.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-label-ui text-outline uppercase block">Excel</span>
                <span className="text-label-data-md font-bold text-on-tertiary-container">{totalExcel.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-label-ui text-outline uppercase block">Diferencia</span>
                <span className={`text-label-data-md font-bold ${totalDiferencia !== 0 ? "text-error" : "text-secondary"}`}>
                  {totalDiferencia.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-6 py-3 bg-surface-low flex gap-2">
            {["Todos", "Correctos", "Revisar", "Error"].map((f) => (
              <button
                key={f}
                className={`px-3 py-1.5 rounded-lg text-label-data-sm font-semibold transition-colors ${
                  f === "Todos"
                    ? "bg-surface-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-3 text-left text-label-ui">Concepto</th>
                  <th className="p-3 text-right text-label-ui">Valor Imagen</th>
                  <th className="p-3 text-right text-label-ui">Valor Excel</th>
                  <th className="p-3 text-right text-label-ui">Diferencia</th>
                  <th className="p-3 text-center text-label-ui">Estado</th>
                </tr>
              </thead>
              <tbody>
                {selected.detalles?.map((d: DetalleItem, i: number) => (
                  <tr
                    key={i}
                    className={`table-row ${
                      d.estado === "ERROR" ? "bg-error/5" : d.estado === "REVISAR" ? "bg-tertiary-fixed/20" : ""
                    }`}
                  >
                    <td className="p-3 text-body-sm text-on-surface font-medium">{d.concepto}</td>
                    <td className="p-3 text-right text-label-data-sm font-mono text-on-surface">
                      {d.valorImagen.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-label-data-sm font-mono text-on-surface">
                      {d.valorExcel.toLocaleString()}
                    </td>
                    <td className={`p-3 text-right text-label-data-sm font-mono font-semibold ${
                      d.diferencia !== 0 ? "text-error" : "text-secondary"
                    }`}>
                      {d.diferencia !== 0 && (d.diferencia > 0 ? "+" : "")}
                      {d.diferencia.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">{getDetalleBadge(d.estado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
