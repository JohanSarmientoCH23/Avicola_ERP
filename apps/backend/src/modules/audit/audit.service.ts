import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogParams {
  usuarioId: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  cambios?: any;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: AuditLogParams) {
    return this.prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        cambios: params.cambios || {},
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }

  async findAll(pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;
    const [data, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
      }),
      this.prisma.auditoria.count(),
    ]);
    return { data, total, page: pagination.page, totalPages: Math.ceil(total / pagination.limit) };
  }

  async findByEntity(entidad: string, entidadId: string) {
    return this.prisma.auditoria.findMany({
      where: { entidad, entidadId },
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });
  }
}
