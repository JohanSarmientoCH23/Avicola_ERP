import { processSheet, SheetProcessResult } from './base.processor';

export interface SiloRow {
  fecha: Date | null;
  silo: string;
  galpon: string;
  saldoInicialKg: number;
  entradasKg: number;
  consumoKg: number;
  saldoFinalKg: number;
  saldoInicialBultos: number;
  entradasBultos: number;
  consumoBultos: number;
  saldoFinalBultos: number;
  observaciones?: string;
  rowIndex: number;
}

export function processSilos(sheetName: string, sheetData: any[][]): SheetProcessResult & { registros: SiloRow[] } {
  const base = processSheet(sheetName, sheetData, 'silos_alimento');
  const registros: SiloRow[] = [];

  for (const row of base.rows) {
    const d = row.data;

    const galpon = d['galpon'] ? String(d['galpon']).toUpperCase().trim() : '';
    const silo = d['silo'] ? String(d['silo']) : '';

    const saldoInicialKg = Number(d['saldo_anterior']) || 0;
    const entradasKg = Number(d['entradas']) || 0;
    const consumoKg = Number(d['consumo']) || 0;
    const saldoFinalKg = saldoInicialKg + entradasKg - consumoKg;

    const bultos = Number(d['bultos']) || 0;
    const factorConversion = 50;

    if (!galpon && !silo) continue;

    registros.push({
      fecha: d['fecha'] || null,
      silo,
      galpon,
      saldoInicialKg,
      entradasKg,
      consumoKg,
      saldoFinalKg,
      saldoInicialBultos: Math.round(saldoInicialKg / factorConversion),
      entradasBultos: bultos,
      consumoBultos: Math.round(consumoKg / factorConversion),
      saldoFinalBultos: Math.round(saldoFinalKg / factorConversion),
      observaciones: d['novedades'] ? String(d['novedades']) : undefined,
      rowIndex: row.rowIndex,
    });
  }

  return { ...base, registros };
}
