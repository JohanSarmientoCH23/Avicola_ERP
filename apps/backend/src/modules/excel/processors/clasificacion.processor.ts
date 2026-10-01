import { processSheet, SheetProcessResult } from './base.processor';
import { normalizeEggType } from '../normalizer';

export interface ClasificacionRow {
  fecha: Date | null;
  galpon: string;
  jumbo: number;
  extra: number;
  aa: number;
  a: number;
  b: number;
  revoltura: number;
  c: number;
  pipo: number;
  blanco: number;
  sucio: number;
  roto: number;
  yemas: number;
  total: number;
  rowIndex: number;
}

export function processClasificacion(sheetName: string, sheetData: any[][]): SheetProcessResult & { registros: ClasificacionRow[] } {
  const base = processSheet(sheetName, sheetData, 'clasificacion');
  const registros: ClasificacionRow[] = [];

  const EGG_FIELDS = ['jumbo', 'extra', 'aa', 'a', 'b', 'revoltura', 'c', 'pipo', 'blanco', 'sucio', 'roto', 'yemas'];

  for (const row of base.rows) {
    const d = row.data;

    const galpon = d['galpon'] ? String(d['galpon']).toUpperCase().trim() : '';
    if (!galpon) continue;

    let total = 0;
    const eggCounts: Record<string, number> = {};

    for (const field of EGG_FIELDS) {
      const val = Number(d[field]) || 0;
      eggCounts[field] = val;
      total += val;
    }

    const extraFromHeaders = extractEggFromHeaders(d, base.headers);
    for (const [key, val] of Object.entries(extraFromHeaders)) {
      if (!eggCounts[key] || eggCounts[key] === 0) {
        eggCounts[key] = val;
        total += val;
      }
    }

    registros.push({
      fecha: d['fecha'] || null,
      galpon,
      jumbo: eggCounts['jumbo'] || 0,
      extra: eggCounts['extra'] || 0,
      aa: eggCounts['aa'] || 0,
      a: eggCounts['a'] || 0,
      b: eggCounts['b'] || 0,
      revoltura: eggCounts['revoltura'] || 0,
      c: eggCounts['c'] || 0,
      pipo: eggCounts['pipo'] || 0,
      blanco: eggCounts['blanco'] || 0,
      sucio: eggCounts['sucio'] || 0,
      roto: eggCounts['roto'] || 0,
      yemas: eggCounts['yemas'] || 0,
      total,
      rowIndex: row.rowIndex,
    });
  }

  return { ...base, registros };
}

function extractEggFromHeaders(data: Record<string, any>, headers: Record<number, string>): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [colIdx, fieldName] of Object.entries(headers)) {
    const normalized = normalizeEggType(fieldName);
    if (normalized && data[fieldName] !== undefined) {
      const val = Number(data[fieldName]) || 0;
      if (val > 0 && (!result[normalized] || result[normalized] === 0)) {
        result[normalized] = val;
      }
    }
  }

  return result;
}
