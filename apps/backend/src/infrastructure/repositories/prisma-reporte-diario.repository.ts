import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IReporteDiarioRepository } from '../../domain/ports/repositories/reporte-diario.repository.port';

@Injectable()
export class PrismaReporteDiarioRepository implements IReporteDiarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any> {
    return this.prisma.reporteDiario.findUnique({
      where: { id },
      include: {
        galponero: { select: { nombre: true, apellido: true } },
        ocrData: true,
        detallesGalpon: { include: { galpon: true } },
        produccionesHuevo: { include: { tipoHuevo: true } },
      },
    });
  }

  async findMany(params?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number }): Promise<any[]> {
    return this.prisma.reporteDiario.findMany({
      where: params?.where,
      include: params?.include,
      orderBy: params?.orderBy || { createdAt: 'desc' },
      skip: params?.skip,
      take: params?.take,
    });
  }

  async count(params?: { where?: any }): Promise<number> {
    return this.prisma.reporteDiario.count({ where: params?.where });
  }

  async create(data: any): Promise<any> {
    return this.prisma.reporteDiario.create({ data, include: { ocrData: true } });
  }

  async update(id: string, data: any): Promise<any> {
    return this.prisma.reporteDiario.update({ where: { id }, data });
  }
}
