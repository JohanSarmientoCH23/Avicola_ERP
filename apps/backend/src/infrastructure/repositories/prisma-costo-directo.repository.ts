import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ICostoDirectoRepository } from '../../domain/ports/repositories/costo-directo.repository.port';

@Injectable()
export class PrismaCostoDirectoRepository implements ICostoDirectoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any> {
    return this.prisma.costoDirecto.findUnique({
      where: { id },
      include: {
        concepto: { include: { categoria: true } },
        galpon: true,
        creadoPor: { select: { nombre: true, apellido: true } },
        aprobacion: true,
      },
    });
  }

  async findMany(params?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number }): Promise<any[]> {
    return this.prisma.costoDirecto.findMany({
      where: params?.where,
      include: params?.include || {
        concepto: { include: { categoria: true } },
        galpon: true,
        creadoPor: { select: { nombre: true, apellido: true } },
        aprobacion: true,
      },
      orderBy: params?.orderBy || { createdAt: 'desc' },
      skip: params?.skip,
      take: params?.take,
    });
  }

  async count(params?: { where?: any }): Promise<number> {
    return this.prisma.costoDirecto.count({ where: params?.where });
  }

  async aggregate(params: { where?: any; _sum?: any }): Promise<any> {
    return this.prisma.costoDirecto.aggregate({ where: params.where, _sum: params._sum });
  }

  async create(data: any): Promise<any> {
    return this.prisma.costoDirecto.create({ data, include: { aprobacion: true } });
  }

  async update(id: string, data: any): Promise<any> {
    return this.prisma.costoDirecto.update({ where: { id }, data });
  }
}
