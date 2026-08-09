"use client";

import { useState, useEffect } from "react";
import { comparisonService, productionService, excelService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ComparisonPage() {
  const [reportesOcr, setReportesOcr] = useState<any[]>([]);
  const [reportesExcel, setReportesExcel] = useState<any[]>([]);
  const [selectedOcr, setSelectedOcr] = useState("");
  const [selectedExcel, setSelectedExcel] = useState("");
  const [comparacion, setComparacion] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      const [ocrRes, excelRes] = await Promise.all([
        productionService.getReports({ limit: 50 }),
        excelService.getReportes(50),
      ]);
      setReportesOcr(ocrRes.data?.data || []);
      setReportesExcel(Array.isArray(excelRes.data) ? excelRes.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const compare = async () => {
    if (!selectedOcr || !selectedExcel) return;
    setLoading(true);
    try {
      const response = await comparisonService.compare({
        reporteOcrId: selectedOcr,
        reporteExcelId: selectedExcel,
      });
      setComparacion(response.data);
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Motor de Comparacion</h1>
        <p className="text-muted-foreground">Compare el reporte OCR vs el archivo Excel del responsable</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Reportes a Comparar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Reporte OCR/Manual</label>
              <select className="w-full border rounded-lg p-2 mt-1" value={selectedOcr} onChange={(e) => setSelectedOcr(e.target.value)}>
                <option value="">Seleccionar reporte...</option>
                {reportesOcr.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.fecha).toLocaleDateString()} - {r.galponero?.nombre} ({r.fuente})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Reporte Excel</label>
              <select className="w-full border rounded-lg p-2 mt-1" value={selectedExcel} onChange={(e) => setSelectedExcel(e.target.value)}>
                <option value="">Seleccionar archivo...</option>
                {reportesExcel.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.fecha).toLocaleDateString()} - {r.nombreArchivo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={compare} disabled={!selectedOcr || !selectedExcel || loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Comparando..." : "Ejecutar Comparacion"}
          </Button>
        </CardContent>
      </Card>

      {comparacion && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado de Comparacion</CardTitle>
            <div className="flex gap-4 mt-2">
              <span className="text-sm">Total campos: <strong>{comparacion.comparacion?.totalCampos}</strong></span>
              <span className="text-sm text-green-600">Correctos: <strong>{comparacion.comparacion?.camposCorrectos}</strong></span>
              <span className="text-sm text-red-600">Con error: <strong>{comparacion.comparacion?.camposConError}</strong></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="p-2 text-left">Galpon</th>
                    <th className="p-2 text-left">Campo</th>
                    <th className="p-2 text-right">Valor OCR</th>
                    <th className="p-2 text-right">Valor Excel</th>
                    <th className="p-2 text-right">Diferencia</th>
                    <th className="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {comparacion.detallesGalpon?.map((d: any, i: number) => (
                    <tr key={i} className={`border-b ${d.estado === "ERROR" ? "bg-red-50 dark:bg-red-900/20" : d.estado === "REVISAR" ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}>
                      <td className="p-2">{d.galpon}</td>
                      <td className="p-2">{d.campo}</td>
                      <td className="p-2 text-right">{d.valorOcr?.toLocaleString()}</td>
                      <td className="p-2 text-right">{d.valorExcel?.toLocaleString()}</td>
                      <td className={`p-2 text-right font-medium ${d.diferencia > 0 ? "text-red-600" : d.diferencia < 0 ? "text-blue-600" : ""}`}>
                        {d.diferencia?.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.estado === "CORRECTO" ? "bg-green-100 text-green-700" : d.estado === "REVISAR" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {d.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
