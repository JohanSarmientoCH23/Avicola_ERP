"use client";

import { useState, useEffect } from "react";
import { productionService, galponesService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductionPage() {
  const [galpones, setGalpones] = useState<any[]>([]);
  const [tiposHuevo, setTiposHuevo] = useState<any[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [producciones, setProducciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGalpon, setExpandedGalpon] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [gRes, tRes] = await Promise.all([
        galponesService.getAll(),
        productionService.getTiposHuevo(),
      ]);
      setGalpones(gRes.data);
      setTiposHuevo(tRes.data);
      setDetalles(gRes.data.map((g: any) => ({
        galponId: g.id, codigo: g.codigo,
        mortalidad: 0, produccion: 0, alimentoEntrada: 0, alimentoConsumo: 0, gallinas: g.gallinasActuales,
      })));
      setProducciones(tRes.data.map((t: any) => ({
        tipoHuevoId: t.id, codigo: t.codigo, nombre: t.nombre,
        cantidad: 0, salida: 0, saldo: 0,
      })));
    } catch (error) { console.error(error); }
  };

  const updateDetalle = (index: number, field: string, value: number) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const updateProduccion = (index: number, field: string, value: number) => {
    const newProd = [...producciones];
    newProd[index] = { ...newProd[index], [field]: value };
    setProducciones(newProd);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await productionService.createReport({
        fecha,
        detallesGalpon: detalles.map(d => ({
          galponId: d.galponId, mortalidad: d.mortalidad, produccion: d.produccion,
          alimentoEntrada: d.alimentoEntrada, alimentoConsumo: d.alimentoConsumo, gallinas: d.gallinas,
        })),
        produccionesHuevo: producciones.map(p => ({
          tipoHuevoId: p.tipoHuevoId, cantidad: p.cantidad, salida: p.salida, saldo: p.saldo,
        })),
      });
      alert("Reporte guardado exitosamente");
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || "Error al guardar"));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Captura Manual</h1>
          <p className="page-subtitle">Registro diario de produccion por galpon</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600">Fecha:</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full sm:w-40" />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 sm:w-auto">
            {loading ? "Guardando..." : "Guardar Reporte"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="section-title">Produccion por Galpon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-2 text-left">Galpon</th>
                  <th className="p-2 text-right">Mortalidad</th>
                  <th className="p-2 text-right">Produccion</th>
                  <th className="p-2 text-right">Alimento Entrada</th>
                  <th className="p-2 text-right">Alimento Consumo</th>
                  <th className="p-2 text-right">Gallinas</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, i) => (
                  <tr key={d.galponId} className="table-row">
                    <td className="p-2 font-medium">{d.codigo}</td>
                    <td className="p-2"><Input type="number" value={d.mortalidad} onChange={(e) => updateDetalle(i, 'mortalidad', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                    <td className="p-2"><Input type="number" value={d.produccion} onChange={(e) => updateDetalle(i, 'produccion', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                    <td className="p-2"><Input type="number" value={d.alimentoEntrada} onChange={(e) => updateDetalle(i, 'alimentoEntrada', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                    <td className="p-2"><Input type="number" value={d.alimentoConsumo} onChange={(e) => updateDetalle(i, 'alimentoConsumo', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                    <td className="p-2"><Input type="number" value={d.gallinas} onChange={(e) => updateDetalle(i, 'gallinas', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-gray-200 bg-gray-50">
                  <td className="p-2">TOTAL</td>
                  <td className="p-2 text-right">{detalles.reduce((s, d) => s + d.mortalidad, 0).toLocaleString()}</td>
                  <td className="p-2 text-right">{detalles.reduce((s, d) => s + d.produccion, 0).toLocaleString()}</td>
                  <td className="p-2 text-right">{detalles.reduce((s, d) => s + d.alimentoEntrada, 0).toLocaleString()}</td>
                  <td className="p-2 text-right">{detalles.reduce((s, d) => s + d.alimentoConsumo, 0).toLocaleString()}</td>
                  <td className="p-2 text-right">{detalles.reduce((s, d) => s + d.gallinas, 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {detalles.map((d, i) => {
              const isExpanded = expandedGalpon === d.galponId;
              return (
                <div key={d.galponId} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedGalpon(isExpanded ? null : d.galponId)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800">{d.codigo}</span>
                      <span className="text-xs text-gray-500">{d.gallinas.toLocaleString()} gallinas</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {d.produccion > 0 && <span className="text-green-600">Prod: {d.produccion.toLocaleString()}</span>}
                      {d.mortalidad > 0 && <span className="text-red-600">Mort: {d.mortalidad.toLocaleString()}</span>}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-3 space-y-3 bg-white">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Mortalidad</Label>
                          <Input type="number" value={d.mortalidad} onChange={(e) => updateDetalle(i, 'mortalidad', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Produccion</Label>
                          <Input type="number" value={d.produccion} onChange={(e) => updateDetalle(i, 'produccion', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Alimento Entrada</Label>
                          <Input type="number" value={d.alimentoEntrada} onChange={(e) => updateDetalle(i, 'alimentoEntrada', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Alimento Consumo</Label>
                          <Input type="number" value={d.alimentoConsumo} onChange={(e) => updateDetalle(i, 'alimentoConsumo', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Gallinas</Label>
                        <Input type="number" value={d.gallinas} onChange={(e) => updateDetalle(i, 'gallinas', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="font-bold text-green-800">TOTAL</span>
              <div className="flex gap-4 text-sm font-bold">
                <span className="text-red-600">Mort: {detalles.reduce((s, d) => s + d.mortalidad, 0).toLocaleString()}</span>
                <span className="text-green-600">Prod: {detalles.reduce((s, d) => s + d.produccion, 0).toLocaleString()}</span>
                <span>Gall: {detalles.reduce((s, d) => s + d.gallinas, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="section-title">Produccion por Tipo de Huevo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-right">Cantidad</th>
                  <th className="p-2 text-right">Salida</th>
                  <th className="p-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {producciones.map((p, i) => (
                  <tr key={p.tipoHuevoId} className="table-row">
                    <td className="p-2 font-medium">{p.nombre}</td>
                    <td className="p-2"><Input type="number" value={p.cantidad} onChange={(e) => updateProduccion(i, 'cantidad', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                    <td className="p-2"><Input type="number" value={p.salida} onChange={(e) => updateProduccion(i, 'salida', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                    <td className="p-2"><Input type="number" value={p.saldo} onChange={(e) => updateProduccion(i, 'saldo', parseInt(e.target.value) || 0)} className="text-right h-8" /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-gray-200 bg-gray-50">
                  <td className="p-2">TOTAL</td>
                  <td className="p-2 text-right">{producciones.reduce((s, p) => s + p.cantidad, 0).toLocaleString()}</td>
                  <td className="p-2 text-right">{producciones.reduce((s, p) => s + p.salida, 0).toLocaleString()}</td>
                  <td className="p-2 text-right">{producciones.reduce((s, p) => s + p.saldo, 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {producciones.map((p, i) => (
              <div key={p.tipoHuevoId} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-800 mb-3">{p.nombre}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Cantidad</Label>
                    <Input type="number" value={p.cantidad} onChange={(e) => updateProduccion(i, 'cantidad', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Salida</Label>
                    <Input type="number" value={p.salida} onChange={(e) => updateProduccion(i, 'salida', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Saldo</Label>
                    <Input type="number" value={p.saldo} onChange={(e) => updateProduccion(i, 'saldo', parseInt(e.target.value) || 0)} className="text-right h-9 mt-1" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="font-bold text-green-800">TOTAL</span>
              <div className="flex gap-4 text-sm font-bold">
                <span>Cant: {producciones.reduce((s, p) => s + p.cantidad, 0).toLocaleString()}</span>
                <span>Sal: {producciones.reduce((s, p) => s + p.salida, 0).toLocaleString()}</span>
                <span>Saldo: {producciones.reduce((s, p) => s + p.saldo, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
