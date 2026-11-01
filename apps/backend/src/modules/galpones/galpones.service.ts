import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGalponDto } from './dto/create-galpon.dto';
import { UpdateGalponDto } from './dto/update-galpon.dto';
import { Rol } from '@prisma/client';

@Injectable()
export class GalponesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGalponDto) {
    return this.prisma.galpon.create({ data: dto, include: { lote: true } });
  }

  async findAll(usuarioId?: string, rol?: string) {
    const where: any = {};
    if (rol === Rol.GALPONERO && usuarioId) {
      const asignaciones = await this.prisma.usuarioGalpon.findMany({
        where: { usuarioId },
        select: { galponId: true },
      });
      const galponIds = asignaciones.map(a => a.galponId);
      if (galponIds.length === 0) return [];
      where.id = { in: galponIds };
    }

    return this.prisma.galpon.findMany({
      where,
      include: { lote: true, detallesReporte: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { codigo: 'asc' },
    });
  }

  async findOne(id: string) {
    const galpon = await this.prisma.galpon.findUnique({
      where: { id },
      include: { lote: true },
    });
    if (!galpon) throw new NotFoundException('Galpón no encontrado');
    return galpon;
  }

  async update(id: string, dto: UpdateGalponDto) {
    await this.findOne(id);
    return this.prisma.galpon.update({ where: { id }, data: dto, include: { lote: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.galpon.update({ where: { id }, data: { estado: 'INACTIVO' } });
  }

  async updateGallinas(id: string, cantidad: number) {
    return this.prisma.galpon.update({
      where: { id },
      data: { gallinasActuales: cantidad },
    });
  }
}
