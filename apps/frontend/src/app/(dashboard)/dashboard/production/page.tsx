"use client";

import { useState, useEffect, useCallback } from "react";
import { productionService, galponesService } from "@/lib/api";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { StickyFooter, SaveButton } from "@/components/mobile/StickyFooter";
import { GalponSection } from "@/components/forms/GalponSection";
import { HuevosSection } from "@/components/forms/HuevosSection";
import { BandejasSection } from "@/components/forms/BandejasSection";
import { Stepper, StepContent } from "@/components/mobile/Stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const STEPS = [
  { id: "fecha", label: "Fecha", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { id: "galpones", label: "Galpones", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { id: "huevos", label: "Huevos", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { id: "bandejas", label: "Bandejas", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { id: "confirmar", label: "Confirmar", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

type StepId = "fecha" | "galpones" | "huevos" | "bandejas" | "confirmar";

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
  const pathname = usePathname();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [currentStep, setCurrentStep] = useState<StepId>("fecha");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
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

  const loadData = useCallback(async () => {
    setLoading(true);
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
      await productionService.createReport({
        fecha,
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
      });
      alert("Reporte guardado exitosamente");
      // Reset form
      setDetalles(detalles.map((d) => ({ ...d, mortalidad: 0, produccion: 0, alimentoEntrada: 0, alimentoConsumo: 0 })));
      setProducciones(producciones.map((p) => ({ ...p, cantidad: 0, salida: 0, saldo: 0 })));
      setBandejas(bandejas.map((b) => ({ ...b, entradas: 0, salidas: 0, saldoAnterior: 0, saldoBodega: 0 })));
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
        return !!fecha;
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

  return (
    <div className={cn("min-h-screen bg-gray-50", isMobile ? "pb-20" : "")}>
      {isMobile && (
        <MobileHeader
          title="Nuevo Reporte"
          onMenuClick={() => {}}
          user={undefined}
        />
      )}

      <main className={cn("pt-14 pb-20 px-4 sm:px-6 lg:px-8", isMobile ? "max-w-md mx-auto" : "max-w-4xl mx-auto")}>
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
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar fecha</Label>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className={cn("h-12 text-lg", isMobile && "w-full")}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Los datos se guardarán para el día seleccionado. No se puede elegir una fecha futura.
                  </p>
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
                  <span className="text-sm font-normal text-gray-500">{detalles.length} galpones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
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
                  <HuevosSection data={producciones} onUpdate={updateProduccion} isMobile={isMobile} />
                )}
              </CardContent>
            </Card>
          </StepContent>

          {/* Step 4: Bandejas */}
          <StepContent step={3} currentStep={STEPS.findIndex((s) => s.id === currentStep)}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Inventario de Bandejas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <BandejasSection data={bandejas} onUpdate={updateBandeja} isMobile={isMobile} />
              </CardContent>
            </Card>
          </StepContent>

          {/* Step 5: Confirmar */}
          <StepContent step={4} currentStep={STEPS.findIndex((s) => s.id === currentStep)}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Confirmar Reporte</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Fecha</p>
                      <p className="font-medium">{new Date(fecha).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Galpones con datos</p>
                      <p className="font-medium">{detalles.filter((d) => d.mortalidad > 0 || d.produccion > 0 || d.alimentoEntrada > 0).length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total producción</p>
                      <p className="font-medium text-green-700">{detalles.reduce((s, d) => s + d.produccion, 0).toLocaleString()} huevos</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total mortalidad</p>
                      <p className="font-medium text-red-700">{detalles.reduce((s, d) => s + d.mortalidad, 0).toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Huevos clasificados</p>
                      <p className="font-medium">{producciones.reduce((s, p) => s + p.cantidad, 0).toLocaleString()} unidades</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Bandejas movidas</p>
                      <p className="font-medium">{bandejas.reduce((s, b) => s + b.entradas + b.salidas, 0).toLocaleString()} unidades</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
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
          <div className="flex justify-between mt-6 sticky bottom-0 bg-white/80 backdrop-blur-sm py-4 border-t border-gray-100">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === "fecha"}>
              Anterior
            </Button>
            <div className="flex gap-3">
              {currentStep !== "confirmar" ? (
                <Button onClick={nextStep} disabled={!canGoNext()}>
                  Siguiente
                </Button>
              ) : (
                <SaveButton onClick={handleSubmit} loading={saving} label="Guardar Reporte" />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Footer */}
      {isMobile && (
        <StickyFooter>
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
                <SaveButton onClick={handleSubmit} loading={saving} label="Guardar Reporte" className="flex-1" />
              )}
            </div>
            {currentStep === "confirmar" && hasAnyData() && (
              <p className="text-center text-xs text-gray-500">
                Se guardará para {detalles.length} galpones • {producciones.reduce((s, p) => s + p.cantidad, 0).toLocaleString()} huevos
              </p>
            )}
          </div>
        </StickyFooter>
      )}

      {/* Bottom Nav Mobile */}
      {isMobile && (
        <BottomNav
          userRole="GALPONERO"
          userName="Juan"
        />
      )}
    </div>
  );
}