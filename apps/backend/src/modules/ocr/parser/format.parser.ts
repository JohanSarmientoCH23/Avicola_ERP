import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FormatParser {
  private readonly logger = new Logger(FormatParser.name);

  parse(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const result: any = {
      fecha: this.extractFecha(lines),
      galpones: this.extractGalpones(lines),
      tiposHuevo: this.extractTiposHuevo(lines),
      inventarioBandejas: this.extractInventarioBandejas(lines),
      sacos: this.extractSacos(lines),
      observaciones: this.extractObservaciones(lines),
    };

    return result;
  }

  private extractFecha(lines: string[]): string | null {
    for (const line of lines) {
      const match = line.match(/FECHA[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/i);
      if (match) {
        const parts = match[1].split(/[\/\-]/);
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return null;
  }

  private extractGalpones(lines: string[]) {
    const galpones: any[] = [];
    const galponCodes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

    for (const line of lines) {
      for (const code of galponCodes) {
        const regex = new RegExp(`${code}[\\.\\s]*(\\d+)[\\.\\s]*(\\d+\\.?\\d*)[\\.\\s]*(\\d+\\.?\\d*)[\\.\\s]*(\\d+\\.?\\d*)`, 'i');
        const match = line.match(regex);
        if (match) {
          galpones.push({
            codigo: code,
            mortalidad: parseInt(match[1]) || 0,
            alimentoEntrada: parseFloat(match[2]) || 0,
            alimentoConsumo: parseFloat(match[3]) || 0,
            postura: parseInt(match[4]) || 0,
          });
          break;
        }
      }
    }

    if (galpones.length === 0) {
      const fullText = lines.join(' ');
      const numbers = fullText.match(/\d+/g) || [];
      this.logger.warn(`No se detectaron galpones por regex, numeros encontrados: ${numbers.length}`);
    }

    return galpones;
  }

  private extractTiposHuevo(lines: string[]) {
    const tipos: any[] = [];
    const tipoMap: Record<string, string> = {
      'JUMBO': 'JUMBO', 'EXTRA': 'EXTRA', 'A\\.A\\.': 'AA', 'A\\.': 'A',
      'B\\.': 'B', 'REVOLTURA': 'REVOLTURA', 'C\\.': 'C', 'PIPO': 'PIPO',
      'BLANCO': 'BLANCO', 'SUCIO': 'SUCIO', 'ROTO': 'ROTO', 'YEMAS': 'YEMAS',
    };

    for (const line of lines) {
      for (const [pattern, codigo] of Object.entries(tipoMap)) {
        const regex = new RegExp(`${pattern}[\\.\\s]*(\\d+\\.?\\d*)[\\.\\s]*(\\d+\\.?\\d*)[\\.\\s]*(\\d+\\.?\\d*)`, 'i');
        const match = line.match(regex);
        if (match) {
          tipos.push({
            codigo,
            postura: parseInt(match[1]) || 0,
            salida: parseInt(match[2]) || 0,
            saldo: parseInt(match[3]) || 0,
          });
          break;
        }
      }
    }

    return tipos;
  }

  private extractInventarioBandejas(lines: string[]) {
    const bandejas: any[] = [];
    const types = ['AA', 'A', 'B'];

    for (const line of lines) {
      for (const type of types) {
        const regex = new RegExp(`^${type}[\\.\\s]+(\\d+)[\\.\\s]+(\\d+\\.?\\d*)[\\.\\s]+(\\d+\\.?\\d*)[\\.\\s]+(\\d+\\.?\\d*)`, 'i');
        const match = line.match(regex);
        if (match) {
          bandejas.push({
            tipo: type,
            entradas: parseInt(match[1]) || 0,
            salidas: parseInt(match[2]) || 0,
            saldoAnterior: parseInt(match[3]) || 0,
            saldoBodega: parseInt(match[4]) || 0,
          });
        }
      }
    }

    return bandejas;
  }

  private extractSacos(lines: string[]) {
    for (const line of lines) {
      if (line.toUpperCase().includes('SACOS')) {
        const numbers = line.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          return { entrada: parseInt(numbers[0] || '0') || 0, saldo: parseInt(numbers[1] || '0') || 0 };
        }
      }
    }
    return null;
  }

  private extractObservaciones(lines: string[]) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toUpperCase().includes('OBSERVACIONES')) {
        return lines.slice(i + 1).join(' ').trim() || null;
      }
    }
    return null;
  }
}
