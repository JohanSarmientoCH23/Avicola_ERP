import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IGalponRepository } from '../../domain/ports/repositories/galpon.repository.port';
import { Galpon } from '../../domain/entities';

@Injectable()
export class PrismaGalponRepository implements IGalponRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Galpon | null> {
    const data = await this.prisma.galpon.findUnique({
      where: { id },
      include: { lote: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByCodigo(codigo: string): Promise<Galpon | null> {
    const data = await this.prisma.galpon.findUnique({ where: { codigo } });
    return data ? this.toDomain(data) : null;
  }

  async findAll(params?: { include?: any; orderBy?: any }): Promise<Galpon[]> {
    const data = await this.prisma.galpon.findMany({
      include: params?.include,
      orderBy: params?.orderBy || { codigo: 'asc' },
    });
    return data.map(this.toDomain);
  }

  async create(data: Partial<Galpon>): Promise<any> {
    return this.prisma.galpon.create({ data: data as any, include: { lote: true } });
  }

  async update(id: string, data: Partial<Galpon>): Promise<any> {
    return this.prisma.galpon.update({ where: { id }, data: data as any, include: { lote: true } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.galpon.delete({ where: { id } });
  }

  async updateGallinas(id: string, cantidad: number): Promise<Galpon> {
    const data = await this.prisma.galpon.update({
      where: { id },
      data: { gallinasActuales: cantidad },
    });
    return this.toDomain(data);
  }

  private toDomain(data: any): Galpon {
    return new Galpon(
      data.id,
      data.codigo,
      data.capacidad,
      data.gallinasActuales,
      data.estado,
      data.loteId,
      data.descripcion,
      data.createdAt,
      data.updatedAt,
    );
  }
}
