import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as XLSX from 'xlsx';
import { detectSheetType, detectHeaders, findHeaderRow } from './normalizer';
import { processClasificacion } from './processors/clasificacion.processor';
import { processDespachos } from './processors/despachos.processor';
import { processAves } from './processors/aves.processor';
import { processSilos } from './processors/silos.processor';
import { processBultos } from './processors/bultos.processor';
import { processPostura } from './processors/postura.processor';
import { processSaldos } from './processors/saldos.processor';

export interface ParsedExcelData {
  nombreArchivo: string;
  fecha: Date | null;
  hojas: SheetAnalysis[];
  errores: string[];
  advertencias: string[];
}

export interface SheetAnalysis {
  nombre: string;
  tipoDetectado: string | null;
  headersEncontrados: Record<number, string>;
  headerRowIndex: number;
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
  datos: any[];
}

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(private prisma: PrismaService) {}

  async analyzeExcel(filePath: string): Promise<ParsedExcelData> {
    try {
      const workbook = XLSX.readFile(filePath);
      const fileName = filePath.split(/[/\\]/).pop() || 'unknown.xlsx';
      const errores: string[] = [];
      const advertencias: string[] = [];
      const hojas: SheetAnalysis[] = [];
      let fecha: Date | null = null;

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (sheetData.length === 0) {
          advertencias.push(`Hoja "${sheetName}" está vacía`);
          continue;
        }

        const sheetType = detectSheetType(sheetName);
        const { headerRowIndex, headerMap } = findHeaderRow(sheetData);

        const headersFound = Object.keys(headerMap).length;
        if (headersFound === 0) {
          advertencias.push(`Hoja "${sheetName}": No se detectaron encabezados conocidos`);
        }

        let datos: any[] = [];
        let filasValidas = 0;
        let filasConError = 0;

        if (sheetType) {
          try {
            const result = this.processSheetByType(sheetName, sheetData, sheetType);
            datos = result.registros || [];
            filasValidas = result.validRows;
            filasConError = result.errorRows;

            if (!fecha && result.registros?.length > 0) {
              for (const reg of result.registros) {
                if (reg.fecha) {
                  fecha = reg.fecha;
                  break;
                }
              }
            }
          } catch (err) {
            errores.push(`Error procesando hoja "${sheetName}": ${err.message}`);
          }
        } else {
          advertencias.push(`Hoja "${sheetName}": Tipo no detectado, se ignorará`);
        }

        hojas.push({
          nombre: sheetName,
          tipoDetectado: sheetType,
          headersEncontrados: headerMap,
          headerRowIndex,
          totalFilas: sheetData.length,
          filasValidas,
          filasConError,
          datos,
        });
      }

      return {
        nombreArchivo: fileName,
        fecha,
        hojas,
        errores,
        advertencias,
      };
    } catch (error) {
      this.logger.error('Error analizando Excel', error.stack);
      throw new BadRequestException(`Error al analizar el archivo: ${error.message}`);
    }
  }

  async previewExcel(filePath: string, sheetName?: string) {
    const workbook = XLSX.readFile(filePath);
    const preview: Record<string, any> = {};

    const sheetsToPreview = sheetName ? [sheetName] : workbook.SheetNames;

    for (const name of sheetsToPreview) {
      if (!workbook.SheetNames.includes(name)) continue;

      const sheet = workbook.Sheets[name];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      const { headerRowIndex, headerMap } = findHeaderRow(sheetData);
      const sheetType = detectSheetType(name);

      preview[name] = {
        tipoDetectado: sheetType,
        headerRowIndex,
        headers: headerMap,
        filasOriginales: sheetData.slice(0, 15),
        totalFilas: sheetData.length,
      };
    }

    return {
      hojas: workbook.SheetNames,
      preview,
    };
  }

  async processExcel(filePath: string, usuarioId: string) {
    const analysis = await this.analyzeExcel(filePath);

    if (analysis.errores.length > 0 && analysis.hojas.every(h => h.filasValidas === 0)) {
      throw new BadRequestException({
        message: 'El archivo no contiene datos válidos',
        errores: analysis.errores,
        advertencias: analysis.advertencias,
      });
    }

    const fechaReporte = analysis.fecha || new Date();

    const datosParseados: any = {
      ...(analysis as any),
      galpones: this.buildGalponesForComparacion(analysis),
      huevos: this.buildHuevosForComparacion(analysis),
    };

    const savedReport = await this.prisma.reporteExcel.create({
      data: {
        fecha: fechaReporte,
        nombreArchivo: analysis.nombreArchivo,
        archivoUrl: filePath,
        datosParseados,
        estado: 'PROCESADO',
        responsableId: usuarioId,
      },
    });

    let registrosCreados = 0;

    for (const hoja of analysis.hojas) {
      if (hoja.tipoDetectado === 'clasificacion' && hoja.datos.length > 0) {
        registrosCreados += await this.saveClasificacion(hoja.datos, fechaReporte, usuarioId, savedReport.id);
      }
    }

    return {
      reporte: savedReport,
      analysis: {
        nombreArchivo: analysis.nombreArchivo,
        fecha: analysis.fecha,
        hojas: analysis.hojas.map(h => ({
          nombre: h.nombre,
          tipo: h.tipoDetectado,
          filasValidas: h.filasValidas,
          filasConError: h.filasConError,
        })),
        registrosCreados,
      },
      errores: analysis.errores,
      advertencias: analysis.advertencias,
    };
  }

  private processSheetByType(sheetName: string, sheetData: any[][], sheetType: string) {
    switch (sheetType) {
      case 'clasificacion':
        return processClasificacion(sheetName, sheetData);
      case 'despachos':
        return processDespachos(sheetName, sheetData);
      case 'aves':
        return processAves(sheetName, sheetData);
      case 'silos_alimento':
        return processSilos(sheetName, sheetData);
      case 'bultos_alimento':
        return processBultos(sheetName, sheetData);
      case 'postura':
        return processPostura(sheetName, sheetData);
      case 'saldos':
        return processSaldos(sheetName, sheetData);
      default:
        return { registros: [], validRows: 0, errorRows: 0 };
    }
  }

  private buildGalponesForComparacion(analysis: ParsedExcelData): any[] {
    const galpones = new Map<string, any>();

    for (const hoja of analysis.hojas) {
      if (!['aves', 'postura'].includes(hoja.tipoDetectado || '')) continue;
      for (const reg of hoja.datos) {
        const codigo = String(reg.galpon || '').toUpperCase().trim();
        if (!codigo) continue;
        if (!galpones.has(codigo)) {
          galpones.set(codigo, {
            codigo,
            mortalidad: 0,
            produccion: 0,
            alimentoConsumo: 0,
            alimentoEntrada: 0,
            gallinas: 0,
          });
        }
        const g = galpones.get(codigo);
        g.mortalidad += Number(reg.mortalidad) || 0;
        g.produccion += Number(reg.produccion) || 0;
        g.alimentoConsumo += Number(reg.consumo) || 0;
        g.alimentoEntrada += Number(reg.alimentoEntrada) || 0;
        g.gallinas = Number(reg.gallinas) || g.gallinas;
      }
    }

    return Array.from(galpones.values());
  }

  private buildHuevosForComparacion(analysis: ParsedExcelData): any[] {
    const huevos = new Map<string, number>();
    const FIELDS = ['jumbo', 'extra', 'aa', 'a', 'b', 'revoltura', 'c', 'pipo', 'blanco', 'sucio', 'roto', 'yemas'];

    for (const hoja of analysis.hojas) {
      if (hoja.tipoDetectado !== 'clasificacion') continue;
      for (const reg of hoja.datos) {
        for (const field of FIELDS) {
          const val = Number(reg[field]) || 0;
          if (val > 0) {
            huevos.set(field.toUpperCase(), (huevos.get(field.toUpperCase()) || 0) + val);
          }
        }
      }
    }

    return Array.from(huevos.entries()).map(([codigo, cantidad]) => ({ codigo, cantidad }));
  }

  private async saveClasificacion(
    datos: any[],
    fechaBase: Date | null,
    usuarioId: string,
    reporteId: string,
  ): Promise<number> {
    const eggTypes = await this.prisma.tipoHuevo.findMany();
    const eggMap = new Map(eggTypes.map(t => [String(t.codigo).toUpperCase(), t.id]));

    const EGG_FIELDS = ['jumbo', 'extra', 'aa', 'a', 'b', 'revoltura', 'c', 'pipo', 'blanco', 'sucio', 'roto', 'yemas'];

    let count = 0;

    const movimientos: Array<{ fecha: Date; tipoHuevoId: string; cantidad: number; galpon: string }> = [];

    for (const registro of datos) {
      const fecha = new Date(registro.fecha || fechaBase || new Date());
      fecha.setHours(0, 0, 0, 0);
      const galpon = registro.galpon;

      const galponRecord = await this.prisma.galpon.findUnique({ where: { codigo: galpon } });
      if (!galponRecord) continue;

      for (const field of EGG_FIELDS) {
        const numCantidad = Number(registro[field]) || 0;
        if (numCantidad <= 0) continue;

        const tipoHuevoId = eggMap.get(field.toUpperCase());
        if (!tipoHuevoId) continue;

        movimientos.push({ fecha, tipoHuevoId, cantidad: numCantidad, galpon });
        count++;
      }
    }

    if (movimientos.length === 0) return 0;

    await this.prisma.$transaction(async tx => {
      for (const mov of movimientos) {
        const existing = await tx.inventarioHuevo.findUnique({
          where: {
            tipoHuevoId_fecha: {
              tipoHuevoId: mov.tipoHuevoId,
              fecha: mov.fecha,
            },
          },
        });

        if (existing) {
          const nuevaProduccion = existing.produccion + mov.cantidad;
          const nuevoSaldo = existing.saldoInicial + nuevaProduccion - existing.ventas - existing.perdidas - existing.consumo;
          await tx.inventarioHuevo.update({
            where: { id: existing.id },
            data: {
              produccion: nuevaProduccion,
              saldoFinal: nuevoSaldo,
            },
          });
        } else {
          const prev = await tx.inventarioHuevo.findFirst({
            where: {
              tipoHuevoId: mov.tipoHuevoId,
              fecha: { lt: mov.fecha },
            },
            orderBy: { fecha: 'desc' },
          });
          const saldoInicial = prev ? prev.saldoFinal : 0;
          await tx.inventarioHuevo.create({
            data: {
              tipoHuevoId: mov.tipoHuevoId,
              fecha: mov.fecha,
              saldoInicial,
              produccion: mov.cantidad,
              saldoFinal: saldoInicial + mov.cantidad,
            },
          });
        }

        await tx.movimientoHuevo.create({
          data: {
            fecha: mov.fecha,
            tipoMovimiento: 'PRODUCCION',
            tipoHuevoId: mov.tipoHuevoId,
            cantidad: mov.cantidad,
            destino: mov.galpon,
            referencia: `Excel:${reporteId}`,
            usuarioId,
            observacion: 'Importación Excel clasificación',
          },
        });
      }
    });

    return count;
  }
}
