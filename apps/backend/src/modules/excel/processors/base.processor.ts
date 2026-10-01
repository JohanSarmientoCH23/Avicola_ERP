import { findHeaderRow, mapRowToHeaders, normalizeText } from '../normalizer';

export interface ProcessedRow {
  data: Record<string, any>;
  rowIndex: number;
  errors: string[];
  warnings: string[];
}

export interface SheetProcessResult {
  sheetName: string;
  sheetType: string;
  headers: Record<number, string>;
  headerRow: number;
  rows: ProcessedRow[];
  validRows: number;
  errorRows: number;
  totalRows: number;
}

export function processSheet(sheetName: string, sheetData: any[][], sheetType: string): SheetProcessResult {
  const { headerRowIndex, headerMap } = findHeaderRow(sheetData);

  const result: SheetProcessResult = {
    sheetName,
    sheetType,
    headers: headerMap,
    headerRow: headerRowIndex,
    rows: [],
    validRows: 0,
    errorRows: 0,
    totalRows: 0,
  };

  if (headerRowIndex === -1) return result;

  const dataRows = sheetData.slice(headerRowIndex + 1);
  result.totalRows = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) continue;

    const mapped = mapRowToHeaders(row, headerMap);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!mapped['galpon'] && !mapped['fecha'] && sheetType !== 'aves' && sheetType !== 'silos_alimento') {
      const hasData = Object.values(mapped).some(v => v !== null && v !== undefined && v !== '');
      if (!hasData) continue;
    }

    if (mapped['galpon']) {
      const galponNorm = normalizeText(String(mapped['galpon']));
      const galponMatch = galponNorm.match(/^(\d+[ab])$/i);
      if (galponMatch) {
        mapped['galpon'] = galponMatch[1].toUpperCase();
      } else if (galponNorm.length > 0 && !galponMatch) {
        warnings.push(`Galpón no reconocido: ${mapped['galpon']}`);
      }
    }

    if (mapped['fecha']) {
      mapped['fecha'] = parseDate(mapped['fecha']);
    }

    const numericFields = [
      'mortalidad', 'produccion', 'consumo', 'alimento_entrada', 'gallinas', 'gallinas_fin',
      'jumbo', 'extra', 'aa', 'a', 'b', 'revoltura', 'c', 'pipo', 'blanco', 'sucio', 'roto', 'yemas',
      'saldo_anterior', 'saldo_bodega', 'entradas', 'salidas', 'bultos', 'peso',
    ];

    for (const field of numericFields) {
      if (mapped[field] !== null && mapped[field] !== undefined) {
        const num = parseNumber(mapped[field]);
        if (num === null && String(mapped[field]).trim() !== '') {
          warnings.push(`Valor no numérico en ${field}: ${mapped[field]}`);
          mapped[field] = 0;
        } else {
          mapped[field] = num || 0;
        }
      }
    }

    result.rows.push({
      data: mapped,
      rowIndex: headerRowIndex + 1 + i,
      errors,
      warnings,
    });

    if (errors.length > 0) result.errorRows++;
    else result.validRows++;
  }

  return result;
}

function parseDate(value: any): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }
  const str = String(value).trim();
  if (!str) return null;

  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  for (const fmt of formats) {
    const match = str.match(fmt);
    if (match) {
      let year: number, month: number, day: number;
      if (fmt === formats[0]) {
        [, year, month, day] = match.map(Number);
      } else if (fmt === formats[1]) {
        [, month, day, year] = match.map(Number);
      } else {
        [, day, month, year] = match.map(Number);
      }
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

function parseNumber(value: any): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s]/g, '').trim();
    if (cleaned === '') return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}
