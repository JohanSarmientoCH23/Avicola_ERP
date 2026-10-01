import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IDespachoRepository } from '../../domain/ports/repositories/despacho.repository.port';

@Injectable()
export class PrismaDespachoRepository implements IDespachoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any> {
    return this.prisma.despacho.findUnique({
      where: { id },
      include: {
        creadoPor: { select: { nombre: true, apellido: true } },
        aprobacion: { include: { aprobadoPor: { select: { nombre: true, apellido: true } } } },
        detalles: { include: { tipoHuevo: true } },
      },
    });
  }

  async findMany(params?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number }): Promise<any[]> {
    return this.prisma.despacho.findMany({
      where: params?.where,
      include: params?.include || {
        creadoPor: { select: { nombre: true, apellido: true } },
        aprobacion: { include: { aprobadoPor: { select: { nombre: true, apellido: true } } } },
        _count: { select: { detalles: true } },
      },
      orderBy: params?.orderBy || { createdAt: 'desc' },
      skip: params?.skip,
      take: params?.take,
    });
  }

  async count(params?: { where?: any }): Promise<number> {
    return this.prisma.despacho.count({ where: params?.where });
  }

  async create(data: any): Promise<any> {
    return this.prisma.despacho.create({ data, include: { detalles: true } });
  }

  async update(id: string, data: any): Promise<any> {
    return this.prisma.despacho.update({ where: { id }, data });
  }
}
