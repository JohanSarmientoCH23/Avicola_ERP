"use client";

import { useState } from "react";
import { reportsService } from "@/lib/api";
import { localDateString, formatDateOnly } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [fecha, setFecha] = useState(localDateString());
  const [fechaInicio, setFechaInicio] = useState(localDateString(new Date(Date.now() - 6 * 86400000)));
  const [fechaFin, setFechaFin] = useState(localDateString());
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [reporte, setReporte] = useState<any>(null);
  const [semanal, setSemanal] = useState<any>(null);
  const [mensual, setMensual] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadDiario = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getDiario({ fecha });
      setReporte(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const loadSemanal = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getSemanal({ fechaInicio, fechaFin });
      setSemanal(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const loadMensual = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getMensual({ anio, mes });
      setMensual(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const exportCSV = async (tipo: string) => {
    try {
      const response = await reportsService.exportCSV({ tipo, fecha });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${tipo}_${fecha || 'all'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando CSV:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Generacion de reportes diarios, semanales y mensuales</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportCSV("diario")}>Exportar CSV</Button>
          <Button variant="outline">Exportar PDF</Button>
        </div>
      </div>

      <Tabs defaultValue="diario">
        <TabsList>
          <TabsTrigger value="diario">Diario</TabsTrigger>
          <TabsTrigger value="semanal">Semanal</TabsTrigger>
          <TabsTrigger value="mensual">Mensual</TabsTrigger>
        </TabsList>

        <TabsContent value="diario" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Reporte Diario de Produccion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full sm:w-40" />
                <Button onClick={loadDiario} disabled={loading}>
                  {loading ? "Cargando..." : "Generar Reporte"}
                </Button>
              </div>
              {reporte && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Fecha: {fecha} | Reportes encontrados: {reporte.reportes?.length || 0}</p>
                  {reporte.reportes?.map((r: any) => (
                    <div key={r.id} className="border border-line rounded-xl p-4 bg-surface-low/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-ink">Reporte de {r.galponero?.nombre} {r.galponero?.apellido}</span>
                        <span className="badge-info">{r.fuente}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="table-header"><th className="px-3 py-2 text-left rounded-l-lg">Galpón</th><th className="px-3 py-2 text-right">Mort.</th><th className="px-3 py-2 text-right">Prod.</th><th className="px-3 py-2 text-right rounded-r-lg">Consumo</th></tr></thead>
                          <tbody>
                            {r.detallesGalpon?.map((d: any) => (
                              <tr key={d.id} className="table-row"><td className="px-3 py-2.5 font-medium">{d.galpon?.codigo}</td><td className="px-3 py-2.5 text-right text-error">{d.mortalidad}</td><td className="px-3 py-2.5 text-right font-mono">{d.produccion}</td><td className="px-3 py-2.5 text-right">{d.alimentoConsumo}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semanal" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Reporte Semanal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div>
                  <label className="text-sm font-medium">Desde</label>
                  <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full sm:w-40 mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Hasta</label>
                  <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full sm:w-40 mt-1" />
                </div>
                <Button onClick={loadSemanal} disabled={loading}>
                  {loading ? "Cargando..." : "Generar"}
                </Button>
              </div>
              {semanal && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Total reportes: {semanal.totalReportes}</p>
                  {semanal.resumen?.length > 0 && (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={semanal.resumen.map((r: any) => ({ fecha: formatDateOnly(r.fecha), produccion: r.totalProduccion, mortalidad: r.totalMortalidad }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4ebe7" vertical={false} />
                          <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#8a968f" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#8a968f" }} tickLine={false} axisLine={false} width={54} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e4ebe7", fontSize: 12 }} />
                          <Bar dataKey="produccion" fill="#0a8a5f" radius={[6, 6, 0, 0]} name="Producción" />
                          <Bar dataKey="mortalidad" fill="#d92d20" radius={[6, 6, 0, 0]} name="Mortalidad" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="table-header"><th className="px-3 py-2.5 text-left rounded-l-lg">Fecha</th><th className="px-3 py-2.5 text-right">Producción</th><th className="px-3 py-2.5 text-right">Mortalidad</th><th className="px-3 py-2.5 text-right rounded-r-lg">Consumo</th></tr></thead>
                          <tbody>
                            {semanal.resumen.map((r: any, i: number) => (
                              <tr key={i} className="table-row">
                                <td className="px-3 py-3 text-ink-soft">{formatDateOnly(r.fecha)}</td>
                                <td className="px-3 py-3 text-right font-mono font-semibold text-ink">{r.totalProduccion.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right text-error font-mono">{r.totalMortalidad.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right text-ink-soft font-mono">{r.totalConsumo.toLocaleString()} kg</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensual" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Reporte Mensual</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select className="input-field w-full sm:w-auto" value={mes} onChange={e => setMes(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString("es", { month: "long" })}</option>)}
                </select>
                <Input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} className="w-full sm:w-24" />
                <Button onClick={loadMensual} disabled={loading}>
                  {loading ? "Cargando..." : "Generar"}
                </Button>
              </div>
              {mensual && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="metric-tile">
                    <p className="eyebrow">Producción Total</p>
                    <p className="text-2xl font-extrabold text-ink mt-1 font-mono">{mensual.totalProduccion?.toLocaleString()}</p>
                  </div>
                  <div className="metric-tile">
                    <p className="eyebrow">Mortalidad Total</p>
                    <p className="text-2xl font-extrabold text-error mt-1 font-mono">{mensual.totalMortalidad?.toLocaleString()}</p>
                  </div>
                  <div className="metric-tile">
                    <p className="eyebrow">Consumo Total</p>
                    <p className="text-2xl font-extrabold text-ink mt-1 font-mono">{mensual.totalConsumo?.toLocaleString()} <span className="text-xs font-medium text-ink-soft">kg</span></p>
                  </div>
                  <div className="metric-tile">
                    <p className="eyebrow">Días Reportados</p>
                    <p className="text-2xl font-extrabold text-ink mt-1 font-mono">{mensual.diasReportados}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
