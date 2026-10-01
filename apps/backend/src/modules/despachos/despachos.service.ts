import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';

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

      const inventario = await this.prisma.inventarioHuevo.findFirst({
        where: { tipoHuevoId: detalle.tipoHuevoId },
        orderBy: { fecha: 'desc' },
      });

      if (inventario && Number(inventario.saldoFinal) < detalle.cantidad) {
        throw new BadRequestException(
          `Saldo insuficiente de ${tipoHuevo.codigo}: disponible ${inventario.saldoFinal}, solicitado ${detalle.cantidad}`
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

        await tx.movimientoHuevo.create({
          data: {
            fecha: new Date(dto.fecha),
            tipoMovimiento: 'DESPACHO',
            tipoHuevoId: detalle.tipoHuevoId,
            cantidad: detalle.cantidad,
            destino: cliente.razonSocial,
            referencia: `Despacho ${despacho.id}`,
            usuarioId,
            observacion: `Despacho a ${cliente.razonSocial}`,
          },
        });
      }

      await this.auditService.log({
        usuarioId,
        accion: 'CREAR_DESPACHO',
        entidad: 'DESPACHO',
        entidadId: despacho.id,
        cambios: { cliente: cliente.razonSocial, totalItems: dto.detalles.length },
        ip,
      });

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
    const page = params.page || 1;
    const limit = params.limit || 20;
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
        orderBy: { fecha: 'desc' },
        include: {
          cliente: true,
          detalles: { include: { tipoHuevo: { select: { codigo: true } } } },
          creadoPor: { select: { nombre: true, apellido: true } },
          _count: { select: { detalles: true } },
        },
      }),
      this.prisma.despacho.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
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
    const despacho = await this.prisma.despacho.findUnique({ where: { id } });
    if (!despacho) throw new NotFoundException('Despacho no encontrado');
    if (despacho.estado === 'APROBADO') throw new BadRequestException('El despacho ya está aprobado');
    if (despacho.estado === 'CANCELADO') throw new ForbiddenException('No se puede aprobar un despacho cancelado');

    return this.prisma.$transaction(async (tx) => {
      await tx.despachoAprobacion.upsert({
        where: { despachoId: id },
        update: { estado: 'APROBADO', aprobadoPorId: usuarioId, aprobadoEn: new Date() },
        create: { despachoId: id, estado: 'APROBADO', aprobadoPorId: usuarioId, aprobadoEn: new Date() },
      });

      const updated = await tx.despacho.update({
        where: { id },
        data: { estado: 'APROBADO' },
      });

      const detalles = await tx.despachoDetalle.findMany({ where: { despachoId: id } });
      for (const detalle of detalles) {
        const ultimoInventario = await tx.inventarioHuevo.findFirst({
          where: { tipoHuevoId: detalle.tipoHuevoId },
          orderBy: { fecha: 'desc' },
        });

        const saldoAnterior = ultimoInventario ? Number(ultimoInventario.saldoFinal) : 0;
        const nuevoSaldo = saldoAnterior - detalle.cantidad;

        await tx.inventarioHuevo.create({
          data: {
            tipoHuevoId: detalle.tipoHuevoId,
            fecha: despacho.fecha,
            saldoInicial: saldoAnterior,
            ventas: detalle.cantidad,
            saldoFinal: nuevoSaldo,
          },
        });
      }

      await this.auditService.log({
        usuarioId,
        accion: 'APROBAR_DESPACHO',
        entidad: 'DESPACHO',
        entidadId: id,
        ip,
      });

      return updated;
    });
  }

  async cancel(id: string, usuarioId: string, motivo: string, ip?: string) {
    const despacho = await this.prisma.despacho.findUnique({ where: { id } });
    if (!despacho) throw new NotFoundException('Despacho no encontrado');
    if (despacho.estado === 'APROBADO') throw new ForbiddenException('No se puede cancelar un despacho aprobado');

    await this.auditService.log({
      usuarioId,
      accion: 'CANCELAR_DESPACHO',
      entidad: 'DESPACHO',
      entidadId: id,
      cambios: { motivo },
      ip,
    });

    return this.prisma.despacho.update({
      where: { id },
      data: { estado: 'CANCELADO', observaciones: motivo },
    });
  }
}
