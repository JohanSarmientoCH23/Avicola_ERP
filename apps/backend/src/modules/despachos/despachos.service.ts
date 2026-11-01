import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';

type Tx = Prisma.TransactionClient;

@Injectable()
export class DespachosService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDespachoDto, usuarioId: string, ip?: string) {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('Debe incluir al menos un detalle de despacho');
    }

    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    for (const detalle of dto.detalles) {
      if (detalle.cantidad <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a 0');
      }

      const tipoHuevo = await this.prisma.tipoHuevo.findUnique({ where: { id: detalle.tipoHuevoId } });
      if (!tipoHuevo) throw new NotFoundException(`Tipo de huevo ${detalle.tipoHuevoId} no encontrado`);

      const saldo = await this.getSaldoHuevo(this.prisma, detalle.tipoHuevoId);
      if (saldo < detalle.cantidad) {
        throw new BadRequestException(
          `Saldo insuficiente de ${tipoHuevo.codigo}: disponible ${saldo}, solicitado ${detalle.cantidad}`
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const despacho = await tx.despacho.create({
        data: {
          fecha: new Date(dto.fecha),
          clienteId: dto.clienteId,
          guiaRemision: dto.guiaRemision,
          observaciones: dto.observaciones,
          estado: 'PENDIENTE',
          creadoPorId: usuarioId,
        },
      });

      for (const detalle of dto.detalles) {
        await tx.despachoDetalle.create({
          data: {
            despachoId: despacho.id,
            tipoHuevoId: detalle.tipoHuevoId,
            cantidad: detalle.cantidad,
            precioUnit: detalle.precioUnit,
            pesoTotal: detalle.pesoTotal,
            observacion: detalle.observacion,
          },
        });
      }

      await this.auditService.log(
        {
          usuarioId,
          accion: 'CREAR_DESPACHO',
          entidad: 'DESPACHO',
          entidadId: despacho.id,
          cambios: { cliente: cliente.razonSocial, totalItems: dto.detalles.length },
          ip,
        },
        tx,
      );

      return tx.despacho.findUnique({
        where: { id: despacho.id },
        include: {
          cliente: true,
          detalles: { include: { tipoHuevo: { select: { codigo: true, nombre: true } } } },
          creadoPor: { select: { nombre: true, apellido: true } },
        },
      });
    });
  }

  async findAll(params: { page?: number; limit?: number; estado?: string; fechaInicio?: string; fechaFin?: string }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.estado) where.estado = params.estado;
    if (params.fechaInicio || params.fechaFin) {
      where.fecha = {};
      if (params.fechaInicio) where.fecha.gte = new Date(params.fechaInicio);
      if (params.fechaFin) where.fecha.lte = new Date(params.fechaFin);
    }

    const [data, total] = await Promise.all([
      this.prisma.despacho.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
        include: {
          cliente: true,
          detalles: { include: { tipoHuevo: { select: { codigo: true } } } },
          creadoPor: { select: { nombre: true, apellido: true } },
          _count: { select: { detalles: true } },
        },
      }),
      this.prisma.despacho.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const despacho = await this.prisma.despacho.findUnique({
      where: { id },
      include: {
        cliente: true,
        detalles: { include: { tipoHuevo: true } },
        creadoPor: { select: { nombre: true, apellido: true, email: true } },
        aprobacion: { include: { aprobadoPor: { select: { nombre: true, apellido: true } } } },
      },
    });
    if (!despacho) throw new NotFoundException('Despacho no encontrado');
    return despacho;
  }

  async approve(id: string, usuarioId: string, ip?: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const claimed = await tx.despacho.updateMany({
          where: { id, estado: { notIn: ['APROBADO', 'CANCELADO'] } },
          data: { estado: 'APROBADO' },
        });
        if (claimed.count === 0) {
          const actual = await tx.despacho.findUnique({ where: { id } });
          if (!actual) throw new NotFoundException('Despacho no encontrado');
          if (actual.estado === 'APROBADO') throw new BadRequestException('El despacho ya está aprobado');
          throw new ForbiddenException('No se puede aprobar un despacho cancelado');
        }

        const despacho = await tx.despacho.findUnique({ where: { id } });
        if (!despacho) throw new NotFoundException('Despacho no encontrado');
        const cliente = await tx.cliente.findUnique({ where: { id: despacho.clienteId } });
        const detalles = await tx.despachoDetalle.findMany({ where: { despachoId: id } });
        const fechaMovimiento = new Date();

        for (const detalle of detalles) {
          const tipoHuevo = await tx.tipoHuevo.findUnique({ where: { id: detalle.tipoHuevoId } });
          const saldo = await this.getSaldoHuevo(tx, detalle.tipoHuevoId);
          if (saldo < detalle.cantidad) {
            throw new BadRequestException(
              `Saldo insuficiente de ${tipoHuevo?.codigo ?? detalle.tipoHuevoId} al aprobar: disponible ${saldo}, solicitado ${detalle.cantidad}`
            );
          }

          await tx.movimientoHuevo.create({
            data: {
              fecha: fechaMovimiento,
              tipoMovimiento: 'DESPACHO',
              tipoHuevoId: detalle.tipoHuevoId,
              cantidad: detalle.cantidad,
              destino: cliente?.razonSocial,
              referencia: `Despacho ${id}`,
              usuarioId,
              observacion: `Despacho a ${cliente?.razonSocial ?? 'cliente'}`,
            },
          });

          await this.applyHuevoSnapshotVenta(tx, detalle.tipoHuevoId, fechaMovimiento, detalle.cantidad);
        }

        await tx.despachoAprobacion.upsert({
          where: { despachoId: id },
          update: { estado: 'APROBADO', aprobadoPorId: usuarioId, aprobadoEn: new Date() },
          create: { despachoId: id, estado: 'APROBADO', aprobadoPorId: usuarioId, aprobadoEn: new Date() },
        });

        const updated = await tx.despacho.findUnique({ where: { id } });

        await this.auditService.log(
          {
            usuarioId,
            accion: 'APROBAR_DESPACHO',
            entidad: 'DESPACHO',
            entidadId: id,
            ip,
          },
          tx,
        );

        return updated;
      },
      { timeout: 15000 },
    );
  }

  async cancel(id: string, usuarioId: string, motivo: string, ip?: string) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.despacho.updateMany({
        where: { id, estado: { notIn: ['APROBADO', 'CANCELADO'] } },
        data: { estado: 'CANCELADO', observaciones: motivo },
      });
      if (claimed.count === 0) {
        const actual = await tx.despacho.findUnique({ where: { id } });
        if (!actual) throw new NotFoundException('Despacho no encontrado');
        if (actual.estado === 'APROBADO') throw new ForbiddenException('No se puede cancelar un despacho aprobado');
        throw new ConflictException('El despacho ya está cancelado');
      }

      // Limpieza defensiva: despachos creados antes de este fix registraban el
      // movimiento al crear (estado PENDIENTE). Al cancelar, se revierten.
      await tx.movimientoHuevo.deleteMany({
        where: { referencia: `Despacho ${id}`, tipoMovimiento: 'DESPACHO' },
      });

      await this.auditService.log(
        {
          usuarioId,
          accion: 'CANCELAR_DESPACHO',
          entidad: 'DESPACHO',
          entidadId: id,
          cambios: { motivo },
          ip,
        },
        tx,
      );

      return tx.despacho.findUnique({ where: { id } });
    });
  }

  private async getSaldoHuevo(client: Tx | PrismaService, tipoHuevoId: string): Promise<number> {
    const last = await client.inventarioHuevo.findFirst({
      where: { tipoHuevoId },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (last) return Number(last.saldoFinal);

    const movs = await client.movimientoHuevo.findMany({ where: { tipoHuevoId } });
    return movs.reduce((acc, m) => {
      const cantidad = Number(m.cantidad);
      if (['ENTRADA', 'PRODUCCION', 'ENTRADA_LOTE', 'AJUSTE'].includes(m.tipoMovimiento)) {
        return acc + cantidad;
      }
      return acc - cantidad;
    }, 0);
  }

  private async applyHuevoSnapshotVenta(tx: Tx, tipoHuevoId: string, fecha: Date, cantidad: number) {
    const existing = await tx.inventarioHuevo.findUnique({
      where: { tipoHuevoId_fecha: { tipoHuevoId, fecha } },
    });

    if (existing) {
      const ventas = existing.ventas + cantidad;
      const saldoFinal = existing.saldoInicial + existing.produccion - ventas - existing.perdidas - existing.consumo;
      if (saldoFinal < 0) {
        throw new BadRequestException('El despacho dejaría el inventario de huevos con saldo negativo');
      }
      return tx.inventarioHuevo.update({
        where: { id: existing.id },
        data: { ventas, saldoFinal },
      });
    }

    const prev = await tx.inventarioHuevo.findFirst({
      where: { tipoHuevoId, fecha: { lt: fecha } },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    const saldoInicial = prev ? Number(prev.saldoFinal) : 0;
    const saldoFinal = saldoInicial - cantidad;
    if (saldoFinal < 0) {
      throw new BadRequestException('El despacho dejaría el inventario de huevos con saldo negativo');
    }
    return tx.inventarioHuevo.create({
      data: {
        tipoHuevoId,
        fecha,
        saldoInicial,
        ventas: cantidad,
        saldoFinal,
      },
    });
  }
}
