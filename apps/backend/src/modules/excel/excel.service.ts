import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(private prisma: PrismaService) {}

  async processExcel(filePath: string, usuarioId: string) {
    try {
      const workbook = XLSX.readFile(filePath);
      const allData: any = {};

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        allData[sheetName] = jsonData;
      }

      const parsedData = this.parseExcelData(allData);

      const savedReport = await this.prisma.reporteExcel.create({
        data: {
          fecha: parsedData.fecha ? new Date(parsedData.fecha) : new Date(),
          nombreArchivo: filePath.split(/[/\\]/).pop() || 'unknown.xlsx',
          archivoUrl: filePath,
          datosParseados: parsedData,
          estado: 'PROCESADO',
          responsableId: usuarioId,
        },
      });

      return {
        reporte: savedReport,
        datosParseados: parsedData,
        hojas: workbook.SheetNames,
      };
    } catch (error) {
      this.logger.error('Error procesando Excel', error.stack);
      throw error;
    }
  }

  private parseExcelData(sheets: Record<string, any[][]>) {
    const result: any = {
      fecha: null,
      galpones: [],
      tiposHuevo: [],
      totales: {},
    };

    const mainSheet = sheets[Object.keys(sheets)[0]];
    if (!mainSheet) return result;

    const headers = mainSheet[0]?.map((h: any) => String(h).toUpperCase()) || [];

    for (let i = 1; i < mainSheet.length; i++) {
      const row = mainSheet[i];
      if (!row || row.length === 0) continue;

      const galponCode = String(row[0] || '').trim();
      const galponMatch = galponCode.match(/^(\d+[AB])$/i);

      if (galponMatch) {
        const galponData: any = {
          codigo: galponMatch[1].toUpperCase(),
          edad: String(row[1] || ''),
          consumo: parseFloat(row[2]) || 0,
          alimentoEntrada: parseFloat(row[3]) || 0,
          gallinasInicio: parseInt(row[4]) || 0,
          gallinasFin: parseInt(row[5]) || 0,
          produccion: parseInt(row[6]) || 0,
          mortalidad: parseInt(row[15]) || 0,
        };
        result.galpones.push(galponData);
      }
    }

    return result;
  }

  getExcelPreview(filePath: string) {
    const workbook = XLSX.readFile(filePath);
    const preview: Record<string, any[]> = {};

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      preview[sheetName] = data.slice(0, 10);
    }

    return {
      hojas: workbook.SheetNames,
      preview,
    };
  }
}
