import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateGallinaDto, CreateHuevoDto, CreateAlimentoDto, CreateBandejaDto } from './dto/create-inventory.dto';

type Tx = Prisma.TransactionClient;

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

  async createOrUpdateGallina(dto: CreateGallinaDto) {
    const galpon = await this.prisma.galpon.findUnique({ where: { id: dto.galponId } });
    if (!galpon) throw new NotFoundException('Galpón no encontrado');

    const saldoFinal = dto.saldoInicial + dto.entradas - dto.mortalidad - dto.ventas - dto.traslados;
    if (saldoFinal < 0) {
      throw new BadRequestException(
        `Saldo final inválido (${saldoFinal}): el día no puede cerrar con saldo negativo de gallinas`
      );
    }
    if (dto.mortalidad > dto.saldoInicial + dto.entradas) {
      throw new BadRequestException('La mortalidad no puede superar el saldo inicial más entradas');
    }

    const fecha = new Date(dto.fecha);
    return this.prisma.inventarioGallina.upsert({
      where: { galponId_fecha: { galponId: dto.galponId, fecha } },
      update: {
        saldoInicial: dto.saldoInicial,
        entradas: dto.entradas,
        mortalidad: dto.mortalidad,
        ventas: dto.ventas,
        traslados: dto.traslados,
        saldoFinal,
        observaciones: dto.observaciones,
      },
      create: {
        galponId: dto.galponId,
        fecha,
        saldoInicial: dto.saldoInicial,
        entradas: dto.entradas,
        mortalidad: dto.mortalidad,
        ventas: dto.ventas,
        traslados: dto.traslados,
        saldoFinal,
        observaciones: dto.observaciones,
      },
    });
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

  async createOrUpdateHuevo(dto: CreateHuevoDto) {
    const tipoHuevo = await this.prisma.tipoHuevo.findUnique({ where: { id: dto.tipoHuevoId } });
    if (!tipoHuevo) throw new NotFoundException('Tipo de huevo no encontrado');

    const saldoFinal = dto.saldoInicial + dto.produccion - dto.ventas - dto.perdidas - dto.consumo;
    if (saldoFinal < 0) {
      throw new BadRequestException(
        `Saldo final inválido (${saldoFinal}): el día no puede cerrar con saldo negativo de huevos (${tipoHuevo.codigo})`
      );
    }

    const fecha = new Date(dto.fecha);
    return this.prisma.inventarioHuevo.upsert({
      where: { tipoHuevoId_fecha: { tipoHuevoId: dto.tipoHuevoId, fecha } },
      update: {
        saldoInicial: dto.saldoInicial,
        produccion: dto.produccion,
        ventas: dto.ventas,
        perdidas: dto.perdidas,
        consumo: dto.consumo,
        saldoFinal,
        observaciones: dto.observaciones,
      },
      create: {
        tipoHuevoId: dto.tipoHuevoId,
        fecha,
        saldoInicial: dto.saldoInicial,
        produccion: dto.produccion,
        ventas: dto.ventas,
        perdidas: dto.perdidas,
        consumo: dto.consumo,
        saldoFinal,
        observaciones: dto.observaciones,
      },
    });
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

  async createOrUpdateAlimento(dto: CreateAlimentoDto) {
    const galpon = await this.prisma.galpon.findUnique({ where: { id: dto.galponId } });
    if (!galpon) throw new NotFoundException('Galpón no encontrado');
    if (dto.siloId) {
      const silo = await this.prisma.silo.findUnique({ where: { id: dto.siloId } });
      if (!silo) throw new NotFoundException('Silo no encontrado');
    }

    const saldoFinalKg = Number(dto.saldoInicialKg) + Number(dto.entradasKg) - Number(dto.consumoKg);
    if (saldoFinalKg < 0) {
      throw new BadRequestException(
        `Saldo final inválido (${saldoFinalKg} kg): el día no puede cerrar con saldo negativo de alimento`
      );
    }

    const fecha = new Date(dto.fecha);
    return this.prisma.inventarioAlimento.upsert({
      where: { galponId_fecha: { galponId: dto.galponId, fecha } },
      update: {
        saldoInicialKg: dto.saldoInicialKg,
        entradasKg: dto.entradasKg,
        consumoKg: dto.consumoKg,
        saldoFinalKg,
        siloId: dto.siloId,
        observaciones: dto.observaciones,
      },
      create: {
        galponId: dto.galponId,
        fecha,
        saldoInicialKg: dto.saldoInicialKg,
        entradasKg: dto.entradasKg,
        consumoKg: dto.consumoKg,
        saldoFinalKg,
        siloId: dto.siloId,
        observaciones: dto.observaciones,
      },
    });
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
      orderBy: [{ fecha: 'asc' }, { tipo: 'asc' }],
      include: { galpon: { select: { codigo: true } } },
    });
  }

  async createOrUpdateBandeja(dto: CreateBandejaDto) {
    const galpon = await this.prisma.galpon.findUnique({ where: { id: dto.galponId } });
    if (!galpon) throw new NotFoundException('Galpón no encontrado');

    const saldoBodega = dto.saldoAnterior + dto.entradas - dto.salidas;
    if (saldoBodega < 0) {
      throw new BadRequestException(
        `Saldo bodega inválido (${saldoBodega}): no puede quedar negativo para bandejas ${dto.tipo}`
      );
    }

    const fecha = new Date(dto.fecha);
    return this.prisma.inventarioBandeja.upsert({
      where: { galponId_fecha_tipo: { galponId: dto.galponId, fecha, tipo: dto.tipo } },
      update: {
        entradas: dto.entradas,
        salidas: dto.salidas,
        saldoAnterior: dto.saldoAnterior,
        saldoBodega,
        observaciones: dto.observaciones,
      },
      create: {
        galponId: dto.galponId,
        fecha,
        tipo: dto.tipo,
        entradas: dto.entradas,
        salidas: dto.salidas,
        saldoAnterior: dto.saldoAnterior,
        saldoBodega,
        observaciones: dto.observaciones,
      },
    });
  }

  async getResumenInventarios() {
    const [gallinasRows, huevosRows, alimentoRows, bandejasRows] = await Promise.all([
      this.prisma.inventarioGallina.findMany({ orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.inventarioHuevo.findMany({ orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.inventarioAlimento.findMany({ orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.inventarioBandeja.findMany({ orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }] }),
    ]);

    return {
      gallinas: this.latestBy(gallinasRows, (r) => r.galponId).map((r) => ({
        galponId: r.galponId,
        fecha: r.fecha,
        saldoFinal: r.saldoFinal,
      })),
      huevos: this.latestBy(huevosRows, (r) => r.tipoHuevoId).map((r) => ({
        tipoHuevoId: r.tipoHuevoId,
        fecha: r.fecha,
        saldoFinal: r.saldoFinal,
      })),
      alimento: this.latestBy(alimentoRows, (r) => r.galponId).map((r) => ({
        galponId: r.galponId,
        fecha: r.fecha,
        saldoFinalKg: r.saldoFinalKg,
      })),
      bandejas: this.latestBy(bandejasRows, (r) => `${r.galponId}:${r.tipo}`).map((r) => ({
        galponId: r.galponId,
        tipo: r.tipo,
        fecha: r.fecha,
        saldoBodega: r.saldoBodega,
      })),
    };
  }

  private latestBy<T>(rows: T[], key: (row: T) => string): T[] {
    const map = new Map<string, T>();
    for (const row of rows) {
      const k = key(row);
      if (!map.has(k)) map.set(k, row);
    }
    return Array.from(map.values());
  }
}
