import { processSheet, SheetProcessResult } from './base.processor';

export interface DespachoRow {
  fecha: Date | null;
  galpon: string;
  tipoHuevo: string;
  cantidad: number;
  destino: string;
  guia?: string;
  observaciones?: string;
  rowIndex: number;
}

export function processDespachos(sheetName: string, sheetData: any[][]): SheetProcessResult & { registros: DespachoRow[] } {
  const base = processSheet(sheetName, sheetData, 'despachos');
  const registros: DespachoRow[] = [];

  for (const row of base.rows) {
    const d = row.data;

    const galpon = d['galpon'] ? String(d['galpon']).toUpperCase().trim() : '';
    const tipoHuevo = d['tipo'] ? String(d['tipo']).toUpperCase().trim() : '';
    const cantidad = Number(d['produccion'] || d['entradas'] || d['cantidad']) || 0;

    if (!tipoHuevo && cantidad === 0) continue;

    registros.push({
      fecha: d['fecha'] || null,
      galpon,
      tipoHuevo,
      cantidad,
      destino: d['destino'] ? String(d['destino']) : '',
      guia: d['guia'] ? String(d['guia']) : undefined,
      observaciones: d['novedades'] ? String(d['novedades']) : undefined,
      rowIndex: row.rowIndex,
    });
  }

  return { ...base, registros };
}
