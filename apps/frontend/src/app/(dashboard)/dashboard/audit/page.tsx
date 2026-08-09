"use client";

import { useState, useEffect } from "react";
import { auditService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAuditoria(); }, []);

  const loadAuditoria = async () => {
    try {
      const response = await auditService.getAll({ page: 1, limit: 50 });
      setRegistros(response.data?.data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoría del Sistema</h1>
        <p className="text-muted-foreground">Registro de todas las acciones realizadas en el sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="p-2 text-left">Fecha/Hora</th>
                  <th className="p-2 text-left">Usuario</th>
                  <th className="p-2 text-left">Acción</th>
                  <th className="p-2 text-left">Entidad</th>
                  <th className="p-2 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-2">{r.usuario?.nombre} {r.usuario?.apellido}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.accion === 'LOGIN' ? 'bg-blue-100 text-blue-700' :
                        r.accion === 'LOGOUT' ? 'bg-gray-100 text-gray-700' :
                        r.accion === 'CREATE' ? 'bg-green-100 text-green-700' :
                        r.accion === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{r.accion}</span>
                    </td>
                    <td className="p-2">{r.entidad} {r.entidadId ? `(${r.entidadId?.slice(0, 8)}...)` : ''}</td>
                    <td className="p-2 text-muted-foreground">{r.ip || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {registros.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">No hay registros de auditoría</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
