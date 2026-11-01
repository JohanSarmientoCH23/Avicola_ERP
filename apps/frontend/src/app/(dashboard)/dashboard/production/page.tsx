"use client";

import { useState, useEffect, useCallback } from "react";
import { productionService, galponesService } from "@/lib/api";
import { StickyFooter, SaveButton } from "@/components/mobile/StickyFooter";
import { GalponSection } from "@/components/forms/GalponSection";
import { HuevosSection } from "@/components/forms/HuevosSection";
import { BandejasSection } from "@/components/forms/BandejasSection";
import { Stepper, StepContent } from "@/components/mobile/Stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const KG_POR_SACO = 40;

const localDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getRolFromCookie = () => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith("user="));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("="))).rol ?? null;
  } catch {
    return null;
  }
};

type StepId = "fecha" | "galpones" | "huevos" | "bandejas" | "confirmar";

const STEPS: { id: StepId; label: string; icon: React.ReactNode }[] = [
  { id: "fecha", label: "Fecha", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { id: "galpones", label: "Galpones", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { id: "huevos", label: "Huevos", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { id: "bandejas", label: "Inventario", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { id: "confirmar", label: "Confirmar", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

interface GalponFormData {
  galponId: string;
  codigo: string;
  gallinas: number;
  mortalidad: number;
  produccion: number;
  alimentoEntrada: number;
  alimentoConsumo: number;
}

interface HuevoFormData {
  tipoHuevoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  salida: number;
  saldo: number;
}

interface BandejaFormData {
  tipo: "AA" | "A" | "B";
  entradas: number;
  salidas: number;
  saldoAnterior: number;
  saldoBodega: number;
}

export default function ProductionPage() {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState<StepId>("fecha");
  const [fecha, setFecha] = useState(localDateString());
  const [observaciones, setObservaciones] = useState("");
  const [galpones, setGalpones] = useState<any[]>([]);
  const [tiposHuevo, setTiposHuevo] = useState<any[]>([]);
  const [detalles, setDetalles] = useState<GalponFormData[]>([]);
  const [producciones, setProducciones] = useState<HuevoFormData[]>([]);
  const [bandejas, setBandejas] = useState<BandejaFormData[]>([
    { tipo: "AA", entradas: 0, salidas: 0, saldoAnterior: 0, saldoBodega: 0 },
    { tipo: "A", entradas: 0, salidas: 0, saldoAnterior: 0, saldoBodega: 0 },
    { tipo: "B", entradas: 0, salidas: 0, saldoAnterior: 0, saldoBodega: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedGalpon, setExpandedGalpon] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEstado, setEditingEstado] = useState<string | null>(null);
  const [existingReport, setExistingReport] = useState<{ id: string; estado: string } | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [gRes, tRes] = await Promise.all([
        galponesService.getAll(),
        productionService.getTiposHuevo(),
      ]);
      setGalpones(gRes.data);
      setTiposHuevo(tRes.data);
      setDetalles(gRes.data.map((g: any) => ({
        galponId: g.id,
        codigo: g.codigo,
        gallinas: g.gallinasActuales,
        mortalidad: 0,
        produccion: 0,
        alimentoEntrada: 0,
        alimentoConsumo: 0,
      })));
      setProducciones(tRes.data.map((t: any) => ({
        tipoHuevoId: t.id,
        codigo: t.codigo,
        nombre: t.nombre,
        cantidad: 0,
        salida: 0,
        saldo: 0,
      })));
    } catch (err: any) {
      setError("Error al cargar datos: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!detalles.length || !producciones.length) return;

    let cancelled = false;

    const resetForm = () => {
      setDetalles(detalles.map((d) => ({ ...d, mortalidad: 0, produccion: 0, alimentoEntrada: 0, alimentoConsumo: 0 })));
      setProducciones(producciones.map((p) => ({ ...p, cantidad: 0, salida: 0, saldo: 0 })));
      setBandejas(bandejas.map((b) => ({ ...b, entradas: 0, salidas: 0, saldoAnterior: 0, saldoBodega: 0 })));
      setObservaciones("");
      setError("");
      setEditingId(null);
      setEditingEstado(null);
      setExistingReport(null);
    };

    const searchExisting = async () => {
      resetForm();

      if (getRolFromCookie() !== "GALPONERO") return;

      setLoadingReport(true);
      try {
        const listRes = await productionService.getReports({ fecha, limit: 10 });
        const payload = listRes.data;
        const items: any[] = Array.isArray(payload) ? payload : payload?.data ?? [];
        const mine = items.find((r) => String(r.fecha).slice(0, 10) === fecha);
        if (!cancelled && mine) {
          setExistingReport({ id: mine.id, estado: mine.estado });
        }
      } catch {
        // sin reporte existente accesible: se captura desde cero
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    };

    searchExisting();

    return () => {
      cancelled = true;
    };
  }, [fecha, detalles.length, producciones.length]);

  const handleLoadExisting = async () => {
    if (!existingReport) return;

    setLoadingReport(true);
    setError("");
    try {
      const full = (await productionService.getReport(existingReport.id)).data;
      const num = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

      setEditingId(full.id);
      setEditingEstado(full.estado);
      setObservaciones(full.observaciones || "");
      setDetalles((prev) =>
        prev.map((d) => {
          const saved = (full.detallesGalpon || []).find((x: any) => x.galponId === d.galponId);
          return saved
            ? {
                ...d,
                mortalidad: num(saved.mortalidad),
                produccion: num(saved.produccion),
                alimentoEntrada: num(saved.alimentoEntrada),
                alimentoConsumo: num(saved.alimentoConsumo),
              }
            : d;
        })
      );
      setProducciones((prev) =>
        prev.map((p) => {
          const saved = (full.produccionesHuevo || []).find((x: any) => x.tipoHuevoId === p.tipoHuevoId);
          return saved
            ? { ...p, cantidad: num(saved.cantidad), salida: num(saved.salida), saldo: num(saved.saldo) }
            : p;
        })
      );
      setBandejas((prev) =>
        prev.map((b) => {
          const saved = (full.inventarioBandejas || []).find((x: any) => x.tipo === b.tipo);
          return saved
            ? {
                ...b,
                entradas: num(saved.entradas),
                salidas: num(saved.salidas),
                saldoAnterior: num(saved.saldoAnterior),
                saldoBodega: num(saved.saldoBodega),
              }
            : b;
        })
      );
      setCurrentStep("galpones");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo cargar el reporte existente");
    } finally {
      setLoadingReport(false);
    }
  };

  const updateDetalle = (index: number, field: keyof GalponFormData, value: number) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const updateProduccion = (index: number, field: keyof HuevoFormData, value: number) => {
    const newProd = [...producciones];
    newProd[index] = { ...newProd[index], [field]: value };
    setProducciones(newProd);
  };

  const updateBandeja = (index: number, field: keyof BandejaFormData, value: number) => {
    const newBandejas = [...bandejas];
    newBandejas[index] = { ...newBandejas[index], [field]: value };
    setBandejas(newBandejas);
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        fecha,
        observaciones: observaciones.trim() || undefined,
        detallesGalpon: detalles.map((d) => ({
          galponId: d.galponId,
          mortalidad: d.mortalidad,
          produccion: d.produccion,
          alimentoEntrada: d.alimentoEntrada,
          alimentoConsumo: d.alimentoConsumo,
          gallinas: d.gallinas,
        })),
        produccionesHuevo: producciones.map((p) => ({
          tipoHuevoId: p.tipoHuevoId,
          cantidad: p.cantidad,
          salida: p.salida,
          saldo: p.saldo,
        })),
        inventarioBandejas: bandejas.map((b) => ({
          tipo: b.tipo,
          entradas: b.entradas,
          salidas: b.salidas,
          saldoAnterior: b.saldoAnterior,
          saldoBodega: b.saldoBodega,
        })),
      };

      if (editingId) {
        const res = await productionService.updateReport(editingId, payload);
        setEditingEstado("BORRADOR");
        setExistingReport({ id: res.data?.id ?? editingId, estado: "BORRADOR" });
        alert("Reporte actualizado exitosamente");
      } else {
        const res = await productionService.createReport(payload);
        setEditingId(res.data?.id ?? null);
        setEditingEstado("BORRADOR");
        if (res.data?.id) setExistingReport({ id: res.data.id, estado: "BORRADOR" });
        alert("Reporte guardado exitosamente");
      }

      setCurrentStep("fecha");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el reporte");
    } finally {
      setSaving(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case "fecha":
        return !!fecha && detalles.length > 0 && !loading;
      case "galpones":
        return true; // Always can proceed
      case "huevos":
        return true;
      case "bandejas":
        return true;
      case "confirmar":
        return true;
      default:
        return false;
    }
  };

  const hasAnyData = () => {
    return (
      detalles.some((d) => d.mortalidad > 0 || d.produccion > 0 || d.alimentoEntrada > 0) ||
      producciones.some((p) => p.cantidad > 0 || p.salida > 0) ||
      bandejas.some((b) => b.entradas > 0 || b.salidas > 0)
    );
  };

  const alimentoEntradaKg = detalles.reduce((s, d) => s + d.alimentoEntrada, 0);
  const alimentoConsumoKg = detalles.reduce((s, d) => s + d.alimentoConsumo, 0);
  const sacosEntrada = Math.round(alimentoEntradaKg / KG_POR_SACO);
  const sacosSalida = Math.round(alimentoConsumoKg / KG_POR_SACO);
  const sacosSaldo = sacosEntrada - sacosSalida;
  const totalPostura = detalles.reduce((s, d) => s + d.produccion, 0);
  const totalClasificado = producciones.reduce((s, p) => s + p.cantidad, 0);
  const totalPosturaDia = totalPostura + totalClasificado;

  return (
    <div className="bg-surface-low pb-40">
      <main className={cn("mx-auto", isMobile ? "max-w-md px-1" : "max-w-5xl")}>
        {/* Stepper */}
        <div className="mb-6">
          <Stepper
            steps={STEPS}
            currentStep={STEPS.findIndex((s) => s.id === currentStep)}
            onStepClick={(index) => setCurrentStep(STEPS[index].id)}
            orientation={isMobile ? "horizontal" : "horizontal"}
          />
        </div>

        {/* Step Content */}
        <div className="relative min-h-[400px]">
          {/* Step 1: Fecha */}
          <StepContent step={0} currentStep={STEPS.findIndex((s) => s.id === currentStep)}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Fecha del Reporte</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-ink mb-2">Seleccionar fecha</Label>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      max={localDateString()}
                      className={cn("h-12 text-lg", isMobile && "w-full")}
                    />
                  </div>

                  {loadingReport && (
                    <div className="flex items-center gap-2 text-sm text-ink-soft">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                      Buscando reporte existente…
                    </div>
                  )}

                  {editingId && !loadingReport && (
                    <div className="bg-surface-container border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm space-y-1">
                      <p className="font-medium">Editando el reporte existente de esta fecha</p>
                      <p className="text-blue-700">
                        Estado actual: {editingEstado}. Al guardar se reemplazan los datos y el reporte vuelve a BORRADOR.
                      </p>
                    </div>
                  )}

                  {!editingId && existingReport && !loadingReport && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm space-y-1">
                      <p className="font-medium">Ya existe un reporte para esta fecha (estado: {existingReport.estado})</p>
                      <p className="text-amber-700">
                        Los campos están en cero. Para corregir ese reporte cárguelo; si va a capturar otro día, cambie la fecha.
                      </p>
                      <Button variant="outline" onClick={handleLoadExisting} className="mt-1 h-9">
                        Cargar reporte para editar
                      </Button>
                    </div>
                  )}

                  <p className="text-sm text-ink-soft">
                    Los datos se guardarán para el día seleccionado. No se puede elegir una fecha futura.
                  </p>

                  {error && detalles.length === 0 && !loading && (
                    <div className="bg-error-container border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm space-y-2">
                      <p>{error}</p>
                      <Button variant="outline" onClick={loadData} className="h-9">
                        Reintentar carga de galpones
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </StepContent>

          {/* Step 2: Galpones */}
          <StepContent step={1} currentStep={STEPS.findIndex((s) => s.id === currentStep)}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Producción por Galpón
                  <span className="text-sm font-normal text-ink-soft">{detalles.length} galpones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                  </div>
                ) : detalles.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-sm text-error">{error || "No se pudieron cargar los galpones."}</p>
                    <Button variant="outline" onClick={loadData} className="h-9">
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <GalponSection
                    data={detalles}
                    onUpdate={updateDetalle}
                    isMobile={isMobile}
                    expandedGalpon={expandedGalpon}
                    onToggleGalpon={setExpandedGalpon}
                  />
                )}
              </CardContent>
            </Card>
          </StepContent>

          {/* Step 3: Huevos */}
          <StepContent step={2} currentStep={STEPS.findIndex((s) => s.id === currentStep)}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Clasificación de Huevos</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                  </div>
                ) : (
                  <HuevosSection data={producciones} onUpdate={updateProduccion} isMobile={isMobile} totalGalpones={totalPostura} />
                )}
              </CardContent>
            </Card>
          </StepContent>

          {/* Step 4: Inventario (bandejas + sacos) */}
          <StepContent step={3} currentStep={STEPS.findIndex((s) => s.id === currentStep)}>
            <div className="space-y-4">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg">Inventario de Bandejas</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <BandejasSection data={bandejas} onUpdate={updateBandeja} isMobile={isMobile} />
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Sacos de Alimento
                    <span className="text-xs font-normal text-ink-soft">40 kg / saco</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Entrada", value: sacosEntrada },
                      { label: "Salida", value: sacosSalida },
                      { label: "Saldo", value: sacosSaldo },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-line bg-surface-low p-3 text-center">
                        <p className="text-[11px] uppercase tracking-wide text-ink-soft font-semibold">{s.label}</p>
                        <p className={cn("text-xl font-bold tabular-nums", s.value < 0 ? "text-error" : "text-ink")}>
                          {s.value.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-ink-soft mt-2">
                    Calculado desde el alimento registrado por galpón: {alimentoEntradaKg.toLocaleString()} kg entrada y {alimentoConsumoKg.toLocaleString()} kg consumo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </StepContent>

          {/* Step 5: Confirmar */}
          <StepContent step={4} currentStep={STEPS.findIndex((s) => s.id === currentStep)}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Confirmar Reporte</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="bg-surface-low rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-ink-soft">Fecha</p>
                      <p className="font-medium">{new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p>
                    </div>
                    <div>
                      <p className="text-ink-soft">Galpones con datos</p>
                      <p className="font-medium">{detalles.filter((d) => d.mortalidad > 0 || d.produccion > 0 || d.alimentoEntrada > 0).length}</p>
                    </div>
                    <div>
                      <p className="text-ink-soft">Total producción</p>
                      <p className="font-medium text-brand-strong">{totalPostura.toLocaleString()} huevos</p>
                    </div>
                    <div>
                      <p className="text-ink-soft">Total mortalidad</p>
                      <p className="font-medium text-red-700">{detalles.reduce((s, d) => s + d.mortalidad, 0).toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-ink-soft">Postura del día (total)</p>
                      <p className="font-medium text-brand-strong">{totalPosturaDia.toLocaleString()} huevos</p>
                      <p className="text-xs text-ink-soft">
                        galpones {totalPostura.toLocaleString()} + detalle {totalClasificado.toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-ink-soft">Bandejas movidas</p>
                      <p className="font-medium">{bandejas.reduce((s, b) => s + b.entradas + b.salidas, 0).toLocaleString()} unidades</p>
                    </div>
                  </div>
                </div>

                {!editingId && existingReport && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm space-y-2">
                    <p>
                      Ya existe un reporte para esta fecha (estado: {existingReport.estado}). Para no duplicarlo, cárguelo y
                      edítelo.
                    </p>
                    <Button variant="outline" onClick={handleLoadExisting} className="h-9">
                      Cargar reporte para editar
                    </Button>
                  </div>
                )}

                {editingId && (
                  <div className="bg-surface-container border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm">
                    Guardará los cambios sobre el reporte existente (estado actual: {editingEstado}).
                  </div>
                )}

                <div>
                  <Label htmlFor="observaciones" className="block text-sm font-medium text-ink mb-2">
                    Observaciones
                  </Label>
                  <textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Novedades del día, visitas, daños, etc."
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-y"
                  />
                  <p className="text-xs text-outline text-right mt-1">{observaciones.length}/500</p>
                </div>

                {error && (
                  <div className="bg-error-container border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}

                {!hasAnyData() && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    No hay datos ingresados. El reporte se guardará con ceros.
                  </div>
                )}
              </CardContent>
            </Card>
          </StepContent>
        </div>

        {/* Navigation Buttons - Desktop */}
        {!isMobile && (
          <div className="flex justify-between mt-6 sticky bottom-0 z-10 bg-white py-4 border-t border-line shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === "fecha"}>
              Anterior
            </Button>
            <div className="flex gap-3">
              {currentStep !== "confirmar" ? (
                <Button onClick={nextStep} disabled={!canGoNext()}>
                  Siguiente
                </Button>
              ) : (
                <SaveButton onClick={handleSubmit} loading={saving} label={editingId ? "Actualizar Reporte" : "Guardar Reporte"} disabled={!editingId && !!existingReport} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Footer */}
      {isMobile && (
        <StickyFooter className="bottom-14 pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {currentStep !== "fecha" && (
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Anterior
                </Button>
              )}
              {currentStep !== "confirmar" ? (
                <SaveButton onClick={nextStep} disabled={!canGoNext()} label="Siguiente" variant="primary" className="flex-1" />
              ) : (
                <SaveButton onClick={handleSubmit} loading={saving} label={editingId ? "Actualizar Reporte" : "Guardar Reporte"} disabled={!editingId && !!existingReport} className="flex-1" />
              )}
            </div>
            {currentStep === "confirmar" && hasAnyData() && (
              <p className="text-center text-xs text-ink-soft">
                Se guardará para {detalles.length} galpones • {totalPosturaDia.toLocaleString()} huevos
              </p>
            )}
          </div>
        </StickyFooter>
      )}
    </div>
  );
}