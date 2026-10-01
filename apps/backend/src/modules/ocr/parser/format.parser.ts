import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FormatParser {
  private readonly logger = new Logger(FormatParser.name);

  parse(text: string) {
    const normalized = this.normalizeText(text);
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const result: any = {
      fecha: this.extractFecha(lines),
      galpones: this.extractGalpones(lines),
      tiposHuevo: this.extractTiposHuevo(lines),
      inventarioBandejas: this.extractInventarioBandejas(lines),
      sacos: this.extractSacos(lines),
      observaciones: this.extractObservaciones(lines),
    };

    this.logger.log(`Parseado: ${result.galpones.length} galpones, ${result.tiposHuevo.length} tipos huevo`);
    return result;
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/(\d)[,](\d{3})/g, '$1$2')
      .replace(/O(?=\d)/g, '0')
      .replace(/(?<=\d)O(?=\d)/g, '0');
  }

  private extractFecha(lines: string[]): string | null {
    const patterns = [
      /FECHA[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/i,
      /FECHA[:\s]*(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/i,
      /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/,
      /(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const dateStr = match[1];
          const parts = dateStr.split(/[\/\-\.]/);

          if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else {
            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
    }
    return null;
  }

  private extractGalpones(lines: string[]) {
    const galpones: any[] = [];
    const galponPatterns = [
      /(?:G(?:ALPON)?|GALP?)\.?\s*(\d+[A-Z])[\s:\-]*(\d+)[\s:\-]*(\d+[\.,]?\d*)[\s:\-]*(\d+[\.,]?\d*)[\s:\-]*(\d+[\.,]?\d*)/i,
      /^(\d+[A-Z])[\s:\-]+(\d+)[\s:\-]+(\d+[\.,]?\d*)[\s:\-]+(\d+[\.,]?\d*)[\s:\-]+(\d+[\.,]?\d*)/i,
      /^(\d+[A-Z])\.?\s+(\d+)\s+(\d+[\.,]?\d*)\s+(\d+[\.,]?\d*)\s+(\d+[\.,]?\d*)/,
    ];

    for (const line of lines) {
      for (const regex of galponPatterns) {
        const match = line.match(regex);
        if (match) {
          const code = match[1].toUpperCase();
          if (!galpones.find(g => g.codigo === code)) {
            galpones.push({
              codigo: code,
              mortalidad: this.parseNumber(match[2]),
              alimentoEntrada: this.parseNumber(match[3]),
              alimentoConsumo: this.parseNumber(match[4]),
              postura: this.parseNumber(match[5]),
            });
          }
          break;
        }
      }
    }

    if (galpones.length === 0) {
      const codeRegex = /(?:G(?:ALPON)?\.?\s*)?(\d{1,2}[A-B])\b/i;
      const numberRegex = /\b(\d{1,6}(?:\.\d{1,2})?)\b/g;

      for (const line of lines) {
        const codeMatch = line.match(codeRegex);
        if (codeMatch) {
          const code = codeMatch[1].toUpperCase();
          const numbers: number[] = [];
          let m: RegExpExecArray | null;
          while ((m = numberRegex.exec(line)) !== null) {
            numbers.push(this.parseNumber(m[1]));
          }

          if (numbers.length >= 4 && !galpones.find(g => g.codigo === code)) {
            galpones.push({
              codigo: code,
              mortalidad: numbers[0],
              alimentoEntrada: numbers[1],
              alimentoConsumo: numbers[2],
              postura: numbers[3],
            });
          }
        }
      }
    }

    return galpones;
  }

  private extractTiposHuevo(lines: string[]) {
    const tipos: any[] = [];
    const tipoPatterns: [RegExp, string][] = [
      [/\bJUMBO\b/i, 'JUMBO'],
      [/\bEXTRA\b/i, 'EXTRA'],
      [/\bA[\.\s]*A\b/i, 'AA'],
      [/\b(?:A[\.\s]*(?!A)|(?<=\s)A(?=[\s:\-\.]))\b/i, 'A'],
      [/\bB[\.\s]*(?!ANDO|AJE|IJO|IJA)/i, 'B'],
      [/\bREVOLTURA\b/i, 'REVOLTURA'],
      [/\bC[\.\s]*(?!ASE|ERO|UPO)/i, 'C'],
      [/\bPIPO\b/i, 'PIPO'],
      [/\bBLANCO\b/i, 'BLANCO'],
      [/\bSUCIO\b/i, 'SUCIO'],
      [/\bROTO\b/i, 'ROTO'],
      [/\bYEMAS?\b/i, 'YEMAS'],
    ];

    const numberRegex = /\b(\d{1,8}(?:\.\d{1,2})?)\b/g;

    for (const line of lines) {
      for (const [pattern, codigo] of tipoPatterns) {
        if (pattern.test(line)) {
          const numbers: number[] = [];
          let m: RegExpExecArray | null;
          while ((m = numberRegex.exec(line)) !== null) {
            numbers.push(this.parseNumber(m[1]));
          }

          if (numbers.length >= 1 && !tipos.find(t => t.codigo === codigo)) {
            tipos.push({
              codigo,
              postura: numbers[0] || 0,
              salida: numbers[1] || 0,
              saldo: numbers[2] || 0,
            });
          }
          break;
        }
      }
    }

    return tipos;
  }

  private extractInventarioBandejas(lines: string[]) {
    const bandejas: any[] = [];
    const types = ['AA', 'A', 'B'];
    const numberRegex = /\b(\d{1,8}(?:\.\d{1,2})?)\b/g;

    for (const line of lines) {
      for (const type of types) {
        const regex = new RegExp(`(?:BANDEJAS?\\s+)?${type}[\\.\\s:]+`, 'i');
        if (regex.test(line)) {
          const numbers: number[] = [];
          let m: RegExpExecArray | null;
          while ((m = numberRegex.exec(line)) !== null) {
            numbers.push(this.parseNumber(m[1]));
          }

          if (numbers.length >= 3 && !bandejas.find(b => b.tipo === type)) {
            bandejas.push({
              tipo: type,
              entradas: numbers[0] || 0,
              salidas: numbers[1] || 0,
              saldoAnterior: numbers[2] || 0,
              saldoBodega: numbers[3] || 0,
            });
          }
        }
      }
    }

    return bandejas;
  }

  private extractSacos(lines: string[]) {
    const numberRegex = /\b(\d{1,8})\b/g;

    for (const line of lines) {
      if (/SACOS?|ALIMENTO|SACO/i.test(line)) {
        const numbers: number[] = [];
        let m: RegExpExecArray | null;
        while ((m = numberRegex.exec(line)) !== null) {
          numbers.push(parseInt(m[1]) || 0);
        }

        if (numbers.length >= 1) {
          return {
            entrada: numbers.find(n => n > 0 && n < 10000) || numbers[0] || 0,
            saldo: numbers[numbers.length - 1] || 0,
          };
        }
      }
    }
    return null;
  }

  private extractObservaciones(lines: string[]) {
    const obsPatterns = [/OBSERVACION/i, /NOTA/i, /OBS\./i, /COMENTARIO/i];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of obsPatterns) {
        if (pattern.test(lines[i])) {
          const obs = lines[i].replace(pattern, '').replace(/[:\s\-]+/, '').trim();
          if (obs) return obs;
          const nextLines = lines.slice(i + 1, i + 4).filter(l => !l.match(/^\d+$/));
          if (nextLines.length > 0) return nextLines.join(' ').trim();
        }
      }
    }
    return null;
  }

  private parseNumber(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[,.\s]/g, (m) => m === '.' ? '.' : '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }
}
