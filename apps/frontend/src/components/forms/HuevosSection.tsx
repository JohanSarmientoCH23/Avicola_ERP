"use client";

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
  totalGalpones?: number;
}

export function HuevosSection({ data, onUpdate, isMobile = false, totalGalpones }: HuevosSectionProps) {
  const handleChange = (index: number, field: keyof HuevoFormData, value: string | number) => {
    const numValue = typeof value === "string" ? parseInt(value) || 0 : value;
    onUpdate(index, field, numValue);
  };

  const totalDetalle = data.reduce((s, p) => s + Number(p.cantidad || 0), 0);
  const baseGalpones = typeof totalGalpones === "number" ? totalGalpones : 0;
  const totalPostura = baseGalpones + totalDetalle;
  const showReferencia = baseGalpones > 0;

  const referencia = showReferencia ? (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800"
      role="status"
    >
      <span>Postura galpones: <b className="tabular-nums">{baseGalpones.toLocaleString()}</b></span>
      <span>+ Detalle: <b className="tabular-nums">{totalDetalle.toLocaleString()}</b></span>
      <span>= Total: <b className="tabular-nums">{totalPostura.toLocaleString()}</b></span>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div className="space-y-2" role="region" aria-label="Clasificación de huevos">
        {referencia}
        {data.map((p, i) => (
          <div key={p.tipoHuevoId} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
            <p className="font-medium text-gray-800 mb-2 flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{p.codigo}</span>
              {p.nombre}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumpadInput label="Postura" value={p.cantidad} onChange={(v) => handleChange(i, "cantidad", v)} min={0} step={1} compact showStepper={false} />
              <NumpadInput label="Salida" value={p.salida} onChange={(v) => handleChange(i, "salida", v)} min={0} step={1} compact showStepper={false} />
              <NumpadInput label="Saldo" value={p.saldo} onChange={(v) => handleChange(i, "saldo", v)} min={0} step={1} compact showStepper={false} />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
          <span className="font-bold text-green-800 text-sm">TOTAL (uds)</span>
          <div className="flex gap-3 text-xs font-bold">
            <span>Post: {totalPostura.toLocaleString()}</span>
            <span>Sal: {data.reduce((s, p) => s + p.salida, 0).toLocaleString()}</span>
            <span>Saldo: {data.reduce((s, p) => s + p.saldo, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {referencia}
      <div className="overflow-x-auto -mx-1" role="region" aria-label="Tabla de clasificación de huevos">
        <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-2 text-left font-medium text-gray-600">Tipo de huevo</th>
            <th className="p-2 text-right font-medium text-gray-600">Postura del día</th>
            <th className="p-2 text-right font-medium text-gray-600">Salida del día</th>
            <th className="p-2 text-right font-medium text-gray-600">Saldo del día</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.tipoHuevoId} className="border-b border-gray-100 hover:bg-gray-25">
              <td className="p-2 font-medium text-gray-800">
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{p.codigo}</span>
                  {p.nombre}
                </span>
              </td>
              <td className="p-1.5 w-[120px]"><NumpadInput value={p.cantidad} onChange={(v) => handleChange(i, "cantidad", v)} min={0} step={1} compact showStepper={false} className="w-full" /></td>
              <td className="p-1.5 w-[120px]"><NumpadInput value={p.salida} onChange={(v) => handleChange(i, "salida", v)} min={0} step={1} compact showStepper={false} className="w-full" /></td>
              <td className="p-1.5 w-[120px]"><NumpadInput value={p.saldo} onChange={(v) => handleChange(i, "saldo", v)} min={0} step={1} compact showStepper={false} className="w-full" /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50 border-t-2 border-gray-200">
            <td className="p-2">TOTAL</td>
            <td className="p-2 text-right tabular-nums">{totalPostura.toLocaleString()}</td>
            <td className="p-2 text-right tabular-nums">{data.reduce((s, p) => s + Number(p.salida || 0), 0).toLocaleString()}</td>
            <td className="p-2 text-right tabular-nums">{data.reduce((s, p) => s + Number(p.saldo || 0), 0).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}
