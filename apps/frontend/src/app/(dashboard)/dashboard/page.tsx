"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart, Pie, Cell,
} from "recharts";
import { dashboardService, galponesService, inventoryService, reportsService } from "@/lib/api";
import { localDateString } from "@/lib/utils";

const CARD = "bg-surface-lowest rounded-2xl border border-line shadow-sm";
const PIE_COLORS = ["#0a8a5f", "#0e5a41", "#f59e0b", "#2563eb", "#8b5cf6", "#ec4899", "#8a968f"];

const periods = [
  { key: "hoy", label: "Hoy", dias: 1 },
  { key: "7d", label: "7 Días", dias: 7 },
  { key: "30d", label: "30 Días", dias: 30 },
  { key: "mes", label: "Mes Actual", dias: new Date().getDate() },
] as const;

type PeriodKey = (typeof periods)[number]["key"];

function n(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compact(value: number): string {
  return value.toLocaleString("es-CO");
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CO", { day: "2-digit", month: "short", timeZone: "UTC" }).replace(".", "");
}

function dayDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  tone: "brand" | "green" | "amber" | "red" | "blue" | "slate";
  footer?: React.ReactNode;
}

const toneStyles: Record<KpiTileProps["tone"], { chip: string; icon: string }> = {
  brand: { chip: "bg-brand-soft", icon: "text-brand-strong" },
  green: { chip: "bg-brand-soft-2", icon: "text-brand-strong" },
  amber: { chip: "bg-tertiary-fixed", icon: "text-on-tertiary-container" },
  red: { chip: "bg-error-container", icon: "text-error" },
  blue: { chip: "bg-surface-container", icon: "text-primary" },
  slate: { chip: "bg-surface-container", icon: "text-ink-soft" },
};

function KpiTile({ label, value, unit, icon, tone, footer }: KpiTileProps) {
  const styles = toneStyles[tone];
  return (
    <div className="kpi-tile">
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow leading-tight">{label}</p>
        <span className={`icon-chip ${styles.chip}`}>
          <span className={`material-symbols-outlined ${styles.icon}`}>{icon}</span>
        </span>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] leading-none font-extrabold tracking-tight text-ink font-mono">
            {typeof value === "number" ? compact(value) : value}
          </span>
          {unit && <span className="text-[11px] font-medium text-ink-soft">{unit}</span>}
        </div>
        {footer}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<any>(null);
  const [produccionGalpon, setProduccionGalpon] = useState<any[]>([]);
  const [serieDiaria, setSerieDiaria] = useState<any[]>([]);
  const [tendencia, setTendencia] = useState<any[]>([]);
  const [chartMode, setChartMode] = useState<"diario" | "mensual">("diario");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("hoy");

  const [galpones, setGalpones] = useState<any[]>([]);
  const [galponId, setGalponId] = useState("");
  const [kardexTab, setKardexTab] = useState<"gallinas" | "huevos" | "alimento" | "bandejas">("gallinas");
  const [kardexRows, setKardexRows] = useState<any[]>([]);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [kardexPage, setKardexPage] = useState(1);

  const dias = periods.find((p) => p.key === period)?.dias ?? 1;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userCookie = document.cookie.split("; ").find((c) => c.startsWith("user="));
    if (!userCookie) return;
    try {
      const user = JSON.parse(decodeURIComponent(userCookie.split("=").slice(1).join("=")));
      if (user?.rol === "GALPONERO") router.replace("/dashboard/production");
    } catch {}
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      const [kpiRes, galponRes, tendRes, semanalRes] = await Promise.all([
        dashboardService.getKPIs({ dias }),
        dashboardService.getProduccionPorGalpon({ dias }),
        dashboardService.getTendenciaMensual(6),
        reportsService.getSemanal({
          fechaInicio: localDateString(new Date(Date.now() - 29 * 86400000)),
          fechaFin: localDateString(),
        }),
      ]);
      setKpis(kpiRes.data);
      setProduccionGalpon(galponRes.data || []);
      setTendencia(Array.isArray(tendRes.data) ? tendRes.data : []);
      const resumen = semanalRes.data?.resumen || [];
      setSerieDiaria(Array.isArray(resumen) ? resumen : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dias]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    galponesService.getAll()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setGalpones(list);
        if (list.length > 0) setGalponId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadKardex = useCallback(async () => {
    if (!galponId) return;
    setKardexLoading(true);
    try {
      if (kardexTab === "gallinas") {
        const res = await inventoryService.getGallinas(galponId);
        setKardexRows(Array.isArray(res.data) ? [...res.data].reverse() : []);
      } else if (kardexTab === "alimento") {
        const res = await inventoryService.getAlimento(galponId);
        setKardexRows(Array.isArray(res.data) ? [...res.data].reverse() : []);
      } else if (kardexTab === "bandejas") {
        const res = await inventoryService.getBandejas(galponId);
        setKardexRows(Array.isArray(res.data) ? [...res.data].reverse() : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setKardexLoading(false);
    }
  }, [galponId, kardexTab]);

  useEffect(() => {
    setKardexPage(1);
    if (kardexTab !== "huevos") loadKardex();
  }, [galponId, kardexTab, loadKardex]);

  const metaDiaria = Math.round(n(kpis?.gallinasVivas) * 0.8);
  const variacion = kpis?.variacionPorcentaje;
  const produccionTotal = n(kpis?.produccionDiaria?.total);
  const postura = n(kpis?.porcentajePostura);
  const cumplimiento = metaDiaria > 0 ? (n(kpis?.promedioDiario) / metaDiaria) * 100 : 0;
  const inventarioHuevos = (kpis?.inventarioHuevos || []).reduce(
    (sum: number, item: any) => sum + n(item?._sum?.saldoFinal),
    0,
  );
  const bandejas = Math.round(inventarioHuevos / 30);
  const alimentoKg = n(kpis?.produccionDiaria?.consumo);
  const alimentoTon = alimentoKg / 1000;
  const alimentoPorAve = n(kpis?.gallinasVivas) > 0 && dias > 0
    ? (alimentoKg * 1000) / (n(kpis?.gallinasVivas) * dias)
    : 0;
  const conciliaciones = n(kpis?.conciliacionesPendientes ?? kpis?.comparacionesHoy?.conDiferencias);
  const cobertura = `${n(kpis?.galponesConReporte)}/${n(kpis?.galponesActivos)}`;

  const chartData = useMemo(
    () => serieDiaria.map((row: any) => ({
      dia: shortDate(row.fecha),
      produccion: n(row.totalProduccion),
      meta: metaDiaria,
    })),
    [serieDiaria, metaDiaria],
  );

  const tendenciaData = useMemo(
    () => tendencia.map((row: any) => ({
      mes: row.mes,
      produccion: n(row.produccion),
      mortalidad: n(row.mortalidad),
    })),
    [tendencia],
  );

  const inventarioPorTipo = useMemo(
    () => (kpis?.inventarioHuevos || [])
      .map((h: any, i: number) => ({
        name: h.tipoHuevo?.codigo || h.tipoHuevo?.nombre || `Tipo ${i + 1}`,
        value: n(h._sum?.saldoFinal),
      }))
      .filter((item: any) => item.value > 0),
    [kpis],
  );

  const totalMensual = tendenciaData.reduce((acc: number, row: any) => acc + row.produccion, 0);
  const mortalidadMensual = tendenciaData.reduce((acc: number, row: any) => acc + row.mortalidad, 0);
  const promedioMensual = tendenciaData.length > 0 ? totalMensual / tendenciaData.length : 0;

  const galponesOrdenados = useMemo(
    () => [...produccionGalpon].sort((a, b) => (n(b.produccion) / Math.max(n(b.meta), 1)) - (n(a.produccion) / Math.max(n(a.meta), 1))),
    [produccionGalpon],
  );

  const mejorGalpon = galponesOrdenados[0];
  const mejorPct = mejorGalpon ? (n(mejorGalpon.produccion) / Math.max(n(mejorGalpon.meta), 1)) * 100 : 0;

  const perPage = 6;
  const kardexVisible = kardexTab === "huevos"
    ? (kpis?.inventarioHuevos || []).map((h: any) => ({
        tipo: h.tipoHuevo?.codigo || h.tipoHuevo?.nombre || "—",
        saldoFinal: n(h._sum?.saldoFinal),
      }))
    : kardexRows;
  const totalPages = Math.max(1, Math.ceil(kardexVisible.length / perPage));
  const pageRows = kardexVisible.slice((kardexPage - 1) * perPage, kardexPage * perPage);

  const kardexTotals = useMemo(() => {
    if (kardexTab === "gallinas") {
      const sum = (key: string) => kardexRows.reduce((acc, row) => acc + n(row[key]), 0);
      return {
        saldo: kardexRows.length > 0 ? n(kardexRows[0].saldoFinal) : 0,
        entradas: sum("entradas"),
        mortalidad: kardexRows.slice(0, 7).reduce((acc, row) => acc + n(row.mortalidad), 0),
        ventas: sum("ventas"),
      };
    }
    if (kardexTab === "alimento") {
      return {
        saldo: kardexRows.length > 0 ? n(kardexRows[0].saldoFinalKg) : 0,
        entradas: kardexRows.reduce((acc, row) => acc + n(row.entradasKg), 0),
        mortalidad: 0,
        ventas: kardexRows.reduce((acc, row) => acc + n(row.consumoKg), 0),
      };
    }
    if (kardexTab === "bandejas") {
      return {
        saldo: kardexRows.length > 0 ? n(kardexRows[0].saldoBodega) : 0,
        entradas: kardexRows.reduce((acc, row) => acc + n(row.entradas), 0),
        mortalidad: 0,
        ventas: kardexRows.reduce((acc, row) => acc + n(row.salidas), 0),
      };
    }
    return {
      saldo: inventarioHuevos,
      entradas: 0,
      mortalidad: 0,
      ventas: 0,
    };
  }, [kardexRows, kardexTab, inventarioHuevos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-ink-soft">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Cargando centro de mando...</span>
        </div>
      </div>
    );
  }

  const periodLabel = periods.find((p) => p.key === period)?.label || "Hoy";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-ink">
              Resumen Operativo &amp; Kardex
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Activo
            </span>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            Control integral de producción avícola, postura diaria y balance de existencias
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-ink-soft mt-2 font-medium">
            <span className="material-symbols-outlined text-[15px] text-brand">location_on</span>
            Granja Llano Grande
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="segmented">
            {periods.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPeriod(option.key)}
                aria-pressed={period === option.key}
                className={`segmented-item ${period === option.key ? "segmented-item-active" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <a
            href="/dashboard/production"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand text-white text-[13px] font-semibold shadow-sm hover:bg-brand-strong transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Registrar Lote / Movimiento
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <KpiTile
          label={`Producción ${periodLabel}`}
          value={produccionTotal}
          unit="huevos"
          icon="egg"
          tone="brand"
          footer={
            <div className="mt-2 space-y-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                variacion === null || variacion === undefined
                  ? "bg-surface-container text-ink-soft"
                  : n(variacion) >= 0
                    ? "bg-brand-soft text-brand-strong"
                    : "bg-error-container text-error"
              }`}>
                <span className="material-symbols-outlined text-[13px]">
                  {variacion !== null && variacion !== undefined && n(variacion) >= 0 ? "trending_up" : "trending_down"}
                </span>
                {variacion === null || variacion === undefined ? "Sin comparación" : `${n(variacion) >= 0 ? "+" : ""}${variacion}%`}
              </span>
              <div>
                <div className="flex items-center justify-between text-[10px] font-medium text-ink-soft mb-1">
                  <span>Postura promedio</span>
                  <span className="font-bold text-brand-strong">{postura}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill bg-brand" style={{ width: `${Math.min(postura, 100)}%` }} />
                </div>
              </div>
            </div>
          }
        />

        <KpiTile
          label="Mortalidad"
          value={n(kpis?.produccionDiaria?.mortalidad)}
          unit="aves"
          icon="monitor_heart"
          tone="red"
          footer={
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-ink-soft">{n(kpis?.mortalidadPorcentaje)}% de la parvada</p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                n(kpis?.mortalidadPorcentaje) > 1 ? "text-error" : "text-brand-strong"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${n(kpis?.mortalidadPorcentaje) > 1 ? "bg-error" : "bg-brand"}`} />
                {n(kpis?.mortalidadPorcentaje) > 1 ? "Revisar alerta" : "Normal"}
              </span>
            </div>
          }
        />

        <KpiTile
          label="Aves vivas"
          value={n(kpis?.gallinasVivas)}
          unit="aves"
          icon="groups"
          tone="green"
          footer={
            <div className="mt-2 space-y-1.5">
              <p className="text-[11px] text-ink-soft">{n(kpis?.galponesActivos)} galpones activos</p>
              <div className="flex items-center justify-between text-[10px] text-ink-soft">
                <span>Cobertura de reporte</span>
                <span className="font-bold text-brand-strong">{cobertura}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill bg-brand"
                  style={{ width: `${n(kpis?.galponesActivos) > 0 ? (n(kpis?.galponesConReporte) / n(kpis?.galponesActivos)) * 100 : 0}%` }}
                />
              </div>
            </div>
          }
        />

        <KpiTile
          label="Inventario huevos"
          value={inventarioHuevos}
          unit="uds"
          icon="inventory_2"
          tone="blue"
          footer={
            <div className="mt-2">
              <p className="text-[11px] text-ink-soft">Disponible para despacho</p>
              <p className="text-[10px] text-ink-soft mt-0.5">
                <span className="font-bold text-ink">{compact(bandejas)}</span> bandejas aprox.
              </p>
            </div>
          }
        />

        <KpiTile
          label="Alimento consumido"
          value={alimentoTon >= 10 ? alimentoTon.toFixed(1) : alimentoTon.toFixed(2)}
          unit="Ton"
          icon="restaurant"
          tone="amber"
          footer={
            <div className="mt-2">
              <p className="text-[11px] text-ink-soft">Consumo del período</p>
              <p className="text-[10px] text-ink-soft mt-0.5">
                <span className="font-bold text-ink">{alimentoPorAve.toFixed(1)}</span> g/ave/día
              </p>
            </div>
          }
        />

        <KpiTile
          label="Conciliaciones"
          value={conciliaciones}
          unit="alertas"
          icon="fact_check"
          tone={conciliaciones > 0 ? "amber" : "brand"}
          footer={
            <div className="mt-2">
              <p className="text-[11px] text-ink-soft">Diferencias de kardex</p>
              <p className="text-[10px] text-ink-soft mt-0.5">
                <span className="font-bold text-ink">{n(kpis?.comparacionesHoy?.total)}</span> comparaciones hoy
              </p>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className={`${CARD} xl:col-span-7 p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="section-title">Producción de Huevos &amp; Eficiencia de Postura</h2>
              <p className="text-[12px] text-ink-soft mt-0.5">
                {chartMode === "diario"
                  ? "Comparativo de los últimos 30 días vs meta esperada"
                  : "Tendencia mensual de producción y mortalidad · últimos 6 meses"}
              </p>
            </div>
            <div className="segmented flex-shrink-0">
              <button
                type="button"
                onClick={() => setChartMode("diario")}
                className={`segmented-item ${chartMode === "diario" ? "segmented-item-active" : ""}`}
              >
                Diario 30d
              </button>
              <button
                type="button"
                onClick={() => setChartMode("mensual")}
                className={`segmented-item ${chartMode === "mensual" ? "segmented-item-active" : ""}`}
              >
                Mensual 6m
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-2 text-[11px] font-medium text-ink-soft">
            {chartMode === "diario" ? (
              <>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand" /> Real</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-outline" /> Meta 80%</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand" /> Producción</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-error" /> Mortalidad</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
            {chartMode === "diario" ? (
              <>
                <div className="metric-tile">
                  <p className="eyebrow">Promedio período</p>
                  <p className="text-[17px] font-extrabold text-ink mt-0.5">
                    {compact(n(kpis?.promedioDiario))} <span className="text-[10px] font-medium text-ink-soft">uds/día</span>
                  </p>
                </div>
                <div className="metric-tile">
                  <p className="eyebrow">Meta proyectada</p>
                  <p className="text-[17px] font-extrabold text-ink mt-0.5">
                    {compact(metaDiaria)} <span className="text-[10px] font-medium text-ink-soft">uds/día</span>
                  </p>
                </div>
                <div className="metric-tile">
                  <p className="eyebrow">Cumplimiento global</p>
                  <p className={`text-[17px] font-extrabold mt-0.5 ${cumplimiento >= 95 ? "text-brand-strong" : cumplimiento >= 80 ? "text-on-tertiary-container" : "text-error"}`}>
                    {cumplimiento.toFixed(1)}%
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="metric-tile">
                  <p className="eyebrow">Producción 6 meses</p>
                  <p className="text-[17px] font-extrabold text-ink mt-0.5">
                    {compact(totalMensual)} <span className="text-[10px] font-medium text-ink-soft">uds</span>
                  </p>
                </div>
                <div className="metric-tile">
                  <p className="eyebrow">Mortalidad 6 meses</p>
                  <p className="text-[17px] font-extrabold text-error mt-0.5">
                    {compact(mortalidadMensual)} <span className="text-[10px] font-medium text-ink-soft">aves</span>
                  </p>
                </div>
                <div className="metric-tile">
                  <p className="eyebrow">Promedio mensual</p>
                  <p className="text-[17px] font-extrabold text-ink mt-0.5">
                    {compact(Math.round(promedioMensual))} <span className="text-[10px] font-medium text-ink-soft">uds/mes</span>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="h-[260px] mt-4 -ml-2">
            {chartMode === "diario" ? (
              chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0a8a5f" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#0a8a5f" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4ebe7" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#8a968f" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#8a968f" }}
                      tickLine={false}
                      axisLine={false}
                      width={54}
                      tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e4ebe7", fontSize: 12, boxShadow: "0 8px 24px rgba(15,35,28,.08)" }}
                      formatter={(value: any, name: any) => [compact(n(value)), name === "meta" ? "Meta" : "Producción"]}
                    />
                    <ReferenceLine y={metaDiaria} stroke="#8a968f" strokeDasharray="5 4" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="produccion" stroke="#0a8a5f" strokeWidth={2.5} fill="url(#prodFill)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-ink-soft text-sm">Sin datos históricos</div>
              )
            ) : (
              tendenciaData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tendenciaData} margin={{ top: 10, right: 4, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4ebe7" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#8a968f" }} tickLine={false} axisLine={false} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: "#8a968f" }}
                      tickLine={false}
                      axisLine={false}
                      width={54}
                      tickFormatter={(v: number) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10, fill: "#d92d20" }}
                      tickLine={false}
                      axisLine={false}
                      width={34}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e4ebe7", fontSize: 12, boxShadow: "0 8px 24px rgba(15,35,28,.08)" }}
                      formatter={(value: any, name: any) => [compact(n(value)), name === "mortalidad" ? "Mortalidad" : "Producción"]}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="produccion" stroke="#0a8a5f" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="produccion" />
                    <Line yAxisId="right" type="monotone" dataKey="mortalidad" stroke="#d92d20" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.5 }} name="mortalidad" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-ink-soft text-sm">Sin datos históricos</div>
              )
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-[11px] text-ink-soft inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-brand">insights</span>
              {n(kpis?.galponesConReporte)} de {n(kpis?.galponesActivos)} galpones reportaron en el período
            </p>
            <a href="/dashboard/reports" className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-strong hover:text-brand">
              Ver reporte detallado
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </a>
          </div>
        </section>

        <section className={`${CARD} xl:col-span-5 p-5 flex flex-col`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Rendimiento por Galpón</h2>
              <p className="text-[12px] text-ink-soft mt-0.5">Monitoreo individual diario · Meta 80%</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              {n(kpis?.galponesActivos)} activos
            </span>
          </div>

          <div className="mt-4 space-y-3 flex-1">
            {galponesOrdenados.length === 0 && (
              <p className="text-sm text-ink-soft py-6 text-center">Sin producción registrada en el período.</p>
            )}
            {galponesOrdenados.map((g: any) => {
              const prod = n(g.produccion);
              const meta = Math.max(n(g.meta), 1);
              const pct = (prod / meta) * 100;
              const color = pct >= 95 ? "bg-brand" : pct >= 80 ? "bg-on-tertiary-container" : "bg-error";
              const badge = pct >= 95
                ? "bg-brand-soft text-brand-strong"
                : pct >= 80
                  ? "bg-tertiary-fixed text-on-tertiary-container"
                  : "bg-error-container text-error";
              return (
                <div key={g.galpon} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-ink truncate">Galpón {g.galpon}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[12px] font-bold text-ink font-mono">{compact(prod)} <span className="text-[9px] font-medium text-ink-soft">uds</span></span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${badge}`}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="progress-track h-1.5">
                    <div className={`progress-fill ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {mejorGalpon && (
            <div className="mt-4 rounded-xl bg-surface-low border border-line p-3 flex items-start gap-2.5">
              <span className="icon-chip bg-brand-soft text-brand-strong">
                <span className="material-symbols-outlined">trending_up</span>
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-ink">Pico de producción en Galpón {mejorGalpon.galpon}</p>
                <p className="text-[11px] text-ink-soft leading-snug mt-0.5">
                  {mejorPct.toFixed(1)}% de la meta · {compact(n(mejorGalpon.gallinas))} aves · {mejorGalpon.postura}% postura
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className={`${CARD} xl:col-span-5 p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Inventario por Calibre</h2>
              <p className="text-[12px] text-ink-soft mt-0.5">Distribución actual de huevos disponibles</p>
            </div>
            <span className="icon-chip bg-brand-soft text-brand-strong">
              <span className="material-symbols-outlined">egg</span>
            </span>
          </div>

          {inventarioPorTipo.length > 0 ? (
            <div className="mt-2 flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="h-[190px] w-full sm:w-[190px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventarioPorTipo}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={76}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {inventarioPorTipo.map((entry: any, i: number) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e4ebe7", fontSize: 12, boxShadow: "0 8px 24px rgba(15,35,28,.08)" }}
                      formatter={(value: any) => [`${compact(n(value))} uds`, "Saldo"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2">
                {inventarioPorTipo.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-semibold text-ink truncate">{item.name}</span>
                    </span>
                    <span className="text-right flex-shrink-0">
                      <span className="font-bold text-ink">{compact(item.value)}</span>
                      <span className="text-[10px] text-ink-soft ml-1">
                        ({inventarioHuevos > 0 ? ((item.value / inventarioHuevos) * 100).toFixed(1) : "0.0"}%)
                      </span>
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-1 border-t border-line flex items-center justify-between text-[11px]">
                  <span className="text-ink-soft">Total disponible</span>
                  <span className="font-extrabold text-brand-strong">{compact(inventarioHuevos)} uds</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[190px] flex items-center justify-center text-sm text-ink-soft">Sin inventario registrado</div>
          )}
        </section>

        <section className={`${CARD} xl:col-span-7 p-5 flex flex-col`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Resumen del Día</h2>
              <p className="text-[12px] text-ink-soft mt-0.5">Indicadores operativos del último cierre de reportes</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              {cobertura} galpones
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4 flex-1">
            <div className="metric-tile">
              <p className="eyebrow">Producción</p>
              <p className="text-[20px] font-extrabold text-ink mt-0.5 font-mono">
                {compact(n(kpis?.produccionDiaria?.total))}
              </p>
              <p className="text-[10px] text-ink-soft mt-0.5">huevos recolectados</p>
            </div>
            <div className="metric-tile">
              <p className="eyebrow">Mortalidad</p>
              <p className="text-[20px] font-extrabold text-error mt-0.5 font-mono">
                {compact(n(kpis?.produccionDiaria?.mortalidad))}
              </p>
              <p className="text-[10px] text-ink-soft mt-0.5">{n(kpis?.mortalidadPorcentaje)}% de la parvada</p>
            </div>
            <div className="metric-tile">
              <p className="eyebrow">% Postura</p>
              <p className="text-[20px] font-extrabold text-brand-strong mt-0.5 font-mono">
                {postura.toFixed(1)}%
              </p>
              <div className="progress-track mt-1.5">
                <div className="progress-fill bg-brand" style={{ width: `${Math.min(postura, 100)}%` }} />
              </div>
            </div>
            <div className="metric-tile">
              <p className="eyebrow">Comparaciones</p>
              <p className="text-[20px] font-extrabold text-ink mt-0.5 font-mono">
                {n(kpis?.comparacionesHoy?.total)}
              </p>
              <p className={`text-[10px] mt-0.5 ${n(kpis?.comparacionesHoy?.conDiferencias) > 0 ? "text-error font-semibold" : "text-ink-soft"}`}>
                {n(kpis?.comparacionesHoy?.conDiferencias)} con diferencias
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-[11px] text-ink-soft inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-brand">fact_check</span>
              {n(kpis?.comparacionesHoy?.correctas)} comparaciones correctas
            </p>
            <a href="/dashboard/reconciliation" className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-strong hover:text-brand">
              Ver conciliación
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </a>
          </div>
        </section>
      </div>

      <section className={`${CARD} overflow-hidden`}>
        <div className="p-5 pb-0 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="section-title">Kardex &amp; Control de Movimientos</h2>
            <p className="text-[12px] text-ink-soft mt-0.5">Registro continuo de entradas, salidas, mermas y balance físico de inventario</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-low border border-line flex-wrap">
            {([
              { key: "gallinas", label: "Gallinas (Aves)", icon: "egg_alt" },
              { key: "huevos", label: "Huevos por Calibre", icon: "egg" },
              { key: "alimento", label: "Alimento Balanceado", icon: "grain" },
              { key: "bandejas", label: "Bandejas", icon: "grid_view" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setKardexTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  kardexTab === tab.key ? "bg-surface-lowest text-brand-strong shadow-sm" : "text-ink-soft hover:text-brand-strong"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-line bg-surface-low/50 p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <label className="inline-flex items-center gap-2 px-3 h-10 rounded-xl border border-line bg-surface-lowest text-[12px] text-ink">
                <span className="material-symbols-outlined text-[16px] text-brand">warehouse</span>
                <span className="text-ink-soft">Galpón:</span>
                <select
                  value={galponId}
                  onChange={(e) => setGalponId(e.target.value)}
                  className="bg-transparent font-semibold text-ink focus:outline-none"
                >
                  {galpones.map((g: any) => (
                    <option key={g.id} value={g.id}>Galpón {g.codigo}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
              </label>
              <div className="inline-flex items-center gap-2 px-3 h-10 rounded-xl border border-line bg-surface-lowest text-[12px] text-ink-soft">
                <span className="material-symbols-outlined text-[16px] text-outline">search</span>
                <span className="hidden sm:inline">Buscar por remisión o lote…</span>
                <span className="sm:hidden">Buscar…</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 px-1">
              <div>
                <p className="eyebrow">Saldo actual</p>
                <p className="text-[15px] font-extrabold text-ink font-mono mt-0.5">{compact(kardexTotals.saldo)}</p>
              </div>
              <div>
                <p className="eyebrow">Entradas</p>
                <p className="text-[15px] font-extrabold text-ink font-mono mt-0.5">{compact(kardexTotals.entradas)}</p>
              </div>
              <div>
                <p className="eyebrow">Mortalidad semanal</p>
                <p className="text-[15px] font-extrabold text-error font-mono mt-0.5">{compact(kardexTotals.mortalidad)} <span className="text-[9px] font-medium">aves</span></p>
              </div>
              <div>
                <p className="eyebrow">Ventas</p>
                <p className="text-[15px] font-extrabold text-ink font-mono mt-0.5">{compact(kardexTotals.ventas)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {kardexTab === "huevos" ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2.5 text-left rounded-l-lg">Tipo de huevo</th>
                    <th className="px-3 py-2.5 text-right">Saldo final</th>
                    <th className="px-3 py-2.5 text-left rounded-r-lg">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row: any, i: number) => (
                    <tr key={i} className="table-row">
                      <td className="px-3 py-3 font-semibold text-ink">Huevo {row.tipo}</td>
                      <td className="px-3 py-3 text-right font-bold font-mono text-ink">{compact(row.saldoFinal)}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-strong">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand" /> Disponible
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr><td colSpan={3} className="px-3 py-8 text-center text-ink-soft">Sin inventario de huevos registrado.</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2.5 text-left rounded-l-lg">Fecha</th>
                    <th className="px-3 py-2.5 text-left">Galpón</th>
                    <th className="px-3 py-2.5 text-right">{kardexTab === "alimento" ? "Saldo inicial (kg)" : "Saldo inicial"}</th>
                    <th className="px-3 py-2.5 text-right">{kardexTab === "alimento" ? "Entradas kg" : "Entradas (+)"}</th>
                    <th className="px-3 py-2.5 text-right">{kardexTab === "alimento" ? "Consumo kg" : kardexTab === "bandejas" ? "Salidas (−)" : "Mortalidad (−)"}</th>
                    <th className="px-3 py-2.5 text-right">{kardexTab === "bandejas" ? "Saldo anterior" : kardexTab === "alimento" ? "—" : "Ventas (−)"}</th>
                    <th className="px-3 py-2.5 text-right">{kardexTab === "bandejas" ? "Saldo bodega" : "Saldo final"}</th>
                    <th className="px-3 py-2.5 text-left rounded-r-lg">Auditoría</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexLoading && (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-ink-soft">Cargando movimientos…</td></tr>
                  )}
                  {!kardexLoading && pageRows.map((row: any, i: number) => {
                    const fecha = row.fecha ? dayDate(row.fecha) : "—";
                    const saldoInicial = kardexTab === "alimento" ? n(row.saldoInicialKg) : n(row.saldoInicial);
                    const entradas = kardexTab === "alimento" ? n(row.entradasKg) : n(row.entradas);
                    const salida = kardexTab === "alimento" ? n(row.consumoKg) : kardexTab === "bandejas" ? n(row.salidas) : n(row.mortalidad);
                    const ventas = kardexTab === "bandejas" ? n(row.saldoAnterior) : n(row.ventas);
                    const saldoFinal = kardexTab === "alimento" ? n(row.saldoFinalKg) : kardexTab === "bandejas" ? n(row.saldoBodega) : n(row.saldoFinal);
                    return (
                      <tr key={i} className="table-row">
                        <td className="px-3 py-3 text-ink-soft whitespace-nowrap">{fecha}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-ink whitespace-nowrap">
                            {kardexTab === "bandejas" ? `Bandeja ${row.tipo}` : `Galpón ${galpones.find((g: any) => g.id === galponId)?.codigo || ""}`}
                          </p>
                          <p className="text-[10px] text-ink-soft">#{String(row.id || "").slice(0, 8).toUpperCase()}</p>
                        </td>
                        <td className="px-3 py-3 text-right text-ink-soft font-mono">{compact(saldoInicial)}</td>
                        <td className="px-3 py-3 text-right text-brand-strong font-semibold font-mono">{compact(entradas)}</td>
                        <td className={`px-3 py-3 text-right font-semibold font-mono ${salida > 0 ? "text-error" : "text-ink-soft"}`}>{compact(salida)}</td>
                        <td className="px-3 py-3 text-right text-ink-soft font-mono">{compact(ventas)}</td>
                        <td className="px-3 py-3 text-right font-bold font-mono text-ink">{compact(saldoFinal)}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-soft text-brand-strong text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                            Conciliado
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!kardexLoading && pageRows.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-ink-soft">Sin registros para este galpón. Captura un reporte para generar el kardex del día.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-ink-soft">
              Mostrando <span className="font-semibold text-ink">{pageRows.length}</span> de{" "}
              <span className="font-semibold text-ink">{kardexVisible.length}</span> registros
            </p>
            <div className="flex items-center gap-3">
              <a href="/dashboard/inventory" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-strong hover:text-brand">
                <span className="material-symbols-outlined text-[15px]">download</span>
                Exportar Kardex (Excel)
              </a>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setKardexPage((p) => Math.max(1, p - 1))}
                  disabled={kardexPage <= 1}
                  className="w-7 h-7 rounded-lg border border-line bg-surface-lowest text-ink-soft disabled:opacity-40 hover:border-brand/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setKardexPage(page)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition-colors ${
                      kardexPage === page
                        ? "bg-brand text-white border-brand"
                        : "bg-surface-lowest text-ink-soft border-line hover:border-brand/40"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setKardexPage((p) => Math.min(totalPages, p + 1))}
                  disabled={kardexPage >= totalPages}
                  className="w-7 h-7 rounded-lg border border-line bg-surface-lowest text-ink-soft disabled:opacity-40 hover:border-brand/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: "file_upload", label: "Importar Excel", href: "/dashboard/excel" },
          { icon: "document_scanner", label: "Verificar OCR", href: "/dashboard/ocr" },
          { icon: "inventory_2", label: "Kardex completo", href: "/dashboard/inventory" },
          { icon: "local_shipping", label: "Despachar", href: "/dashboard/inventory" },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="bg-surface-lowest rounded-xl border border-line px-4 py-3 flex items-center gap-3 hover:border-brand/40 hover:shadow-sm transition-all"
          >
            <span className="icon-chip bg-brand-soft text-brand-strong">
              <span className="material-symbols-outlined">{action.icon}</span>
            </span>
            <span className="text-[13px] font-semibold text-ink">{action.label}</span>
            <span className="material-symbols-outlined text-[16px] text-outline ml-auto">arrow_forward</span>
          </a>
        ))}
      </div>
    </div>
  );
}
