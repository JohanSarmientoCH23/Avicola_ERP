import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getKardexGallinas(galponId: string, fechaInicio?: string, fechaFin?: string) {
    const where: any = { galponId };
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }
    return this.prisma.inventarioGallina.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: { galpon: { select: { codigo: true } } },
    });
  }

  async createOrUpdateGallina(dto: any) {
    const existing = await this.prisma.inventarioGallina.findUnique({
      where: { galponId_fecha: { galponId: dto.galponId, fecha: new Date(dto.fecha) } },
    });
    if (existing) {
      return this.prisma.inventarioGallina.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.inventarioGallina.create({ data: { ...dto, fecha: new Date(dto.fecha) } });
  }

  async getKardexHuevos(tipoHuevoId: string, fechaInicio?: string, fechaFin?: string) {
    const where: any = { tipoHuevoId };
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }
    return this.prisma.inventarioHuevo.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: { tipoHuevo: true },
    });
  }

  async createOrUpdateHuevo(dto: any) {
    const existing = await this.prisma.inventarioHuevo.findUnique({
      where: { tipoHuevoId_fecha: { tipoHuevoId: dto.tipoHuevoId, fecha: new Date(dto.fecha) } },
    });
    if (existing) {
      return this.prisma.inventarioHuevo.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.inventarioHuevo.create({ data: { ...dto, fecha: new Date(dto.fecha) } });
  }

  async getKardexAlimento(galponId: string, fechaInicio?: string, fechaFin?: string) {
    const where: any = { galponId };
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }
    return this.prisma.inventarioAlimento.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: { galpon: { select: { codigo: true } } },
    });
  }

  async createOrUpdateAlimento(dto: any) {
    const existing = await this.prisma.inventarioAlimento.findUnique({
      where: { galponId_fecha: { galponId: dto.galponId, fecha: new Date(dto.fecha) } },
    });
    if (existing) {
      return this.prisma.inventarioAlimento.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.inventarioAlimento.create({ data: { ...dto, fecha: new Date(dto.fecha) } });
  }

  async getKardexBandejas(galponId: string, fechaInicio?: string, fechaFin?: string) {
    const where: any = { galponId };
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }
    return this.prisma.inventarioBandeja.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: { galpon: { select: { codigo: true } } },
    });
  }

  async createOrUpdateBandeja(dto: any) {
    const existing = await this.prisma.inventarioBandeja.findUnique({
      where: { galponId_fecha_tipo: { galponId: dto.galponId, fecha: new Date(dto.fecha), tipo: dto.tipo } },
    });
    if (existing) {
      return this.prisma.inventarioBandeja.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.inventarioBandeja.create({ data: { ...dto, fecha: new Date(dto.fecha) } });
  }

  async getResumenInventarios() {
    const [gallinas, huevos, alimento, bandejas] = await Promise.all([
      this.prisma.inventarioGallina.groupBy({ by: ['galponId'], _sum: { saldoFinal: true }, orderBy: { galponId: 'asc' } }),
      this.prisma.inventarioHuevo.groupBy({ by: ['tipoHuevoId'], _sum: { saldoFinal: true }, orderBy: { tipoHuevoId: 'asc' } }),
      this.prisma.inventarioAlimento.groupBy({ by: ['galponId'], _sum: { saldoFinalKg: true }, orderBy: { galponId: 'asc' } }),
      this.prisma.inventarioBandeja.groupBy({ by: ['galponId', 'tipo'], _sum: { saldoBodega: true }, orderBy: { galponId: 'asc' } }),
    ]);
    return { gallinas, huevos, alimento, bandejas };
  }
}
