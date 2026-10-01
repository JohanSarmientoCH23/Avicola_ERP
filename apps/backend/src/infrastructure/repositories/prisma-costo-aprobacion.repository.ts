import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ICostoAprobacionRepository } from '../../domain/ports/repositories/costo-aprobacion.repository.port';
import { CostoAprobacion } from '../../domain/entities';

@Injectable()
export class PrismaCostoAprobacionRepository implements ICostoAprobacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCostoId(costoId: string): Promise<CostoAprobacion | null> {
    const data = await this.prisma.costoAprobacion.findUnique({ where: { costoId } });
    return data ? this.toDomain(data) : null;
  }

  async create(data: Partial<CostoAprobacion>): Promise<CostoAprobacion> {
    const created = await this.prisma.costoAprobacion.create({ data: data as any });
    return this.toDomain(created);
  }

  async update(id: string, data: Partial<CostoAprobacion>): Promise<CostoAprobacion> {
    const updated = await this.prisma.costoAprobacion.update({ where: { id }, data: data as any });
    return this.toDomain(updated);
  }

  private toDomain(data: any): CostoAprobacion {
    return new CostoAprobacion(
      data.id,
      data.costoId,
      data.estado,
      data.aprobadoPorId,
      data.aprobadoEn,
      data.observaciones,
      data.createdAt,
      data.updatedAt,
    );
  }
}
