"use client";

import { useState, useEffect } from "react";
import { reconciliationService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReconciliationPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [conciliaciones, setConciliaciones] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadConciliaciones(); }, []);

  const loadConciliaciones = async () => {
    try {
      const response = await reconciliationService.getAll({ page: 1, limit: 20 });
      setConciliaciones(response.data?.data || []);
    } catch (error) { console.error(error); }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const response = await reconciliationService.generate(fecha);
      setSelected(response.data);
      loadConciliaciones();
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    try {
      await reconciliationService.approve(id);
      alert("Conciliación aprobada");
      loadConciliaciones();
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Conciliación Contable</h1>
          <p className="text-muted-foreground text-sm">Generación automática de conciliación diaria</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full sm:w-40" />
          <Button onClick={generate} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Generando..." : "Generar"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conciliaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-center">Estado</th>
                  <th className="p-2 text-right">Detalles</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {conciliaciones.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(c.fecha).toLocaleDateString()}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.estado === 'APROBADA' ? 'bg-green-100 text-green-700' :
                        c.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{c.estado}</span>
                    </td>
                    <td className="p-2 text-right">{c._count?.detalles || 0} registros</td>
                    <td className="p-2 text-center">
                      {c.estado === 'PENDIENTE' && (
                        <Button size="sm" onClick={() => approve(c.id)} className="bg-green-600 hover:bg-green-700">Aprobar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Conciliación - {new Date(selected.fecha).toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="p-2 text-left">Concepto</th>
                    <th className="p-2 text-right">Valor Imagen</th>
                    <th className="p-2 text-right">Valor Excel</th>
                    <th className="p-2 text-right">Diferencia</th>
                    <th className="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.detalles?.map((d: any, i: number) => (
                    <tr key={i} className={`border-b ${
                      d.estado === 'ERROR' ? 'bg-red-50 dark:bg-red-900/20' :
                      d.estado === 'REVISAR' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                    }`}>
                      <td className="p-2">{d.concepto}</td>
                      <td className="p-2 text-right">{Number(d.valorImagen).toLocaleString()}</td>
                      <td className="p-2 text-right">{Number(d.valorExcel).toLocaleString()}</td>
                      <td className={`p-2 text-right font-medium ${Number(d.diferencia) !== 0 ? 'text-red-600' : ''}`}>{Number(d.diferencia).toLocaleString()}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          d.estado === 'CORRECTO' ? 'bg-green-100 text-green-700' :
                          d.estado === 'REVISAR' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{d.estado === 'CORRECTO' ? '🟢' : d.estado === 'REVISAR' ? '🟡' : '🔴'}</span>
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
