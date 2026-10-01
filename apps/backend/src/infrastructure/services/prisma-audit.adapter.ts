import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IAuditPort } from '../../domain/ports/services/audit.port';

@Injectable()
export class PrismaAuditAdapter implements IAuditPort {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    usuarioId: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    cambios?: any;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.prisma.auditoria.create({
      data: {
        usuarioId: params.usuarioId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        cambios: params.cambios,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }
}
