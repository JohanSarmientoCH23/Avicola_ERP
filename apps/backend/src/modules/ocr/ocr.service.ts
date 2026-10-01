import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FormatParser } from './parser/format.parser';
import * as fs from 'fs';

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
      this.logger.debug(`Texto extraído (${text.length} chars): ${text.substring(0, 200)}...`);

      const parsedData = this.formatParser.parse(text);

      const savedReport = await this.prisma.reporteDiario.create({
        data: {
          fecha: parsedData.fecha ? new Date(parsedData.fecha) : new Date(),
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

      if (parsedData.galpones && parsedData.galpones.length > 0) {
        for (const galpon of parsedData.galpones) {
          const galponDb = await this.prisma.galpon.findFirst({
            where: { codigo: galpon.codigo },
          });
          if (galponDb) {
            await this.prisma.detalleGalpon.create({
              data: {
                reporteId: savedReport.id,
                galponId: galponDb.id,
                mortalidad: galpon.mortalidad || 0,
                produccion: galpon.postura || 0,
                alimentoEntrada: galpon.alimentoEntrada || 0,
                alimentoConsumo: galpon.alimentoConsumo || 0,
                gallinas: galpon.gallinas || 0,
              },
            });
          }
        }
      }

      if (parsedData.tiposHuevo && parsedData.tiposHuevo.length > 0) {
        for (const tipo of parsedData.tiposHuevo) {
          const tipoDb = await this.prisma.tipoHuevo.findFirst({
            where: { codigo: tipo.codigo as any },
          });
          if (tipoDb) {
            await this.prisma.produccionHuevo.create({
              data: {
                reporteId: savedReport.id,
                tipoHuevoId: tipoDb.id,
                cantidad: tipo.postura || 0,
                salida: tipo.salida || 0,
                saldo: tipo.saldo || 0,
              },
            });
          }
        }
      }

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
