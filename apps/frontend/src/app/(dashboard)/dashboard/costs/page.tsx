"use client";

import { useState, useEffect } from "react";
import { costsService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#dc2626", "#8b5cf6", "#ec4899"];

interface Categoria { id: string; nombre: string; tipo: string; }
interface Costo {
  id: string; descripcion: string; monto: number; fecha: string;
  estado: string; categoriaId: string; categoria: { nombre: string; tipo: string };
  galpon?: { codigo: string }; creadoPor: { nombre: string; apellido: string };
}
interface GastoFijo { id: string; concepto: string; monto: number; recurrencia: string; diaVencimiento?: number; activo: boolean; }

export default function CostsPage() {
  const [costos, setCostos] = useState<Costo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [form, setForm] = useState({ categoriaId: "", descripcion: "", monto: "", fecha: new Date().toISOString().split("T")[0], observaciones: "" });
  const [catForm, setCatForm] = useState({ nombre: "", descripcion: "", tipo: "DIRECTO" });
  const [gastoForm, setGastoForm] = useState({ concepto: "", monto: "", recurrencia: "MENSUAL", diaVencimiento: "", fechaInicio: new Date().toISOString().split("T")[0] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [costosRes, catRes, resumenRes, gastosRes] = await Promise.all([
        costsService.getAll({ limit: 100 }),
        costsService.getCategorias(),
        costsService.getResumen(),
        costsService.getGastosFijos(),
      ]);
      setCostos(costosRes.data?.data || []);
      setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
      setResumen(resumenRes.data);
      setGastosFijos(Array.isArray(gastosRes.data) ? gastosRes.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createCosto = async () => {
    if (!form.categoriaId || !form.descripcion || !form.monto) return;
    try {
      await costsService.create({ ...form, monto: parseFloat(form.monto) });
      setShowForm(false);
      setForm({ categoriaId: "", descripcion: "", monto: "", fecha: new Date().toISOString().split("T")[0], observaciones: "" });
      loadData();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  const createCategoria = async () => {
    if (!catForm.nombre) return;
    try {
      await costsService.createCategoria(catForm);
      setShowCatForm(false);
      setCatForm({ nombre: "", descripcion: "", tipo: "DIRECTO" });
      loadData();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  const createGastoFijo = async () => {
    if (!gastoForm.concepto || !gastoForm.monto) return;
    try {
      await costsService.createGastoFijo({
        ...gastoForm,
        monto: parseFloat(gastoForm.monto),
        diaVencimiento: gastoForm.diaVencimiento ? parseInt(gastoForm.diaVencimiento) : undefined,
      });
      setGastoForm({ concepto: "", monto: "", recurrencia: "MENSUAL", diaVencimiento: "", fechaInicio: new Date().toISOString().split("T")[0] });
      loadData();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  const approveCosto = async (id: string) => {
    await costsService.approve(id);
    loadData();
  };

  const rejectCosto = async (id: string) => {
    await costsService.reject(id);
    loadData();
  };

  const filteredCostos = costos.filter(c => {
    if (filtroTipo && c.categoria?.tipo !== filtroTipo) return false;
    if (filtroEstado && c.estado !== filtroEstado) return false;
    return true;
  });

  const chartData = categorias.map(cat => {
    const total = costos.filter(c => c.categoriaId === cat.id && c.estado === "APROBADO").reduce((s, c) => s + Number(c.monto), 0);
    return { name: cat.nombre, total };
  }).filter(d => d.total > 0);

  const pieData = [
    { name: "Directo", value: resumen?.directo?.total || 0 },
    { name: "Indirecto", value: resumen?.indirecto?.total || 0 },
    { name: "Gastos Fijos", value: resumen?.gastosFijosMensuales || 0 },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex items-center gap-3 text-gray-500"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm font-medium">Cargando costos...</span></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Modulo de Costos</h1>
          <p className="page-subtitle">Control de costos directos, indirectos y gastos fijos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowCatForm(true)}>Nueva Categoria</Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowForm(true)}>Registrar Costo</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Costos Directos</p><p className="text-2xl font-bold">${resumen?.directo?.total?.toLocaleString() || "0"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Costos Indirectos</p><p className="text-2xl font-bold">${resumen?.indirecto?.total?.toLocaleString() || "0"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Gastos Fijos Mensuales</p><p className="text-2xl font-bold">${resumen?.gastosFijosMensuales?.toLocaleString() || "0"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total General</p><p className="text-2xl font-bold text-green-700">${resumen?.totalGeneral?.toLocaleString() || "0"}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="section-title">Costos por Categoria</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="total" fill="#145a3c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-8 text-sm">Sin datos</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="section-title">Distribucion de Costos</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-8 text-sm">Sin datos</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="section-title">Listado de Costos</CardTitle>
          <div className="flex gap-2 mt-2">
            <select className="input-field w-auto text-sm" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="DIRECTO">Directo</option>
              <option value="INDIRECTO">Indirecto</option>
            </select>
            <select className="input-field w-auto text-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-left">Categoria</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Descripcion</th>
                  <th className="p-2 text-right">Monto</th>
                  <th className="p-2 text-center">Estado</th>
                  <th className="p-2 text-left">Creado por</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCostos.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="p-2">{new Date(c.fecha).toLocaleDateString()}</td>
                    <td className="p-2">{c.categoria?.nombre}</td>
                    <td className="p-2"><span className={`status-badge ${c.categoria?.tipo === "DIRECTO" ? "info" : "warning"}`}>{c.categoria?.tipo}</span></td>
                    <td className="p-2">{c.descripcion}</td>
                    <td className="p-2 text-right font-medium">${Number(c.monto).toLocaleString()}</td>
                    <td className="p-2 text-center">
                      <span className={`status-badge ${c.estado === "APROBADO" ? "success" : c.estado === "RECHAZADO" ? "error" : "warning"}`}>{c.estado}</span>
                    </td>
                    <td className="p-2">{c.creadoPor?.nombre} {c.creadoPor?.apellido}</td>
                    <td className="p-2 text-center">
                      {c.estado === "PENDIENTE" && (
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => approveCosto(c.id)}>Aprobar</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => rejectCosto(c.id)}>Rechazar</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCostos.length === 0 && (
                  <tr><td colSpan={8} className="p-4 text-center text-gray-400">No hay costos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="section-title">Gastos Fijos Mensuales</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-2 text-left">Concepto</th>
                  <th className="p-2 text-right">Monto</th>
                  <th className="p-2 text-left">Recurrencia</th>
                  <th className="p-2 text-center">Dia Venc.</th>
                  <th className="p-2 text-center">Activo</th>
                </tr>
              </thead>
              <tbody>
                {gastosFijos.map((g) => (
                  <tr key={g.id} className="table-row">
                    <td className="p-2">{g.concepto}</td>
                    <td className="p-2 text-right font-medium">${Number(g.monto).toLocaleString()}</td>
                    <td className="p-2">{g.recurrencia}</td>
                    <td className="p-2 text-center">{g.diaVencimiento || "-"}</td>
                    <td className="p-2 text-center">{g.activo ? "Si" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h4 className="font-medium text-gray-700 mb-3">Agregar Gasto Fijo</h4>
            <div className="flex gap-2 flex-wrap items-end">
              <div><label className="text-xs text-gray-500">Concepto</label><Input placeholder="Concepto" value={gastoForm.concepto} onChange={e => setGastoForm({...gastoForm, concepto: e.target.value})} className="w-48" /></div>
              <div><label className="text-xs text-gray-500">Monto</label><Input placeholder="Monto" type="number" value={gastoForm.monto} onChange={e => setGastoForm({...gastoForm, monto: e.target.value})} className="w-32" /></div>
              <div><label className="text-xs text-gray-500">Recurrencia</label>
                <select className="input-field w-auto text-sm" value={gastoForm.recurrencia} onChange={e => setGastoForm({...gastoForm, recurrencia: e.target.value})}>
                  <option value="MENSUAL">Mensual</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>
              <div><label className="text-xs text-gray-500">Dia venc.</label><Input placeholder="Dia" type="number" value={gastoForm.diaVencimiento} onChange={e => setGastoForm({...gastoForm, diaVencimiento: e.target.value})} className="w-20" /></div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={createGastoFijo}>Agregar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content">
            <h2 className="text-lg font-bold mb-4">Registrar Costo</h2>
            <div className="space-y-3">
              <select className="input-field w-full" value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})}>
                <option value="">Seleccionar categoria...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
              </select>
              <Input placeholder="Descripcion" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
              <Input placeholder="Monto" type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} />
              <Input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              <Input placeholder="Observaciones (opcional)" value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} />
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={createCosto}>Guardar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCatForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCatForm(false); }}>
          <div className="modal-content">
            <h2 className="text-lg font-bold mb-4">Nueva Categoria</h2>
            <div className="space-y-3">
              <Input placeholder="Nombre" value={catForm.nombre} onChange={e => setCatForm({...catForm, nombre: e.target.value})} />
              <Input placeholder="Descripcion (opcional)" value={catForm.descripcion} onChange={e => setCatForm({...catForm, descripcion: e.target.value})} />
              <select className="input-field w-full" value={catForm.tipo} onChange={e => setCatForm({...catForm, tipo: e.target.value})}>
                <option value="DIRECTO">Directo</option>
                <option value="INDIRECTO">Indirecto</option>
              </select>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowCatForm(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={createCategoria}>Crear</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
