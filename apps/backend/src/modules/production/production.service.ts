import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GalponesService } from '../galpones/galpones.service';
import { CreateReportDto } from './dto/create-report.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private galponesService: GalponesService,
  ) {}

  async createReport(dto: CreateReportDto, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.reporteDiario.create({
        data: {
          fecha: new Date(dto.fecha),
          galponeroId: usuarioId,
          estado: 'BORRADOR',
          observaciones: dto.observaciones,
          fuente: dto.fuente || 'MANUAL',
          datosOcr: dto.datosOcr || {},
        },
      });

      for (const detalle of dto.detallesGalpon) {
        await tx.detalleGalpon.create({
          data: {
            reporteId: report.id,
            galponId: detalle.galponId,
            mortalidad: detalle.mortalidad || 0,
            produccion: detalle.produccion || 0,
            alimentoEntrada: detalle.alimentoEntrada || 0,
            alimentoConsumo: detalle.alimentoConsumo || 0,
            gallinas: detalle.gallinas || 0,
          },
        });
      }

      for (const prod of dto.produccionesHuevo) {
        await tx.produccionHuevo.create({
          data: {
            reporteId: report.id,
            tipoHuevoId: prod.tipoHuevoId,
            cantidad: prod.cantidad || 0,
            salida: prod.salida || 0,
            saldo: prod.saldo || 0,
          },
        });
      }

      if (dto.inventarioBandejas) {
        for (const band of dto.inventarioBandejas) {
          await tx.inventarioBandejaReporte.create({
            data: {
              reporteId: report.id,
              tipo: band.tipo as any,
              entradas: band.entradas || 0,
              salidas: band.salidas || 0,
              saldoAnterior: band.saldoAnterior || 0,
              saldoBodega: band.saldoBodega || 0,
            },
          });
        }
      }

      return tx.reporteDiario.findUnique({
        where: { id: report.id },
        include: {
          galponero: { select: { id: true, nombre: true, apellido: true } },
          detallesGalpon: { include: { galpon: true } },
          produccionesHuevo: { include: { tipoHuevo: true } },
          inventarioBandejas: true,
        },
      });
    });
  }

  async findAllReports(pagination: PaginationDto, fecha?: string) {
    const where: any = {};
    if (fecha) where.fecha = new Date(fecha);

    const [data, total] = await Promise.all([
      this.prisma.reporteDiario.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
        include: {
          galponero: { select: { id: true, nombre: true, apellido: true } },
          detallesGalpon: { include: { galpon: true } },
          produccionesHuevo: { include: { tipoHuevo: true } },
          inventarioBandejas: true,
        },
      }),
      this.prisma.reporteDiario.count({ where }),
    ]);
    return new PaginatedResult(data, total, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async findOneReport(id: string) {
    const report = await this.prisma.reporteDiario.findUnique({
      where: { id },
      include: {
        galponero: { select: { id: true, nombre: true, apellido: true } },
        detallesGalpon: { include: { galpon: true } },
        produccionesHuevo: { include: { tipoHuevo: true } },
        inventarioBandejas: true,
      },
    });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    return report;
  }

  async updateReportStatus(id: string, estado: string) {
    return this.prisma.reporteDiario.update({
      where: { id },
      data: { estado: estado as any },
    });
  }

  async getTiposHuevo() {
    return this.prisma.tipoHuevo.findMany({ orderBy: { orden: 'asc' } });
  }
}
