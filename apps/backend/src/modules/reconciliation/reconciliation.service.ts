import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  async generate(fecha: string, usuarioId: string) {
    const fechaDate = new Date(fecha);

    const existing = await this.prisma.conciliacion.findUnique({
      where: { fecha: fechaDate },
    });
    if (existing) throw new ConflictException('Ya existe conciliación para esta fecha');

    const comparaciones = await this.prisma.comparacion.findMany({
      where: { fecha: fechaDate },
      include: {
        detalles: true,
        detallesGalpon: { include: { galpon: true } },
      },
    });

    const conciliacion = await this.prisma.conciliacion.create({
      data: {
        fecha: fechaDate,
        estado: 'PENDIENTE',
      },
    });

    for (const comp of comparaciones) {
      for (const detalle of comp.detallesGalpon) {
        let estado = 'CORRECTO';
        const diff = Math.abs(Number(detalle.diferencia) || 0);
        if (diff > 100) estado = 'ERROR';
        else if (diff > 0) estado = 'REVISAR';

        const conceptoNombre = `Galpón ${detalle.galpon?.codigo || ''} - ${detalle.campo}`;

        let concepto = await this.prisma.conceptoConciliacion.findUnique({
          where: { nombre: conceptoNombre },
        });
        if (!concepto) {
          concepto = await this.prisma.conceptoConciliacion.create({
            data: { nombre: conceptoNombre, modulo: 'CONCILIACION' },
          });
        }

        await this.prisma.detalleConciliacion.create({
          data: {
            conciliacionId: conciliacion.id,
            comparacionId: comp.id,
            conceptoId: concepto.id,
            valorImagen: Number(detalle.valorOcr) || 0,
            valorExcel: Number(detalle.valorExcel) || 0,
            valorSistema: Number(detalle.valorOcr) || 0,
            diferencia: Number(detalle.diferencia) || 0,
            estado,
          },
        });
      }
    }

    return this.findOne(conciliacion.id);
  }

  async findOne(id: string) {
    const conciliacion = await this.prisma.conciliacion.findUnique({
      where: { id },
      include: {
        detalles: {
          include: { concepto: true },
          orderBy: { concepto: { nombre: 'asc' } },
        },
        aprobadoPor: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
    });
    if (!conciliacion) throw new NotFoundException('Conciliación no encontrada');
    return conciliacion;
  }

  async findAll(pagination: { page: number; limit: number }, filters?: { estado?: string }) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: any = {};
    if (filters?.estado) where.estado = filters.estado;

    const [data, total] = await Promise.all([
      this.prisma.conciliacion.findMany({
        skip,
        take: pagination.limit,
        where,
        orderBy: { fecha: 'desc' },
        include: {
          _count: { select: { detalles: true } },
          aprobadoPor: { select: { nombre: true, apellido: true } },
        },
      }),
      this.prisma.conciliacion.count({ where }),
    ]);
    return { data, total, page: pagination.page, totalPages: Math.ceil(total / pagination.limit) };
  }

  async approve(id: string, usuarioId: string) {
    const conciliacion = await this.prisma.conciliacion.findUnique({ where: { id } });
    if (!conciliacion) throw new NotFoundException('Conciliación no encontrada');
    if (conciliacion.estado === 'APROBADA') {
      throw new ConflictException('La conciliación ya está aprobada');
    }

    return this.prisma.conciliacion.update({
      where: { id },
      data: {
        estado: 'APROBADA',
        aprobadoPorId: usuarioId,
        aprobadoEn: new Date(),
      },
    });
  }

  async reject(id: string, observaciones: string, usuarioId: string) {
    const conciliacion = await this.prisma.conciliacion.findUnique({ where: { id } });
    if (!conciliacion) throw new NotFoundException('Conciliación no encontrada');
    if (conciliacion.estado === 'APROBADA') {
      throw new ForbiddenException('No se puede rechazar una conciliación aprobada');
    }

    return this.prisma.conciliacion.update({
      where: { id },
      data: {
        estado: 'RECHAZADA',
        observaciones,
      },
    });
  }

  async requestCorrection(id: string, observaciones: string, usuarioId: string) {
    const conciliacion = await this.prisma.conciliacion.findUnique({ where: { id } });
    if (!conciliacion) throw new NotFoundException('Conciliación no encontrada');
    if (conciliacion.estado === 'APROBADA') {
      throw new ForbiddenException('No se puede solicitar corrección de una conciliación aprobada');
    }

    return this.prisma.conciliacion.update({
      where: { id },
      data: {
        estado: 'CORRECCION_SOLICITADA',
        observaciones,
      },
    });
  }
}
