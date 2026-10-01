import { processSheet, SheetProcessResult } from './base.processor';

export interface AveRow {
  fecha: Date | null;
  galpon: string;
  gallinas: number;
  mortalidad: number;
  ventas: number;
  saldoFinal: number;
  observaciones?: string;
  rowIndex: number;
}

export function processAves(sheetName: string, sheetData: any[][]): SheetProcessResult & { registros: AveRow[] } {
  const base = processSheet(sheetName, sheetData, 'aves');
  const registros: AveRow[] = [];

  for (const row of base.rows) {
    const d = row.data;

    const galpon = d['galpon'] ? String(d['galpon']).toUpperCase().trim() : '';
    if (!galpon) continue;

    const gallinas = Number(d['gallinas'] || d['gallinas_fin']) || 0;
    const mortalidad = Number(d['mortalidad']) || 0;
    const ventas = Number(d['salidas']) || 0;
    const entradas = Number(d['entradas']) || 0;
    const saldoFinal = gallinas > 0 ? gallinas - mortalidad - ventas + entradas : 0;

    registros.push({
      fecha: d['fecha'] || null,
      galpon,
      gallinas,
      mortalidad,
      ventas,
      saldoFinal,
      observaciones: d['novedades'] ? String(d['novedades']) : undefined,
      rowIndex: row.rowIndex,
    });
  }

  return { ...base, registros };
}
