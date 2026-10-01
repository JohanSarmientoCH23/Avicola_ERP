import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IDespachoAprobacionRepository } from '../../domain/ports/repositories/despacho-aprobacion.repository.port';
import { DespachoAprobacion } from '../../domain/entities';

@Injectable()
export class PrismaDespachoAprobacionRepository implements IDespachoAprobacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDespachoId(despachoId: string): Promise<DespachoAprobacion | null> {
    const data = await this.prisma.despachoAprobacion.findUnique({ where: { despachoId } });
    return data ? this.toDomain(data) : null;
  }

  async create(data: Partial<DespachoAprobacion>): Promise<DespachoAprobacion> {
    const created = await this.prisma.despachoAprobacion.create({ data: data as any });
    return this.toDomain(created);
  }

  async update(id: string, data: Partial<DespachoAprobacion>): Promise<DespachoAprobacion> {
    const updated = await this.prisma.despachoAprobacion.update({ where: { id }, data: data as any });
    return this.toDomain(updated);
  }

  private toDomain(data: any): DespachoAprobacion {
    return new DespachoAprobacion(
      data.id,
      data.despachoId,
      data.estado,
      data.aprobadoPorId,
      data.aprobadoEn,
      data.observaciones,
      data.createdAt,
      data.updatedAt,
    );
  }
}
