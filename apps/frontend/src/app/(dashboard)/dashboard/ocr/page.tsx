"use client";

import { useState } from "react";
import { ocrService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const processImage = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await ocrService.processImage(formData);
      setResult(response.data);
    } catch (error: any) {
      alert("Error procesando imagen: " + (error.response?.data?.message || error.message));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">OCR - Reconocimiento de Imagen</h1>
        <p className="text-muted-foreground">Cargue la foto del formato del galponero para extraer datos automáticamente</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cargar Imagen</CardTitle>
            <CardDescription>Formatos aceptados: JPG, PNG, HEIC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileInput" />
              <label htmlFor="fileInput" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">Haga clic para seleccionar una imagen</p>
              </label>
            </div>
            {preview && <img src={preview} alt="Vista previa" className="w-full rounded-lg border" />}
            <Button onClick={processImage} disabled={!file || loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading ? "Procesando OCR..." : "Procesar Imagen"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado OCR</CardTitle>
            <CardDescription>Datos extraídos de la imagen</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Fecha detectada: {result.datosParseados?.fecha || "No detectada"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Galpones detectados:</h4>
                  {result.datosParseados?.galpones?.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b"><th className="p-1 text-left">Galpón</th><th className="p-1 text-right">Mort.</th><th className="p-1 text-right">Prod.</th><th className="p-1 text-right">Consumo</th></tr>
                      </thead>
                      <tbody>
                        {result.datosParseados.galpones.map((g: any, i: number) => (
                          <tr key={i} className="border-b"><td className="p-1">{g.codigo}</td><td className="p-1 text-right">{g.mortalidad}</td><td className="p-1 text-right">{g.postura}</td><td className="p-1 text-right">{g.alimentoConsumo}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="text-sm text-muted-foreground">No se detectaron galpones</p>}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Texto original OCR:</h4>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap">{result.textoOriginal}</pre>
                </div>
                <Button variant="outline" className="w-full" disabled>Los datos se guardan automaticamente al procesar</Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Cargue una imagen y procese para ver resultados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
