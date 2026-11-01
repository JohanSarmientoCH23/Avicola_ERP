import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FormatParser } from './parser/format.parser';
import * as fs from 'fs';

const MIN_CONFIDENCE = 40;

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private prisma: PrismaService,
    private formatParser: FormatParser,
  ) {}

  async processImage(filePath: string, usuarioId: string) {
    let worker: any = null;
    try {
      const Tesseract = require('tesseract.js');

      worker = await Tesseract.createWorker('spa+eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`OCR progress: ${(m.progress * 100).toFixed(1)}%`);
          }
        },
      });

      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:/%()-/',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      });

      this.logger.log(`Procesando imagen: ${filePath}`);
      const { data: { text, confidence } } = await worker.recognize(filePath);
      await worker.terminate();
      worker = null;

      this.logger.log(`OCR completado. Confianza: ${confidence.toFixed(1)}%`);

      if (confidence < MIN_CONFIDENCE) {
        throw new BadRequestException({
          message: `Confianza OCR muy baja (${confidence.toFixed(1)}%). Mínimo requerido: ${MIN_CONFIDENCE}%. Verifique la calidad de la imagen.`,
          confianza: confidence,
          minConfianza: MIN_CONFIDENCE,
        });
      }

      const parsedData = this.formatParser.parse(text);

      const galponesValidos: any[] = [];
      if (parsedData.galpones && parsedData.galpones.length > 0) {
        for (const galpon of parsedData.galpones) {
          const galponDb = await this.prisma.galpon.findFirst({
            where: { codigo: galpon.codigo },
          });
          if (galponDb) {
            galponesValidos.push({ ...galpon, galponId: galponDb.id });
          } else {
            this.logger.warn(`Galpón "${galpon.codigo}" no encontrado en BD, se omite del detalle`);
          }
          }
      }

      const tiposValidos: any[] = [];
      if (parsedData.tiposHuevo && parsedData.tiposHuevo.length > 0) {
        for (const tipo of parsedData.tiposHuevo) {
          const tipoDb = await this.prisma.tipoHuevo.findFirst({
            where: { codigo: tipo.codigo as any },
          });
          if (tipoDb) {
            tiposValidos.push({ ...tipo, tipoHuevoId: tipoDb.id });
          }
        }
      }

      const fechaReporte = parsedData.fecha ? new Date(parsedData.fecha) : new Date();
      fechaReporte.setHours(0, 0, 0, 0);

      const existingSameDay = await this.prisma.reporteDiario.findFirst({
        where: {
          fecha: fechaReporte,
          fuente: 'OCR',
          estado: { not: 'RECHAZADO' },
        },
      });

      const savedReport = await this.prisma.$transaction(async tx => {
        if (existingSameDay) {
          await tx.reporteDiario.update({
            where: { id: existingSameDay.id },
            data: { estado: 'RECHAZADO', observaciones: 'Reemplazado por nuevo escaneo OCR' },
          });
        }

        const report = await tx.reporteDiario.create({
          data: {
            fecha: fechaReporte,
            galponeroId: usuarioId,
            estado: 'BORRADOR',
            fuente: 'OCR',
            observaciones: parsedData.observaciones || '',
            ocrData: {
              create: {
                imagenUrl: filePath,
                textoOcr: text,
                datosOcr: parsedData,
                confianza: confidence,
              },
            },
          },
          include: { ocrData: true },
        });

        for (const galpon of galponesValidos) {
          await tx.detalleGalpon.create({
            data: {
              reporteId: report.id,
              galponId: galpon.galponId,
              mortalidad: galpon.mortalidad || 0,
              produccion: galpon.postura || 0,
              alimentoEntrada: galpon.alimentoEntrada || 0,
              alimentoConsumo: galpon.alimentoConsumo || 0,
              gallinas: galpon.gallinas || 0,
            },
          });
        }

        for (const tipo of tiposValidos) {
          await tx.produccionHuevo.create({
            data: {
              reporteId: report.id,
              tipoHuevoId: tipo.tipoHuevoId,
              cantidad: tipo.postura || 0,
              salida: tipo.salida || 0,
              saldo: tipo.saldo || 0,
            },
          });
        }

        return report;
      });

      return {
        reporte: savedReport,
        textoOriginal: text,
        confianza: confidence,
        datosParseados: parsedData,
      };
    } catch (error) {
      this.logger.error('Error en OCR', error.stack);
      if (worker) {
        try { await worker.terminate(); } catch {}
      }
      throw error;
    }
  }

  async cleanupFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }

  getSupportedFields() {
    return {
      galpones: ['mortalidad', 'produccion', 'alimentoEntrada', 'alimentoConsumo', 'gallinas'],
      tiposHuevo: ['JUMBO', 'EXTRA', 'AA', 'A', 'B', 'REVOLTURA', 'C', 'PIPO', 'BLANCO', 'SUCIO', 'ROTO', 'YEMAS'],
      inventarioBandejas: ['AA', 'A', 'B'],
      otros: ['sacos', 'observaciones'],
    };
  }
}
