"use client";

import { cn } from "@/lib/utils";
import { NumpadInput } from "@/components/mobile/NumpadInput";

interface BandejaFormData {
  tipo: "AA" | "A" | "B";
  entradas: number;
  salidas: number;
  saldoAnterior: number;
  saldoBodega: number;
}

interface BandejasSectionProps {
  data: BandejaFormData[];
  onUpdate: (index: number, field: keyof BandejaFormData, value: number) => void;
  isMobile?: boolean;
}

export function BandejasSection({ data, onUpdate, isMobile = false }: BandejasSectionProps) {
  const handleChange = (index: number, field: keyof BandejaFormData, value: string | number) => {
    const numValue = typeof value === "string" ? parseInt(value) || 0 : value;
    onUpdate(index, field, numValue);
  };

  if (isMobile) {
    return (
      <div className="space-y-3" role="region" aria-label="Inventario de bandejas">
        {data.map((b, i) => (
          <div key={b.tipo} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-bold",
                b.tipo === "AA" && "bg-purple-100 text-purple-700",
                b.tipo === "A" && "bg-blue-100 text-blue-700",
                b.tipo === "B" && "bg-gray-100 text-gray-700"
              )}>
                Bandeja {b.tipo}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumpadInput label="Entradas" value={b.entradas} onChange={(v) => handleChange(i, "entradas", v)} min={0} step={1} suffix="uds" />
              <NumpadInput label="Salidas" value={b.salidas} onChange={(v) => handleChange(i, "salidas", v)} min={0} step={1} suffix="uds" />
              <NumpadInput label="Saldo Anterior" value={b.saldoAnterior} onChange={(v) => handleChange(i, "saldoAnterior", v)} min={0} step={1} suffix="uds" />
              <NumpadInput label="Saldo Bodega" value={b.saldoBodega} onChange={(v) => handleChange(i, "saldoBodega", v)} min={0} step={1} suffix="uds" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" role="region" aria-label="Tabla de inventario de bandejas">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-3 text-left font-medium text-gray-600">Tipo</th>
            <th className="p-3 text-right font-medium text-gray-600">Entradas</th>
            <th className="p-3 text-right font-medium text-gray-600">Salidas</th>
            <th className="p-3 text-right font-medium text-gray-600">Saldo Ant.</th>
            <th className="p-3 text-right font-medium text-gray-600">Saldo Bodega</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b, i) => (
            <tr key={b.tipo} className="border-b border-gray-100 hover:bg-gray-25">
              <td className="p-3 font-medium text-gray-800">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold",
                  b.tipo === "AA" && "bg-purple-100 text-purple-700",
                  b.tipo === "A" && "bg-blue-100 text-blue-700",
                  b.tipo === "B" && "bg-gray-100 text-gray-700"
                )}>
                  {b.tipo}
                </span>
              </td>
              <td className="p-2"><NumpadInput value={b.entradas} onChange={(v) => handleChange(i, "entradas", v)} min={0} step={1} className="w-full" /></td>
              <td className="p-2"><NumpadInput value={b.salidas} onChange={(v) => handleChange(i, "salidas", v)} min={0} step={1} className="w-full" /></td>
              <td className="p-2"><NumpadInput value={b.saldoAnterior} onChange={(v) => handleChange(i, "saldoAnterior", v)} min={0} step={1} className="w-full" /></td>
              <td className="p-2"><NumpadInput value={b.saldoBodega} onChange={(v) => handleChange(i, "saldoBodega", v)} min={0} step={1} className="w-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}