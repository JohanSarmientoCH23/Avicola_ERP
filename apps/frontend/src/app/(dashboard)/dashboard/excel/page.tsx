"use client";

import { useState } from "react";
import { excelService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) { setFile(selected); setResult(null); }
  };

  const importExcel = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await excelService.importExcel(formData);
      setResult(response.data);
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Importar Excel</h1>
        <p className="text-muted-foreground text-sm">Cargue el archivo Excel del responsable de producción</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cargar Archivo Excel</CardTitle>
          <CardDescription>Formatos aceptados: .xlsx, .xls, .csv</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="excelInput" />
            <label htmlFor="excelInput" className="cursor-pointer">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-muted-foreground">Seleccione el archivo Excel</p>
              {file && <p className="mt-2 text-sm font-medium">{file.name}</p>}
            </label>
          </div>
          <Button onClick={importExcel} disabled={!file || loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? "Importando..." : "Importar Datos"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Datos Importados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm font-medium text-green-700">Archivo: {result.reporte?.nombreArchivo}</p>
              <p className="text-sm text-green-600">Fecha: {result.reporte?.fecha}</p>
              <p className="text-sm text-green-600">Hojas encontradas: {result.hojas?.join(", ")}</p>
            </div>
            {result.datosParseados?.galpones?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Galpones detectados:</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr><th className="p-2 text-left">Galpón</th><th className="p-2 text-right">Consumo</th><th className="p-2 text-right">Entrada</th><th className="p-2 text-right">Producción</th><th className="p-2 text-right">Mortalidad</th></tr>
                  </thead>
                  <tbody>
                    {result.datosParseados.galpones.map((g: any, i: number) => (
                      <tr key={i} className="border-t"><td className="p-2">{g.codigo}</td><td className="p-2 text-right">{g.consumo}</td><td className="p-2 text-right">{g.alimentoEntrada}</td><td className="p-2 text-right">{g.produccion}</td><td className="p-2 text-right">{g.mortalidad}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
