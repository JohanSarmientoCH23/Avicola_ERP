import { processSheet, SheetProcessResult } from './base.processor';

export interface BultoRow {
  fecha: Date | null;
  galpon: string;
  tipo: string;
  bultos: number;
  peso: number;
  observaciones?: string;
  rowIndex: number;
}

export function processBultos(sheetName: string, sheetData: any[][]): SheetProcessResult & { registros: BultoRow[] } {
  const base = processSheet(sheetName, sheetData, 'bultos_alimento');
  const registros: BultoRow[] = [];

  for (const row of base.rows) {
    const d = row.data;

    const galpon = d['galpon'] ? String(d['galpon']).toUpperCase().trim() : '';
    const tipo = d['tipo'] ? String(d['tipo']) : '';
    const bultos = Number(d['bultos'] || d['entradas']) || 0;
    const peso = Number(d['peso']) || 0;

    if (!galpon && bultos === 0) continue;

    registros.push({
      fecha: d['fecha'] || null,
      galpon,
      tipo,
      bultos,
      peso,
      observaciones: d['novedades'] ? String(d['novedades']) : undefined,
      rowIndex: row.rowIndex,
    });
  }

  return { ...base, registros };
}
