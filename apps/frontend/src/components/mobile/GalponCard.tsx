"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GalponData {
  galponId: string;
  codigo: string;
  gallinas: number;
  mortalidad: number;
  produccion: number;
  alimentoEntrada: number;
  alimentoConsumo: number;
}

interface GalponCardProps {
  data: GalponData;
  index: number;
  onUpdate: (index: number, field: string, value: number) => void;
  expanded?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function GalponCard({
  data,
  index,
  onUpdate,
  expanded = false,
  onToggle,
  isMobile = false,
}: GalponCardProps) {
  const [localExpanded, setLocalExpanded] = useState(expanded);

  const handleToggle = () => {
    setLocalExpanded(!localExpanded);
    onToggle?.();
  };

  const hasData = data.mortalidad > 0 || data.produccion > 0 || data.alimentoEntrada > 0;

  const handleChange = (field: string, value: string | number) => {
    const numValue = typeof value === "string" ? parseInt(value) || 0 : value;
    onUpdate(index, field, numValue);
  };

  if (isMobile) {
    return (
      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          aria-expanded={localExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="text-green-700 font-bold text-sm">{data.codigo}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Galpón {data.codigo}</p>
              <p className="text-xs text-gray-500">{data.gallinas.toLocaleString()} gallinas</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {data.produccion > 0 && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full">
                🥚 {data.produccion.toLocaleString()}
              </span>
            )}
            {data.mortalidad > 0 && (
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full">
                ☠️ {data.mortalidad.toLocaleString()}
              </span>
            )}
            <svg
              className={cn("w-5 h-5 text-gray-400 transition-transform", localExpanded && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {localExpanded && (
          <div className="p-4 space-y-4 bg-white animate-slide-down">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 block mb-1">Mortalidad</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={data.mortalidad}
                  onChange={(e) => handleChange("mortalidad", e.target.value)}
                  className="text-right h-11 text-lg"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 block mb-1">Producción</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={data.produccion}
                  onChange={(e) => handleChange("produccion", e.target.value)}
                  className="text-right h-11 text-lg"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 block mb-1">Alimento Ent. (kg)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={data.alimentoEntrada}
                  onChange={(e) => handleChange("alimentoEntrada", e.target.value)}
                  className="text-right h-11 text-lg"
                  min={0}
                  step={0.1}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 block mb-1">Alimento Cons. (kg)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={data.alimentoConsumo}
                  onChange={(e) => handleChange("alimentoConsumo", e.target.value)}
                  className="text-right h-11 text-lg"
                  min={0}
                  step={0.1}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 block mb-1">Gallinas actuales</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={data.gallinas}
                onChange={(e) => handleChange("gallinas", e.target.value)}
                className="text-right h-11 text-lg w-full"
                min={0}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <tr className={cn("table-row", hasData && "bg-green-25")}>
      <td className="p-3 font-medium text-gray-800">{data.codigo}</td>
      <td className="p-2">
        <Input
          type="number"
          inputMode="numeric"
          value={data.mortalidad}
          onChange={(e) => handleChange("mortalidad", e.target.value)}
          className="text-right h-9"
          min={0}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          inputMode="numeric"
          value={data.produccion}
          onChange={(e) => handleChange("produccion", e.target.value)}
          className="text-right h-9"
          min={0}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          inputMode="decimal"
          value={data.alimentoEntrada}
          onChange={(e) => handleChange("alimentoEntrada", e.target.value)}
          className="text-right h-9"
          min={0}
          step={0.1}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          inputMode="decimal"
          value={data.alimentoConsumo}
          onChange={(e) => handleChange("alimentoConsumo", e.target.value)}
          className="text-right h-9"
          min={0}
          step={0.1}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          inputMode="numeric"
          value={data.gallinas}
          onChange={(e) => handleChange("gallinas", e.target.value)}
          className="text-right h-9"
          min={0}
        />
      </td>
    </tr>
  );
}