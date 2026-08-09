"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#145a3c", "#22c55e", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

function KPICard({ title, value, subtitle, icon, color }: { title: string; value: string | number; subtitle: string; icon: JSX.Element; color: string }) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110`} style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
      </div>
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
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  const posturaData = produccionGalpon.map(d => ({ name: d.galpon, postura: Number(d.postura), mortalidad: d.mortalidad }));
  const inventarioData = kpis?.inventarioHuevos?.map((inv: any, i: number) => ({ name: inv.tipoHuevoId?.slice(0, 8) || `Tipo ${i}`, cantidad: inv._sum?.saldoFinal || 0 })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Panel de control de produccion avicola</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Produccion Hoy"
          value={kpis?.produccionDiaria?.total?.toLocaleString() || "0"}
          subtitle="huevos producidos"
          color="#145a3c"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <KPICard
          title="Gallinas Vivas"
          value={kpis?.gallinasVivas?.toLocaleString() || "0"}
          subtitle={`en ${kpis?.galponesActivos || 0} galpones activos`}
          color="#3b82f6"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <KPICard
          title="Porcentaje Postura"
          value={`${kpis?.porcentajePostura || "0"}%`}
          subtitle="promedio hoy"
          color="#f59e0b"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
        />
        <KPICard
          title="Mortalidad"
          value={kpis?.produccionDiaria?.mortalidad || "0"}
          subtitle={`${kpis?.mortalidadPorcentaje || "0"}% del total`}
          color="#ef4444"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Produccion por Galpon</h3>
            <p className="text-xs text-gray-400 mt-0.5">Postura y mortalidad por galpon</p>
          </div>
          <div className="card-content">
            {posturaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={posturaData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar dataKey="postura" fill="#22c55e" radius={[4, 4, 0, 0]} name="Postura %" />
                  <Bar dataKey="mortalidad" fill="#ef4444" radius={[4, 4, 0, 0]} name="Mortalidad" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Sin datos de produccion hoy</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Tendencia Mensual</h3>
            <p className="text-xs text-gray-400 mt-0.5">Produccion y mortalidad ultimos 6 meses</p>
          </div>
          <div className="card-content">
            {tendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={tendencia} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="produccion" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Produccion" />
                  <Line type="monotone" dataKey="mortalidad" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name="Mortalidad" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Sin datos historicos</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Inventario Huevos</h3>
          </div>
          <div className="card-content">
            {inventarioData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={inventarioData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="cantidad" paddingAngle={2}>
                    {inventarioData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Sin inventario</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Resumen</h3>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500">Alimento</span>
              <span className="text-sm font-bold">{kpis?.inventarioAlimentoKg?.toLocaleString() || "0"} kg</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500">Prod. Mensual</span>
              <span className="text-sm font-bold">{kpis?.produccionMensual?.total?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500">Mort. Mensual</span>
              <span className="text-sm font-bold text-red-600">{kpis?.produccionMensual?.mortalidad?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500">Comparaciones</span>
              <span className="text-sm font-bold">{kpis?.comparacionesHoy?.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Alertas</h3>
          </div>
          <div className="card-content">
            {kpis?.alertas?.length > 0 ? (
              <div className="space-y-2">
                {kpis.alertas.map((alerta: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span className="text-sm text-red-700">{alerta}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-green-600 font-medium">Todo en orden</p>
                <p className="text-xs text-gray-400">No hay alertas activas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
