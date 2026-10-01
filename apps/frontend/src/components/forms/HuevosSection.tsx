"use client";

import { cn } from "@/lib/utils";
import { NumpadInput } from "@/components/mobile/NumpadInput";

interface HuevoFormData {
  tipoHuevoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  salida: number;
  saldo: number;
}

interface HuevosSectionProps {
  data: HuevoFormData[];
  onUpdate: (index: number, field: keyof HuevoFormData, value: number) => void;
  isMobile?: boolean;
}

export function HuevosSection({ data, onUpdate, isMobile = false }: HuevosSectionProps) {
  const handleChange = (index: number, field: keyof HuevoFormData, value: string | number) => {
    const numValue = typeof value === "string" ? parseInt(value) || 0 : value;
    onUpdate(index, field, numValue);
  };

  if (isMobile) {
    return (
      <div className="space-y-3" role="region" aria-label="Clasificación de huevos">
        {data.map((p, i) => (
          <div key={p.tipoHuevoId} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
            <p className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{p.codigo}</span>
              {p.nombre}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumpadInput label="Cantidad" value={p.cantidad} onChange={(v) => handleChange(i, "cantidad", v)} min={0} step={1} suffix="uds" />
              <NumpadInput label="Salida" value={p.salida} onChange={(v) => handleChange(i, "salida", v)} min={0} step={1} suffix="uds" />
              <NumpadInput label="Saldo" value={p.saldo} onChange={(v) => handleChange(i, "saldo", v)} min={0} step={1} suffix="uds" />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
          <span className="font-bold text-green-800">TOTAL</span>
          <div className="flex gap-4 text-sm font-bold">
            <span>Cant: {data.reduce((s, p) => s + p.cantidad, 0).toLocaleString()}</span>
            <span>Sal: {data.reduce((s, p) => s + p.salida, 0).toLocaleString()}</span>
            <span>Saldo: {data.reduce((s, p) => s + p.saldo, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" role="region" aria-label="Tabla de clasificación de huevos">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-3 text-left font-medium text-gray-600">Tipo</th>
            <th className="p-3 text-right font-medium text-gray-600">Cantidad</th>
            <th className="p-3 text-right font-medium text-gray-600">Salida</th>
            <th className="p-3 text-right font-medium text-gray-600">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.tipoHuevoId} className="border-b border-gray-100 hover:bg-gray-25">
              <td className="p-3 font-medium text-gray-800">
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{p.codigo}</span>
                  {p.nombre}
                </span>
              </td>
              <td className="p-2"><NumpadInput value={p.cantidad} onChange={(v) => handleChange(i, "cantidad", v)} min={0} step={1} className="w-full" /></td>
              <td className="p-2"><NumpadInput value={p.salida} onChange={(v) => handleChange(i, "salida", v)} min={0} step={1} className="w-full" /></td>
              <td className="p-2"><NumpadInput value={p.saldo} onChange={(v) => handleChange(i, "saldo", v)} min={0} step={1} className="w-full" /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50 border-t-2 border-gray-200">
            <td className="p-3">TOTAL</td>
            <td className="p-3 text-right">{data.reduce((s, p) => s + p.cantidad, 0).toLocaleString()}</td>
            <td className="p-3 text-right">{data.reduce((s, p) => s + p.salida, 0).toLocaleString()}</td>
            <td className="p-3 text-right">{data.reduce((s, p) => s + p.saldo, 0).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}