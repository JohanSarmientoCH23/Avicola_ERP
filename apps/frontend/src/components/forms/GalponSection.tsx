"use client";

import { cn } from "@/lib/utils";
import { NumpadInput } from "@/components/mobile/NumpadInput";

interface GalponFormData {
  galponId: string;
  codigo: string;
  gallinas: number;
  mortalidad: number;
  produccion: number;
  alimentoEntrada: number;
  alimentoConsumo: number;
}

interface GalponSectionProps {
  data: GalponFormData[];
  onUpdate: (index: number, field: keyof GalponFormData, value: number) => void;
  isMobile?: boolean;
  expandedGalpon?: string | null;
  onToggleGalpon?: (galponId: string) => void;
}

export function GalponSection({
  data,
  onUpdate,
  isMobile = false,
  expandedGalpon,
  onToggleGalpon,
}: GalponSectionProps) {
  const handleChange = (index: number, field: keyof GalponFormData, value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    onUpdate(index, field, numValue);
  };

  if (isMobile) {
    return (
      <div className="space-y-3" role="region" aria-label="Galpones">
        {data.map((d, i) => {
          const isExpanded = expandedGalpon === d.galponId;
          const hasData = d.mortalidad > 0 || d.produccion > 0 || d.alimentoEntrada > 0 || d.alimentoConsumo > 0;

          return (
            <div key={d.galponId} className={cn("border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm", hasData && "ring-1 ring-green-200")}>
              <button
                onClick={() => onToggleGalpon?.(d.galponId)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`galpon-${d.galponId}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-bold text-sm">{d.codigo}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Galpón {d.codigo}</p>
                    <p className="text-xs text-gray-500">{d.gallinas.toLocaleString()} gallinas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {d.produccion > 0 && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                      {d.produccion.toLocaleString()}
                    </span>
                  )}
                  {d.mortalidad > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {d.mortalidad.toLocaleString()}
                    </span>
                  )}
                  <svg className={cn("w-5 h-5 text-gray-400 transition-transform", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <div id={`galpon-${d.galponId}`} className={cn("overflow-hidden transition-all duration-300", isExpanded ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0")}>
                <div className="p-4 space-y-3 animate-slide-down">
                  <div className="grid grid-cols-2 gap-3">
                    <NumpadInput
                      label="Mortalidad"
                      value={d.mortalidad}
                      onChange={(v) => handleChange(i, "mortalidad", v)}
                      min={0}
                      step={1}
                      suffix="aves"
                    />
                    <NumpadInput
                      label="Postura (huevos)"
                      value={d.produccion}
                      onChange={(v) => handleChange(i, "produccion", v)}
                      min={0}
                      step={1}
                      suffix="uds"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumpadInput
                      label="Alimento entrada"
                      value={d.alimentoEntrada}
                      onChange={(v) => handleChange(i, "alimentoEntrada", v)}
                      min={0}
                      step={0.1}
                      suffix="kg"
                    />
                    <NumpadInput
                      label="Alimento consumo"
                      value={d.alimentoConsumo}
                      onChange={(v) => handleChange(i, "alimentoConsumo", v)}
                      min={0}
                      step={0.1}
                      suffix="kg"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1" role="region" aria-label="Tabla de galpones">
      <table className="w-full text-sm min-w-[620px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-2 text-left font-medium text-gray-600">Galpón</th>
            <th className="p-2 text-right font-medium text-gray-600">Mort.</th>
            <th className="p-2 text-right font-medium text-gray-600">Alimento entrada (kg)</th>
            <th className="p-2 text-right font-medium text-gray-600">Alimento consumo (kg)</th>
            <th className="p-2 text-right font-medium text-gray-600">Postura (huevos)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => {
            const hasData = d.mortalidad > 0 || d.produccion > 0 || d.alimentoEntrada > 0 || d.alimentoConsumo > 0;
            return (
              <tr key={d.galponId} className={cn("border-b border-gray-100 hover:bg-gray-25", hasData && "bg-green-25")}>
                <td className="p-2">
                  <p className="font-semibold text-gray-800 leading-tight">{d.codigo}</p>
                  <p className="text-[11px] text-gray-400">{d.gallinas.toLocaleString()} gallinas</p>
                </td>
                <td className="p-1.5 w-[92px]">
                  <NumpadInput value={d.mortalidad} onChange={(v) => handleChange(i, "mortalidad", v)} min={0} step={1} compact showStepper={false} className="w-full" />
                </td>
                <td className="p-1.5 w-[130px]">
                  <NumpadInput value={d.alimentoEntrada} onChange={(v) => handleChange(i, "alimentoEntrada", v)} min={0} step={0.1} compact showStepper={false} className="w-full" />
                </td>
                <td className="p-1.5 w-[130px]">
                  <NumpadInput value={d.alimentoConsumo} onChange={(v) => handleChange(i, "alimentoConsumo", v)} min={0} step={0.1} compact showStepper={false} className="w-full" />
                </td>
                <td className="p-1.5 w-[130px]">
                  <NumpadInput value={d.produccion} onChange={(v) => handleChange(i, "produccion", v)} min={0} step={1} compact showStepper={false} className="w-full" />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50 border-t-2 border-gray-200">
            <td className="p-2">TOTAL</td>
            <td className="p-2 text-right tabular-nums">{data.reduce((s, d) => s + Number(d.mortalidad || 0), 0).toLocaleString()}</td>
            <td className="p-2 text-right tabular-nums">{data.reduce((s, d) => s + Number(d.alimentoEntrada || 0), 0).toLocaleString()}</td>
            <td className="p-2 text-right tabular-nums">{data.reduce((s, d) => s + Number(d.alimentoConsumo || 0), 0).toLocaleString()}</td>
            <td className="p-2 text-right tabular-nums">{data.reduce((s, d) => s + Number(d.produccion || 0), 0).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
