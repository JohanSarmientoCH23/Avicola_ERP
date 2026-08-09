"use client";

import { useState, useEffect } from "react";
import { inventoryService, galponesService, productionService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Galpon { id: string; codigo: string; }

export default function InventoryPage() {
  const [galpones, setGalpones] = useState<Galpon[]>([]);
  const [selectedGalpon, setSelectedGalpon] = useState("");
  const [selectedTab, setSelectedTab] = useState("gallinas");
  const [resumen, setResumen] = useState<any>(null);
  const [kardexGallinas, setKardexGallinas] = useState<any[]>([]);
  const [kardexAlimento, setKardexAlimento] = useState<any[]>([]);
  const [kardexBandejas, setKardexBandejas] = useState<any[]>([]);
  const [kardexHuevos, setKardexHuevos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formGallinas, setFormGallinas] = useState({ fecha: new Date().toISOString().split("T")[0], saldoInicial: "", entradas: "", mortalidad: "", ventas: "", traslados: "", observaciones: "" });
  const [formAlimento, setFormAlimento] = useState({ fecha: new Date().toISOString().split("T")[0], saldoInicialKg: "", entradasKg: "", consumoKg: "", saldoInicialBultos: "", entradasBultos: "", consumoBultos: "", observaciones: "" });
  const [formHuevos, setFormHuevos] = useState({ fecha: new Date().toISOString().split("T")[0], tipoHuevoId: "", saldoInicial: "", produccion: "", ventas: "", perdidas: "", consumo: "", observaciones: "" });
  const [formBandejas, setFormBandejas] = useState({ fecha: new Date().toISOString().split("T")[0], tipo: "AA", entradas: "", salidas: "", saldoAnterior: "", saldoBodega: "", observaciones: "" });
  const [tiposHuevo, setTiposHuevo] = useState<any[]>([]);

  useEffect(() => { loadGalpones(); }, []);

  const loadGalpones = async () => {
    try {
      const res = await galponesService.getAll();
      setGalpones(res.data);
      if (res.data.length > 0) {
        setSelectedGalpon(res.data[0].id);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (selectedGalpon) loadKardex();
  }, [selectedGalpon, selectedTab]);

  useEffect(() => {
    productionService.getTiposHuevo()
      .then(d => setTiposHuevo(Array.isArray(d.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const loadKardex = async () => {
    if (!selectedGalpon) return;
    try {
      const [resumenRes] = await Promise.all([inventoryService.getResumen()]);
      setResumen(resumenRes.data);
      switch (selectedTab) {
        case "gallinas": {
          const r = await inventoryService.getGallinas(selectedGalpon);
          setKardexGallinas(r.data || []);
          break;
        }
        case "alimento": {
          const r = await inventoryService.getAlimento(selectedGalpon);
          setKardexAlimento(r.data || []);
          break;
        }
        case "bandejas": {
          const r = await inventoryService.getBandejas(selectedGalpon);
          setKardexBandejas(r.data || []);
          break;
        }
      }
    } catch (e) { console.error(e); }
  };

  const saveGallinas = async () => {
    if (!selectedGalpon) return;
    setSaving(true);
    try {
      const lastEntry = kardexGallinas.length > 0 ? kardexGallinas[kardexGallinas.length - 1] : null;
      const saldoInicial = formGallinas.saldoInicial ? parseInt(formGallinas.saldoInicial) : (lastEntry?.saldoFinal || 0);
      const entradas = parseInt(formGallinas.entradas) || 0;
      const mortalidad = parseInt(formGallinas.mortalidad) || 0;
      const ventas = parseInt(formGallinas.ventas) || 0;
      const traslados = parseInt(formGallinas.traslados) || 0;
      const saldoFinal = saldoInicial + entradas - mortalidad - ventas - traslados;

      await inventoryService.createGallina({
        galponId: selectedGalpon,
        fecha: formGallinas.fecha,
        saldoInicial, entradas, mortalidad, ventas, traslados, saldoFinal,
        observaciones: formGallinas.observaciones || undefined,
      });
      setShowForm(false);
      setFormGallinas({ fecha: new Date().toISOString().split("T")[0], saldoInicial: "", entradas: "", mortalidad: "", ventas: "", traslados: "", observaciones: "" });
      loadKardex();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  const saveAlimento = async () => {
    if (!selectedGalpon) return;
    setSaving(true);
    try {
      const lastEntry = kardexAlimento.length > 0 ? kardexAlimento[kardexAlimento.length - 1] : null;
      const saldoInicialKg = formAlimento.saldoInicialKg ? parseFloat(formAlimento.saldoInicialKg) : Number(lastEntry?.saldoFinalKg || 0);
      const entradasKg = parseFloat(formAlimento.entradasKg) || 0;
      const consumoKg = parseFloat(formAlimento.consumoKg) || 0;
      const saldoFinalKg = saldoInicialKg + entradasKg - consumoKg;
      const saldoInicialBultos = formAlimento.saldoInicialBultos ? parseInt(formAlimento.saldoInicialBultos) : (lastEntry?.saldoFinalBultos || 0);
      const entradasBultos = parseInt(formAlimento.entradasBultos) || 0;
      const consumoBultos = parseInt(formAlimento.consumoBultos) || 0;
      const saldoFinalBultos = saldoInicialBultos + entradasBultos - consumoBultos;

      await inventoryService.createAlimento({
        galponId: selectedGalpon,
        fecha: formAlimento.fecha,
        saldoInicialKg, entradasKg, consumoKg, saldoFinalKg,
        saldoInicialBultos, entradasBultos, consumoBultos, saldoFinalBultos,
        observaciones: formAlimento.observaciones || undefined,
      });
      setShowForm(false);
      setFormAlimento({ fecha: new Date().toISOString().split("T")[0], saldoInicialKg: "", entradasKg: "", consumoKg: "", saldoInicialBultos: "", entradasBultos: "", consumoBultos: "", observaciones: "" });
      loadKardex();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  const saveHuevos = async () => {
    if (!formHuevos.tipoHuevoId) { alert("Seleccione tipo de huevo"); return; }
    setSaving(true);
    try {
      const tipoId = formHuevos.tipoHuevoId;
      const lastEntry = kardexHuevos.find((h: any) => h.tipoHuevoId === tipoId);
      const saldoInicial = formHuevos.saldoInicial ? parseInt(formHuevos.saldoInicial) : (lastEntry?.saldoFinal || 0);
      const produccion = parseInt(formHuevos.produccion) || 0;
      const ventas = parseInt(formHuevos.ventas) || 0;
      const perdidas = parseInt(formHuevos.perdidas) || 0;
      const consumo = parseInt(formHuevos.consumo) || 0;
      const saldoFinal = saldoInicial + produccion - ventas - perdidas - consumo;

      await inventoryService.createHuevo({
        tipoHuevoId: tipoId,
        fecha: formHuevos.fecha,
        saldoInicial, produccion, ventas, perdidas, consumo, saldoFinal,
        observaciones: formHuevos.observaciones || undefined,
      });
      setShowForm(false);
      setFormHuevos({ fecha: new Date().toISOString().split("T")[0], tipoHuevoId: "", saldoInicial: "", produccion: "", ventas: "", perdidas: "", consumo: "", observaciones: "" });
      loadKardex();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  const saveBandejas = async () => {
    if (!selectedGalpon) return;
    setSaving(true);
    try {
      const entradas = parseInt(formBandejas.entradas) || 0;
      const salidas = parseInt(formBandejas.salidas) || 0;
      const saldoAnterior = parseInt(formBandejas.saldoAnterior) || 0;
      const saldoBodega = saldoAnterior + entradas - salidas;

      await inventoryService.createBandeja({
        galponId: selectedGalpon,
        fecha: formBandejas.fecha,
        tipo: formBandejas.tipo,
        entradas, salidas, saldoAnterior, saldoBodega,
        observaciones: formBandejas.observaciones || undefined,
      });
      setShowForm(false);
      setFormBandejas({ fecha: new Date().toISOString().split("T")[0], tipo: "AA", entradas: "", salidas: "", saldoAnterior: "", saldoBodega: "", observaciones: "" });
      loadKardex();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  const getFormTitle = () => {
    switch (selectedTab) {
      case "gallinas": return "Registrar Movimiento de Gallinas";
      case "alimento": return "Registrar Movimiento de Alimento";
      case "huevos": return "Registrar Inventario de Huevos";
      case "bandejas": return "Registrar Movimiento de Bandejas";
      default: return "Registrar Movimiento";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Inventarios</h1>
          <p className="text-muted-foreground text-sm">Control de inventarios tipo Kardex</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 sm:w-auto" onClick={() => setShowForm(true)}>+ Nuevo Movimiento</Button>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Galpon:</label>
        <select className="border rounded-lg p-2" value={selectedGalpon} onChange={(e) => setSelectedGalpon(e.target.value)}>
          {galpones.map((g) => (
            <option key={g.id} value={g.id}>Galpon {g.codigo}</option>
          ))}
        </select>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="gallinas">Gallinas</TabsTrigger>
          <TabsTrigger value="huevos">Huevos</TabsTrigger>
          <TabsTrigger value="alimento">Alimento</TabsTrigger>
          <TabsTrigger value="bandejas">Bandejas</TabsTrigger>
        </TabsList>

        <TabsContent value="gallinas">
          <Card>
            <CardHeader><CardTitle className="text-lg">Kardex de Gallinas</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Saldo Actual</p>
                  <p className="text-xl font-bold">{kardexGallinas.length > 0 ? kardexGallinas[kardexGallinas.length - 1].saldoFinal?.toLocaleString() : "0"}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Entradas Totales</p>
                  <p className="text-xl font-bold">{kardexGallinas.reduce((s: number, k: any) => s + (k.entradas || 0), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Mortalidad Total</p>
                  <p className="text-xl font-bold text-red-600">{kardexGallinas.reduce((s: number, k: any) => s + (k.mortalidad || 0), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Ventas Totales</p>
                  <p className="text-xl font-bold">{kardexGallinas.reduce((s: number, k: any) => s + (k.ventas || 0), 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="p-2 text-left">Fecha</th><th className="p-2 text-right">Saldo Inicial</th><th className="p-2 text-right">Entradas</th><th className="p-2 text-right">Mortalidad</th><th className="p-2 text-right">Ventas</th><th className="p-2 text-right">Traslados</th><th className="p-2 text-right">Saldo Final</th></tr></thead>
                  <tbody>
                    {kardexGallinas.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Sin registros. Haga clic en "Nuevo Movimiento" para agregar.</td></tr>}
                    {kardexGallinas.map((k: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(k.fecha).toLocaleDateString()}</td>
                        <td className="p-2 text-right">{k.saldoInicial?.toLocaleString()}</td>
                        <td className="p-2 text-right text-green-600">{k.entradas?.toLocaleString()}</td>
                        <td className="p-2 text-right text-red-600">{k.mortalidad?.toLocaleString()}</td>
                        <td className="p-2 text-right">{k.ventas?.toLocaleString()}</td>
                        <td className="p-2 text-right">{k.traslados?.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold">{k.saldoFinal?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="huevos">
          <Card>
            <CardHeader><CardTitle className="text-lg">Inventario de Huevos</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="p-2 text-left">Tipo</th><th className="p-2 text-right">Saldo</th></tr></thead>
                  <tbody>
                    {resumen?.huevos?.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">Sin registros de huevos.</td></tr>}
                    {resumen?.huevos?.map((h: any, i: number) => (
                      <tr key={i} className="border-b"><td className="p-2">Tipo {h.tipoHuevoId?.slice(0, 8)}</td><td className="p-2 text-right font-medium">{(h._sum?.saldoFinal || 0).toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alimento">
          <Card>
            <CardHeader><CardTitle className="text-lg">Kardex de Alimento</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Saldo Actual (kg)</p>
                  <p className="text-xl font-bold">{kardexAlimento.length > 0 ? Number(kardexAlimento[kardexAlimento.length - 1].saldoFinalKg).toLocaleString() : "0"}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Entradas Totales (kg)</p>
                  <p className="text-xl font-bold">{kardexAlimento.reduce((s: number, k: any) => s + Number(k.entradasKg || 0), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Consumo Total (kg)</p>
                  <p className="text-xl font-bold text-red-600">{kardexAlimento.reduce((s: number, k: any) => s + Number(k.consumoKg || 0), 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="p-2 text-left">Fecha</th><th className="p-2 text-right">Saldo Inicial (kg)</th><th className="p-2 text-right">Entradas (kg)</th><th className="p-2 text-right">Consumo (kg)</th><th className="p-2 text-right">Saldo Final (kg)</th><th className="p-2 text-right">Bultos</th></tr></thead>
                  <tbody>
                    {kardexAlimento.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Sin registros.</td></tr>}
                    {kardexAlimento.map((k: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(k.fecha).toLocaleDateString()}</td>
                        <td className="p-2 text-right">{Number(k.saldoInicialKg).toLocaleString()}</td>
                        <td className="p-2 text-right text-green-600">{Number(k.entradasKg).toLocaleString()}</td>
                        <td className="p-2 text-right text-red-600">{Number(k.consumoKg).toLocaleString()}</td>
                        <td className="p-2 text-right font-bold">{Number(k.saldoFinalKg).toLocaleString()}</td>
                        <td className="p-2 text-right">{k.saldoFinalBultos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bandejas">
          <Card>
            <CardHeader><CardTitle className="text-lg">Kardex de Bandejas</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="p-2 text-left">Fecha</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-right">Entradas</th><th className="p-2 text-right">Salidas</th><th className="p-2 text-right">Saldo Anterior</th><th className="p-2 text-right">Saldo Bodega</th></tr></thead>
                  <tbody>
                    {kardexBandejas.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Sin registros.</td></tr>}
                    {kardexBandejas.map((k: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(k.fecha).toLocaleDateString()}</td>
                        <td className="p-2">{k.tipo}</td>
                        <td className="p-2 text-right text-green-600">{k.entradas?.toLocaleString()}</td>
                        <td className="p-2 text-right text-red-600">{k.salidas?.toLocaleString()}</td>
                        <td className="p-2 text-right">{k.saldoAnterior?.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold">{k.saldoBodega?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showForm && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>{getFormTitle()}</h2>

            {selectedTab === "gallinas" && (
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Fecha</label><Input type="date" value={formGallinas.fecha} onChange={e => setFormGallinas({...formGallinas, fecha: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Saldo Inicial (auto: ultimo saldo final)</label><Input type="number" placeholder="Automatico si se deja vacio" value={formGallinas.saldoInicial} onChange={e => setFormGallinas({...formGallinas, saldoInicial: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Entradas</label><Input type="number" placeholder="0" value={formGallinas.entradas} onChange={e => setFormGallinas({...formGallinas, entradas: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Mortalidad</label><Input type="number" placeholder="0" value={formGallinas.mortalidad} onChange={e => setFormGallinas({...formGallinas, mortalidad: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Ventas</label><Input type="number" placeholder="0" value={formGallinas.ventas} onChange={e => setFormGallinas({...formGallinas, ventas: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Traslados</label><Input type="number" placeholder="0" value={formGallinas.traslados} onChange={e => setFormGallinas({...formGallinas, traslados: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Observaciones</label><Input placeholder="Opcional" value={formGallinas.observaciones} onChange={e => setFormGallinas({...formGallinas, observaciones: e.target.value})} /></div>
              </div>
            )}

            {selectedTab === "alimento" && (
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Fecha</label><Input type="date" value={formAlimento.fecha} onChange={e => setFormAlimento({...formAlimento, fecha: e.target.value})} /></div>
                <p className="text-xs text-muted-foreground">Kilogramos</p>
                <div><label className="text-sm font-medium">Saldo Inicial Kg</label><Input type="number" step="0.01" placeholder="Automatico si se deja vacio" value={formAlimento.saldoInicialKg} onChange={e => setFormAlimento({...formAlimento, saldoInicialKg: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Entradas Kg</label><Input type="number" step="0.01" placeholder="0" value={formAlimento.entradasKg} onChange={e => setFormAlimento({...formAlimento, entradasKg: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Consumo Kg</label><Input type="number" step="0.01" placeholder="0" value={formAlimento.consumoKg} onChange={e => setFormAlimento({...formAlimento, consumoKg: e.target.value})} /></div>
                <p className="text-xs text-muted-foreground">Bultos</p>
                <div><label className="text-sm font-medium">Saldo Inicial Bultos</label><Input type="number" placeholder="Automatico si se deja vacio" value={formAlimento.saldoInicialBultos} onChange={e => setFormAlimento({...formAlimento, saldoInicialBultos: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Entradas Bultos</label><Input type="number" placeholder="0" value={formAlimento.entradasBultos} onChange={e => setFormAlimento({...formAlimento, entradasBultos: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Consumo Bultos</label><Input type="number" placeholder="0" value={formAlimento.consumoBultos} onChange={e => setFormAlimento({...formAlimento, consumoBultos: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Observaciones</label><Input placeholder="Opcional" value={formAlimento.observaciones} onChange={e => setFormAlimento({...formAlimento, observaciones: e.target.value})} /></div>
              </div>
            )}

            {selectedTab === "huevos" && (
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Fecha</label><Input type="date" value={formHuevos.fecha} onChange={e => setFormHuevos({...formHuevos, fecha: e.target.value})} /></div>
                <div>
                  <label className="text-sm font-medium">Tipo de Huevo *</label>
                  <select className="w-full border rounded-lg p-2" value={formHuevos.tipoHuevoId} onChange={e => setFormHuevos({...formHuevos, tipoHuevoId: e.target.value})}>
                    <option value="">Seleccionar tipo...</option>
                    {tiposHuevo.map((t: any) => <option key={t.id} value={t.id}>{t.nombre} ({t.codigo})</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium">Saldo Inicial</label><Input type="number" placeholder="Automatico si se deja vacio" value={formHuevos.saldoInicial} onChange={e => setFormHuevos({...formHuevos, saldoInicial: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Produccion</label><Input type="number" placeholder="0" value={formHuevos.produccion} onChange={e => setFormHuevos({...formHuevos, produccion: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Ventas</label><Input type="number" placeholder="0" value={formHuevos.ventas} onChange={e => setFormHuevos({...formHuevos, ventas: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Perdidas</label><Input type="number" placeholder="0" value={formHuevos.perdidas} onChange={e => setFormHuevos({...formHuevos, perdidas: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Consumo</label><Input type="number" placeholder="0" value={formHuevos.consumo} onChange={e => setFormHuevos({...formHuevos, consumo: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Observaciones</label><Input placeholder="Opcional" value={formHuevos.observaciones} onChange={e => setFormHuevos({...formHuevos, observaciones: e.target.value})} /></div>
              </div>
            )}

            {selectedTab === "bandejas" && (
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Fecha</label><Input type="date" value={formBandejas.fecha} onChange={e => setFormBandejas({...formBandejas, fecha: e.target.value})} /></div>
                <div>
                  <label className="text-sm font-medium">Tipo de Bandeja</label>
                  <select className="w-full border rounded-lg p-2" value={formBandejas.tipo} onChange={e => setFormBandejas({...formBandejas, tipo: e.target.value})}>
                    <option value="AA">Bandeja AA</option>
                    <option value="A">Bandeja A</option>
                    <option value="B">Bandeja B</option>
                  </select>
                </div>
                <div><label className="text-sm font-medium">Saldo Anterior</label><Input type="number" placeholder="Automatico si se deja vacio" value={formBandejas.saldoAnterior} onChange={e => setFormBandejas({...formBandejas, saldoAnterior: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Entradas</label><Input type="number" placeholder="0" value={formBandejas.entradas} onChange={e => setFormBandejas({...formBandejas, entradas: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Salidas</label><Input type="number" placeholder="0" value={formBandejas.salidas} onChange={e => setFormBandejas({...formBandejas, salidas: e.target.value})} /></div>
                <div><label className="text-sm font-medium">Observaciones</label><Input placeholder="Opcional" value={formBandejas.observaciones} onChange={e => setFormBandejas({...formBandejas, observaciones: e.target.value})} /></div>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", cursor: "pointer", backgroundColor: "white" }}>Cancelar</button>
              <button
                onClick={() => {
                  switch (selectedTab) {
                    case "gallinas": saveGallinas(); break;
                    case "alimento": saveAlimento(); break;
                    case "huevos": saveHuevos(); break;
                    case "bandejas": saveBandejas(); break;
                  }
                }}
                disabled={saving}
                style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", backgroundColor: "#16a34a", color: "white", border: "none", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
