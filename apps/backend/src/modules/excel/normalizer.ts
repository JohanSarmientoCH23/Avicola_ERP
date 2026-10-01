const EGG_TYPE_ALIASES: Record<string, string> = {
  'JUMBO': 'JUMBO',
  'JUM': 'JUMBO',
  'JMB': 'JUMBO',

  'EXTRA': 'EXTRA',
  'EXT': 'EXTRA',

  'AA': 'AA',
  'A.A.': 'AA',
  'A.A': 'AA',
  'A A': 'AA',
  'AA ': 'AA',

  'A': 'A',
  'A.': 'A',

  'B': 'B',
  'B.': 'B',

  'REVOLTURA': 'REVOLTURA',
  'REVOLT': 'REVOLTURA',
  'REV': 'REVOLTURA',
  'REVO': 'REVOLTURA',
  'REVOL': 'REVOLTURA',

  'C': 'C',
  'C.': 'C',

  'PIPO': 'PIPO',
  'PIP': 'PIPO',

  'BLANCO': 'BLANCO',
  'BLAN': 'BLANCO',
  'BLA': 'BLANCO',

  'SUCIO': 'SUCIO',
  'SUC': 'SUCIO',

  'ROTO': 'ROTO',
  'ROT': 'ROTO',

  'YEMAS': 'YEMAS',
  'YEMA': 'YEMAS',
  'YEM': 'YEMAS',
};

const HEADER_ALIASES: Record<string, string[]> = {
  fecha: ['fecha', 'día', 'dia', 'date', 'day', 'fech'],
  galpon: ['galpon', 'galpón', 'g', 'galpon_id', 'galpón_id', 'n_galpon', 'n galpon', '#galpon'],
  mortalidad: ['mortalidad', 'mort', 'muertes', 'muerte', 'mortality', 'dead', 'deadbirds'],
  produccion: ['produccion', 'producción', 'prod', 'production', 'huevo', 'huevos', 'eggs', 'postura'],
  consumo: ['consumo', 'consumo_alimento', 'consumoalimento', 'alimento_consumo', 'consumption', 'feed_consumption', 'cons'],
  alimento_entrada: ['alimentoentrada', 'alimento_entrada', 'entrada_alimento', 'entradaalimento', 'entrada', 'feed_input', 'alimento'],
  gallinas: ['gallinas', 'aves', 'aves_inicio', 'gallinas_inicio', 'birds', 'hens', 'active_birds'],
  gallinas_fin: ['gallinas_fin', 'gallinas_final', 'aves_fin', 'birds_end', 'hens_end'],
  edad: ['edad', 'age', 'semanas', 'weeks', 'wk'],
  jumbo: ['jumbo', 'jum', 'jmb', 'jumbo_count'],
  extra: ['extra', 'ext', 'extra_count'],
  aa: ['aa', 'a.a.', 'a.a', 'a a', 'aa_count'],
  a: ['a', 'a.', 'a_count'],
  b: ['b', 'b.', 'b_count'],
  revoltura: ['revoltura', 'revolt', 'rev', 'revolta', 'revol', 'revoltura_count'],
  c: ['c', 'c.', 'c_count'],
  pipo: ['pipo', 'pip', 'pipo_count'],
  blanco: ['blanco', 'blan', 'bla', 'blanco_count'],
  sucio: ['sucio', 'suc', 'sucio_count'],
  roto: ['roto', 'rot', 'roto_count'],
  yemas: ['yemas', 'yema', 'yem', 'yemas_count'],
  saldo_anterior: ['saldoanterior', 'saldo_anterior', 'saldo_previo', 'previous_balance', 'bal_prev'],
  saldo_bodega: ['saldobodega', 'saldo_bodega', 'bodega', 'warehouse', 'stock'],
  entradas: ['entradas', 'entrada', 'input', 'inputs'],
  salidas: ['salidas', 'salida', 'output', 'outputs', 'despacho', 'despachos'],
  tipo: ['tipo', 'type', 'clasificacion'],
  Silo: ['silo', 'silos', 'silo_id'],
  bultos: ['bultos', 'bulto', 'sacos', 'bags', 'sack'],
  peso: ['peso', 'weight', 'peso_total', 'kg'],
  Gallinas: ['gallinas', 'aves', 'aves_actuales', 'gallinas_actuales'],
  lote: ['lote', 'lote_id', 'batch'],
  novedades: ['novedades', 'observaciones', 'obs', 'notes', 'remarks', 'comentario', 'comentarios'],
};

export function normalizeText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function normalizeEggType(raw: string): string | null {
  const cleaned = String(raw || '').trim().toUpperCase().replace(/[\s.]/g, '');
  for (const [alias, canonical] of Object.entries(EGG_TYPE_ALIASES)) {
    if (alias.replace(/[\s.]/g, '').toUpperCase() === cleaned) {
      return canonical;
    }
  }
  return null;
}

export function detectHeader(value: string): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (normalized === normalizeText(alias)) {
        return canonical;
      }
    }
  }
  return null;
}

export function detectHeaders(row: any[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  for (let i = 0; i < row.length; i++) {
    const cell = String(row[i] || '').trim();
    if (cell) {
      const detected = detectHeader(cell);
      if (detected) {
        mapping[i] = detected;
      }
    }
  }
  return mapping;
}

export function findHeaderRow(rows: any[][]): { headerRowIndex: number; headerMap: Record<number, string> } {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const headerMap = detectHeaders(row);
    const headerCount = Object.keys(headerMap).length;

    if (headerCount >= 3) {
      return { headerRowIndex: i, headerMap };
    }
  }
  return { headerRowIndex: -1, headerMap: {} };
}

export function mapRowToHeaders(row: any[], headerMap: Record<number, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [colIndex, fieldName] of Object.entries(headerMap)) {
    const idx = parseInt(colIndex, 10);
    result[fieldName] = row[idx] !== undefined ? row[idx] : null;
  }
  return result;
}

export function detectSheetType(sheetName: string): string | null {
  const normalized = normalizeText(sheetName);

  const sheetPatterns: Record<string, string[]> = {
    clasificacion: ['clasificacion', 'clasificacion de huevos', 'clasif', 'clas huevo', 'egg classification'],
    despachos: ['despacho', 'despachos', 'dispatch', 'envio', 'envios', 'entregas'],
    aves: ['aves', 'gallinas', 'birds', 'poultry', 'ave'],
    silos_alimento: ['silo', 'silos', 'silos alim', 'silos alimento', 'silo alimento', 'feed silo', 'silos alimentacion'],
    bultos_alimento: ['bulto', 'bultos', 'bultos alim', 'bultos alimento', 'bulto alimento', 'feed bags', 'sacos'],
    postura: ['postura', 'production', 'produccion', 'egg production', 'postura diaria'],
    saldos: ['s.f inv', 's.f. inv', 'saldos', 'inventory', 'inventario', 'saldo', 'stock'],
  };

  for (const [type, patterns] of Object.entries(sheetPatterns)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return type;
      }
    }
  }
  return null;
}
