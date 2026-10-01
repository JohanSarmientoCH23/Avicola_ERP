"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#006c49", "#e49200", "#396755", "#ba1a1a", "#4edea3", "#ffb95f"];

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: { value: string; label: string; positive: boolean };
  bar?: { label: string; value: number };
  icon: string;
  color: "green" | "amber" | "red" | "gray" | "primary";
  miniChart?: number[];
}

function KPICard({ title, value, unit, subtitle, trend, bar, icon, color, miniChart }: KPICardProps) {
  const colorMap = {
    green: { bg: "bg-secondary-fixed/30", text: "text-secondary", bar: "bg-secondary" },
    amber: { bg: "bg-on-tertiary-container/10", text: "text-on-tertiary-container", bar: "bg-on-tertiary-container" },
    red: { bg: "bg-error-container/50", text: "text-error", bar: "bg-error" },
    gray: { bg: "bg-surface-container", text: "text-on-surface", bar: "bg-outline-variant" },
    primary: { bg: "bg-surface-container", text: "text-primary", bar: "bg-primary" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-surface-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        color === "green" ? "bg-secondary" :
        color === "amber" ? "bg-on-tertiary-container" :
        color === "red" ? "bg-error" : "bg-outline-variant"
      }`} />
      <div className="flex items-start justify-between">
        <span className="text-label-ui uppercase tracking-wider text-outline font-semibold">{title}</span>
        <span className={`w-7 h-7 rounded-md flex items-center justify-center ${c.bg} ${c.text}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </span>
      </div>
      <div className="mt-3 mb-1">
        <div className="text-2xl font-bold text-primary tracking-tight font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-xs font-normal text-outline ml-1">{unit}</span>}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-label-data-sm font-label-data-sm ${
              trend.positive ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-error-container/50 text-on-error-container'
            } font-semibold`}>
              <span className="material-symbols-outlined text-xs mr-0.5">{trend.positive ? 'trending_up' : 'trending_down'}</span>
              {trend.value}
            </span>
            <span className="text-label-data-sm text-outline">{trend.label}</span>
          </div>
        )}
        {subtitle && !trend && (
          <p className="text-label-data-sm text-outline mt-0.5">{subtitle}</p>
        )}
      </div>
      {bar && (
        <div className="mt-1">
          <div className="flex justify-between text-label-data-sm text-on-surface-variant mb-1">
            <span>{bar.label}</span>
            <span className="font-semibold text-secondary">{bar.value}%</span>
          </div>
          <div className="w-full bg-surface-low h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(bar.value, 100)}%` }} />
          </div>
        </div>
      )}
      {miniChart && !bar && (
        <div className="mt-1 flex items-center justify-between">
          <svg className="w-14 h-4 text-secondary" fill="none" viewBox="0 0 56 16">
            <path
              d={`M${miniChart.map((v, i) => `${i * (56 / (miniChart.length - 1))},${16 - (v / Math.max(...miniChart)) * 14}`).join(' L')}`}
              stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [produccionGalpon, setProduccionGalpon] = useState<any[]>([]);
  const [tendencia, setTendencia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [kpiRes, galponRes, tendRes] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getProduccionPorGalpon(),
        dashboardService.getTendenciaMensual(6),
      ]);
      setKpis(kpiRes.data);
      setProduccionGalpon(galponRes.data || []);
      setTendencia(tendRes.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          <span className="text-body-sm font-medium">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  const posturaData = produccionGalpon.map(d => ({ name: d.galpon, postura: Number(d.postura), mortalidad: d.mortalidad }));
  const inventarioData = kpis?.inventarioHuevos?.map((inv: any, i: number) => ({ name: inv.tipoHuevoId?.slice(0, 8) || `Tipo ${i}`, cantidad: inv._sum?.saldoFinal || 0 })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-label-ui uppercase tracking-wider text-secondary font-semibold bg-secondary-fixed/50 px-2 py-0.5 rounded">Operación en Vivo</span>
            <span className="text-label-data-sm text-outline">•</span>
            <span className="text-label-data-sm text-outline-variant font-medium">Ciclo Activo</span>
          </div>
          <h1 className="page-title">Resumen Operativo</h1>
          <p className="page-subtitle">Estado general de la operación avícola • <span className="font-semibold text-on-surface">Granja Llano Grande</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-surface-low rounded-lg shadow-sm">
            {["Hoy", "7 Días", "30 Días"].map((period) => (
              <button key={period} className={`px-3 py-1.5 rounded-md text-body-sm font-semibold transition-colors ${
                period === "Hoy" ? "bg-surface-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
              }`}>
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-6">
        <KPICard
          title="Producción Hoy"
          value={kpis?.produccionDiaria?.total || 0}
          unit="huevos"
          trend={{ value: "+8.4%", label: "vs ayer", positive: true }}
          bar={{ label: "Meta diurna", value: kpis?.porcentajePostura || 0 }}
          icon="egg"
          color="green"
        />
        <KPICard
          title="Mortalidad"
          value={kpis?.produccionDiaria?.mortalidad || 0}
          unit="aves"
          subtitle={`${kpis?.mortalidadPorcentaje || 0}% de la parvada total`}
          icon="cruelty_free"
          color="gray"
          miniChart={[12, 11, 13, 9, 10, 7, 8]}
        />
        <KPICard
          title="Gallinas Vivas"
          value={kpis?.gallinasVivas || 0}
          unit="aves"
          subtitle={`en ${kpis?.galponesActivos || 0} galpones activos`}
          icon="group"
          color="primary"
        />
        <KPICard
          title="Inventario Huevos"
          value={kpis?.inventarioHuevos?.reduce((s: number, i: any) => s + (i._sum?.saldoFinal || 0), 0) || 0}
          unit="uds"
          subtitle="Disponible despacho"
          icon="inventory_2"
          color="gray"
        />
        <KPICard
          title="Inconsistencias"
          value={kpis?.comparacionesHoy?.total || 0}
          unit="detectadas"
          subtitle="Requieren revisión"
          icon="warning"
          color="red"
        />
        <KPICard
          title="Conciliaciones"
          value={kpis?.comparacionesHoy?.pendientes || 0}
          unit="pendientes"
          subtitle="Revisión hoy"
          icon="rule"
          color="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 bg-surface-lowest rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="section-title">Producción de Huevos (Tendencia)</h2>
              <p className="text-body-sm text-outline">Evolución del volumen de recolección</p>
            </div>
          </div>
          <div className="flex items-center gap-6 py-2 mb-3">
            <div>
              <span className="text-label-ui text-outline uppercase block">Promedio</span>
              <span className="text-label-data-md font-bold text-on-surface">{kpis?.produccionMensual?.total ? Math.round(kpis.produccionMensual.total / 30).toLocaleString() : 0} uds/día</span>
            </div>
            <div>
              <span className="text-label-ui text-outline uppercase block">Meta</span>
              <span className="text-label-data-md font-bold text-on-tertiary-container">24.000 uds/día</span>
            </div>
          </div>
          <div className="h-64">
            {tendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendencia} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaedff" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#717974' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#717974' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #c0c8c3', fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="produccion" stroke="#006c49" strokeWidth={2.5} dot={{ fill: '#006c49', r: 3 }} name="Producción" />
                  <Line type="monotone" dataKey="mortalidad" stroke="#ba1a1a" strokeWidth={2} dot={{ fill: '#ba1a1a', r: 3 }} name="Mortalidad" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant text-body-sm">Sin datos históricos</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface-lowest rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="section-title">Producción por Galpón</h2>
              <p className="text-body-sm text-outline">Rendimiento individual hoy</p>
            </div>
            <span className="text-label-data-sm text-outline font-semibold">Meta: 4.000 / galpón</span>
          </div>
          <div className="space-y-3 mt-4">
            {produccionGalpon.slice(0, 6).map((g: any) => {
              const prod = Number(g.postura);
              const pct = prod > 0 ? (prod / 5000) * 100 : 0;
              const isLow = prod < 3800;
              return (
                <div key={g.galpon} className="space-y-1">
                  <div className="flex justify-between text-body-sm">
                    <span className={`font-semibold ${isLow ? 'text-error' : 'text-on-surface'}`}>Galpón {g.galpon}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-label-data-md font-bold text-primary">{prod.toLocaleString()}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-label-ui font-bold ${
                        pct > 85 ? 'bg-secondary-fixed text-on-secondary-fixed-variant' :
                        pct > 75 ? 'bg-surface-container-high text-outline' :
                        'bg-error-container text-on-error-container'
                      }`}>
                        {pct > 85 ? '+' : ''}{Math.round(pct - 80)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-low h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      pct > 85 ? 'bg-secondary' : pct > 75 ? 'bg-on-tertiary-container' : 'bg-error'
                    }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-outline">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-secondary inline-block" /> Óptimo (&gt;4.000)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-on-tertiary-container inline-block" /> Observación (&lt;3.800)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-error inline-block" /> Alerta</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-surface-lowest rounded-xl p-5 shadow-sm">
          <h2 className="section-title mb-3">Inventario Huevos</h2>
          {inventarioData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={inventarioData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="cantidad" paddingAngle={2}>
                  {inventarioData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-on-surface-variant text-body-sm">Sin inventario</div>
          )}
        </div>

        <div className="bg-surface-lowest rounded-xl p-5 shadow-sm">
          <h2 className="section-title mb-3">Resumen del Día</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-low rounded-lg">
              <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">egg</span>
                Producción Total
              </span>
              <span className="text-label-data-md font-bold text-primary">{kpis?.produccionDiaria?.total?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-low rounded-lg">
              <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-lg">heart_broken</span>
                Mortalidad
              </span>
              <span className="text-label-data-md font-bold text-error">{kpis?.produccionDiaria?.mortalidad?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-low rounded-lg">
              <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-on-tertiary-container text-lg">percent</span>
                % Postura
              </span>
              <span className="text-label-data-md font-bold text-on-tertiary-container">{kpis?.porcentajePostura || "0"}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-low rounded-lg">
              <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">compare_arrows</span>
                Comparaciones
              </span>
              <span className="text-label-data-md font-bold text-primary">{kpis?.comparacionesHoy?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <div>
              <h3 className="text-body-lg font-bold text-primary">Accesos Operativos Rápidos</h3>
              <p className="text-body-sm text-outline">Ejecuta flujos de trabajo sin abandonar el panel</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: "file_upload", label: "Importar Excel", href: "/dashboard/excel" },
              { icon: "document_scanner", label: "Verificar OCR", href: "/dashboard/ocr" },
              { icon: "receipt_long", label: "Kardex", href: "/dashboard/inventory" },
              { icon: "local_shipping", label: "Despachar", href: "/dashboard/inventory" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-body-sm font-semibold transition-all ${
                  action.label === "Despachar"
                    ? "bg-primary hover:bg-primary-container text-on-primary"
                    : "bg-surface-low hover:bg-surface-container text-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${action.label === "Despachar" ? "text-secondary-fixed" : "text-secondary"}`}>
                  {action.icon}
                </span>
                <span className="truncate">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
