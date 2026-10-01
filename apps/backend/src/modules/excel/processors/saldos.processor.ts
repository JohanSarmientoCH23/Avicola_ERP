import { processSheet, SheetProcessResult } from './base.processor';

export interface SaldoRow {
  fecha: Date | null;
  tipo: string;
  saldoAnterior: number;
  entradas: number;
  salidas: number;
  saldoActual: number;
  observaciones?: string;
  rowIndex: number;
}

export function processSaldos(sheetName: string, sheetData: any[][]): SheetProcessResult & { registros: SaldoRow[] } {
  const base = processSheet(sheetName, sheetData, 'saldos');
  const registros: SaldoRow[] = [];

  for (const row of base.rows) {
    const d = row.data;

    const tipo = d['tipo'] ? String(d['tipo']).toUpperCase().trim() : '';
    const saldoAnterior = Number(d['saldo_anterior'] || d['saldo_bodega']) || 0;
    const entradas = Number(d['entradas']) || 0;
    const salidas = Number(d['salidas']) || 0;
    const saldoActual = saldoAnterior + entradas - salidas;

    if (!tipo && saldoAnterior === 0 && entradas === 0) continue;

    registros.push({
      fecha: d['fecha'] || null,
      tipo,
      saldoAnterior,
      entradas,
      salidas,
      saldoActual,
      observaciones: d['novedades'] ? String(d['novedades']) : undefined,
      rowIndex: row.rowIndex,
    });
  }

  return { ...base, registros };
}
