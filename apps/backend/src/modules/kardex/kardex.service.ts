import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { TipoBandeja } from '@prisma/client';

@Injectable()
export class KardexService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createMovimiento(dto: CreateMovimientoDto, usuarioId: string, ip?: string) {
    await this.validateMovimiento(dto);

    let movimiento: any;

    switch (dto.tipoProducto) {
      case 'GALLINA':
        movimiento = await this.prisma.movimientoGallina.create({
          data: {
            fecha: new Date(dto.fecha),
            tipoMovimiento: dto.tipoMovimiento,
            cantidad: dto.cantidad,
            galponId: dto.galponId!,
            origen: dto.origen,
            destino: dto.destino,
            referencia: dto.referencia,
            usuarioId,
            observacion: dto.observacion,
          },
          include: {
            galpon: { select: { codigo: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
        break;

      case 'HUEVO':
        movimiento = await this.prisma.movimientoHuevo.create({
          data: {
            fecha: new Date(dto.fecha),
            tipoMovimiento: dto.tipoMovimiento,
            tipoHuevoId: dto.tipoHuevoId!,
            cantidad: dto.cantidad,
            origen: dto.origen,
            destino: dto.destino,
            referencia: dto.referencia,
            usuarioId,
            observacion: dto.observacion,
          },
          include: {
            tipoHuevo: { select: { codigo: true, nombre: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
        break;

      case 'ALIMENTO':
        movimiento = await this.prisma.movimientoAlimento.create({
          data: {
            fecha: new Date(dto.fecha),
            tipoMovimiento: dto.tipoMovimiento,
            cantidadKg: dto.cantidad,
            galponId: dto.galponId,
            origen: dto.origen,
            destino: dto.destino,
            referencia: dto.referencia,
            usuarioId,
            observacion: dto.observacion,
          },
          include: {
            galpon: { select: { codigo: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
        break;

      case 'BANDEJA':
        movimiento = await this.prisma.movimientoBandeja.create({
          data: {
            fecha: new Date(dto.fecha),
            tipoMovimiento: dto.tipoMovimiento,
            tipo: (dto.tipoBandeja as TipoBandeja) || TipoBandeja.A,
            cantidad: dto.cantidad,
            galponId: dto.galponId,
            origen: dto.origen,
            destino: dto.destino,
            referencia: dto.referencia,
            usuarioId,
            observacion: dto.observacion,
          },
          include: {
            galpon: { select: { codigo: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
        break;
    }

    await this.updateSaldoFromMovimiento(dto);

    await this.auditService.log({
      usuarioId,
      accion: 'CREAR_MOVIMIENTO',
      entidad: 'MOVIMIENTO_INVENTARIO',
      entidadId: movimiento.id,
      cambios: {
        tipo: dto.tipoMovimiento,
        producto: dto.tipoProducto,
        cantidad: dto.cantidad,
        galpon: dto.galponId,
      },
      ip,
    });

    return movimiento;
  }

  async getKardex(tipoProducto: string, params: {
    galponId?: string;
    tipoHuevoId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    let movimientos: any[] = [];
    let total = 0;

    const buildWhere = (extra?: any) => {
      const where: any = { ...extra };
      if (params.galponId) where.galponId = params.galponId;
      if (params.tipoHuevoId) where.tipoHuevoId = params.tipoHuevoId;
      if (params.fechaInicio || params.fechaFin) {
        where.fecha = {};
        if (params.fechaInicio) where.fecha.gte = new Date(params.fechaInicio);
        if (params.fechaFin) where.fecha.lte = new Date(params.fechaFin);
      }
      return where;
    };

    const includeCommon = {
      usuario: { select: { nombre: true, apellido: true } },
    };

    switch (tipoProducto) {
      case 'GALLINA': {
        const where = buildWhere();
        const [data, count] = await Promise.all([
          this.prisma.movimientoGallina.findMany({
            where, skip, take: limit, orderBy: { fecha: 'desc' },
            include: { galpon: { select: { codigo: true } }, ...includeCommon },
          }),
          this.prisma.movimientoGallina.count({ where }),
        ]);
        movimientos = data;
        total = count;
        break;
      }
      case 'HUEVO': {
        const where = buildWhere();
        const [data, count] = await Promise.all([
          this.prisma.movimientoHuevo.findMany({
            where, skip, take: limit, orderBy: { fecha: 'desc' },
            include: { tipoHuevo: { select: { codigo: true, nombre: true } }, ...includeCommon },
          }),
          this.prisma.movimientoHuevo.count({ where }),
        ]);
        movimientos = data;
        total = count;
        break;
      }
      case 'ALIMENTO': {
        const where = buildWhere();
        const [data, count] = await Promise.all([
          this.prisma.movimientoAlimento.findMany({
            where, skip, take: limit, orderBy: { fecha: 'desc' },
            include: { galpon: { select: { codigo: true } }, ...includeCommon },
          }),
          this.prisma.movimientoAlimento.count({ where }),
        ]);
        movimientos = data;
        total = count;
        break;
      }
      case 'BANDEJA': {
        const where = buildWhere();
        const [data, count] = await Promise.all([
          this.prisma.movimientoBandeja.findMany({
            where, skip, take: limit, orderBy: { fecha: 'desc' },
            include: { galpon: { select: { codigo: true } }, ...includeCommon },
          }),
          this.prisma.movimientoBandeja.count({ where }),
        ]);
        movimientos = data;
        total = count;
        break;
      }
    }

    let saldoAcumulado = 0;
    const movimientosConSaldo = movimientos.reverse().map(m => {
      const cantidad = Number(m.cantidad || m.cantidadKg || 0);
      if (['ENTRADA', 'PRODUCCION', 'ENTRADA_LOTE', 'AJUSTE'].includes(m.tipoMovimiento)) {
        saldoAcumulado += cantidad;
      } else {
        saldoAcumulado -= cantidad;
      }
      return { ...m, saldoCalculado: saldoAcumulado };
    }).reverse();

    return {
      data: movimientosConSaldo,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      saldoActual: saldoAcumulado,
    };
  }

  async getResumen(tipoProducto: string, fecha?: string) {
    const fechaBase = fecha ? new Date(fecha) : new Date();
    const startOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
    const endOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);

    const whereFecha = { fecha: { gte: startOfMonth, lte: endOfMonth } };

    let movimientos: any[] = [];

    switch (tipoProducto) {
      case 'GALLINA':
        movimientos = await this.prisma.movimientoGallina.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
      case 'HUEVO':
        movimientos = await this.prisma.movimientoHuevo.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
      case 'ALIMENTO':
        movimientos = await this.prisma.movimientoAlimento.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
      case 'BANDEJA':
        movimientos = await this.prisma.movimientoBandeja.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
    }

    let entradas = 0;
    let salidas = 0;

    for (const m of movimientos) {
      const cantidad = Number(m.cantidad || m.cantidadKg || 0);
      if (['ENTRADA', 'PRODUCCION', 'ENTRADA_LOTE', 'AJUSTE'].includes(m.tipoMovimiento)) {
        entradas += cantidad;
      } else {
        salidas += cantidad;
      }
    }

    return {
      tipoProducto,
      mes: fechaBase.toISOString().slice(0, 7),
      entradas,
      salidas,
      saldo: entradas - salidas,
      totalMovimientos: movimientos.length,
    };
  }

  async getHistorialGalpon(galponId: string) {
    const [gallinas, alimento, bandejas] = await Promise.all([
      this.prisma.movimientoGallina.findMany({
        where: { galponId }, orderBy: { fecha: 'desc' }, take: 50,
        include: { usuario: { select: { nombre: true, apellido: true } } },
      }),
      this.prisma.movimientoAlimento.findMany({
        where: { galponId }, orderBy: { fecha: 'desc' }, take: 50,
        include: { usuario: { select: { nombre: true, apellido: true } } },
      }),
      this.prisma.movimientoBandeja.findMany({
        where: { galponId }, orderBy: { fecha: 'desc' }, take: 50,
        include: { usuario: { select: { nombre: true, apellido: true } } },
      }),
    ]);

    const todos = [
      ...gallinas.map(m => ({ ...m, tipoProducto: 'GALLINA' })),
      ...alimento.map(m => ({ ...m, tipoProducto: 'ALIMENTO' })),
      ...bandejas.map(m => ({ ...m, tipoProducto: 'BANDEJA' })),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return todos.slice(0, 100);
  }

  private async validateMovimiento(dto: CreateMovimientoDto) {
    if (dto.cantidad < 0) throw new BadRequestException('La cantidad no puede ser negativa');

    if (dto.galponId) {
      const galpon = await this.prisma.galpon.findUnique({ where: { id: dto.galponId } });
      if (!galpon) throw new NotFoundException('Galpón no encontrado');
    }

    if (dto.tipoHuevoId) {
      const tipoHuevo = await this.prisma.tipoHuevo.findUnique({ where: { id: dto.tipoHuevoId } });
      if (!tipoHuevo) throw new NotFoundException('Tipo de huevo no encontrado');
    }

    if (dto.tipoProducto === 'GALLINA' && dto.galponId) {
      const galpon = await this.prisma.galpon.findUnique({ where: { id: dto.galponId } });
      if (galpon && ['MORTALIDAD', 'VENTA', 'TRASLADO'].includes(dto.tipoMovimiento)) {
        if (dto.cantidad > galpon.gallinasActuales) {
          throw new BadRequestException(
            `La cantidad (${dto.cantidad}) excede las gallinas actuales (${galpon.gallinasActuales}) del galpón ${galpon.codigo}`
          );
        }
      }
    }

    if (dto.tipoProducto === 'HUEVO' && !dto.tipoHuevoId) {
      throw new BadRequestException('Se requiere tipoHuevoId para movimientos de huevo');
    }

    if (['VENTA', 'DESPACHO'].includes(dto.tipoMovimiento) && !dto.destino) {
      throw new BadRequestException('Se requiere destino para movimientos de venta/despacho');
    }
  }

  private async updateSaldoFromMovimiento(dto: CreateMovimientoDto) {
    if (dto.tipoProducto === 'GALLINA' && dto.galponId) {
      if (['ENTRADA', 'ENTRADA_LOTE', 'TRASLADO'].includes(dto.tipoMovimiento)) {
        await this.prisma.galpon.update({
          where: { id: dto.galponId },
          data: { gallinasActuales: { increment: dto.cantidad } },
        });
      } else if (['MORTALIDAD', 'VENTA', 'TRASLADO'].includes(dto.tipoMovimiento)) {
        await this.prisma.galpon.update({
          where: { id: dto.galponId },
          data: { gallinasActuales: { decrement: dto.cantidad } },
        });
      }
    }
  }
}
