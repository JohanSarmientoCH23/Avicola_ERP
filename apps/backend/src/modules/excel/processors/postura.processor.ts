import { processSheet, SheetProcessResult } from './base.processor';

export interface PosturaRow {
  fecha: Date | null;
  galpon: string;
  gallinas: number;
  produccion: number;
  consumo: number;
  mortalidad: number;
  porcentajePostura: number;
  observaciones?: string;
  rowIndex: number;
}

export function processPostura(sheetName: string, sheetData: any[][]): SheetProcessResult & { registros: PosturaRow[] } {
  const base = processSheet(sheetName, sheetData, 'postura');
  const registros: PosturaRow[] = [];

  for (const row of base.rows) {
    const d = row.data;

    const galpon = d['galpon'] ? String(d['galpon']).toUpperCase().trim() : '';
    if (!galpon) continue;

    const gallinas = Number(d['gallinas']) || 0;
    const produccion = Number(d['produccion']) || 0;
    const consumo = Number(d['consumo']) || 0;
    const mortalidad = Number(d['mortalidad']) || 0;
    const porcentajePostura = gallinas > 0 ? (produccion / gallinas) * 100 : 0;

    registros.push({
      fecha: d['fecha'] || null,
      galpon,
      gallinas,
      produccion,
      consumo,
      mortalidad,
      porcentajePostura: Math.round(porcentajePostura * 100) / 100,
      observaciones: d['novedades'] ? String(d['novedades']) : undefined,
      rowIndex: row.rowIndex,
    });
  }

  return { ...base, registros };
}
