import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FormatParser } from './parser/format.parser';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private prisma: PrismaService,
    private formatParser: FormatParser,
  ) {}

  async processImage(filePath: string, usuarioId: string) {
    try {
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('spa+eng');

      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();

      this.logger.log('OCR completado, parseando datos...');

      const parsedData = this.formatParser.parse(text);

      const savedReport = await this.prisma.reporteDiario.create({
        data: {
          fecha: parsedData.fecha ? new Date(parsedData.fecha) : new Date(),
          galponeroId: usuarioId,
          estado: 'BORRADOR',
          fuente: 'OCR',
          imagenUrl: filePath,
          textoOcr: text,
          datosOcr: parsedData,
          observaciones: parsedData.observaciones || '',
        },
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
        datosParseados: parsedData,
      };
    } catch (error) {
      this.logger.error('Error en OCR', error.stack);
      throw error;
    }
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
