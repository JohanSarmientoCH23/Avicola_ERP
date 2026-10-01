import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSiloDto, UpdateSiloDto } from './dto';

@Injectable()
export class SiloService {
  private readonly logger = new Logger(SiloService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSiloDto) {
    const existing = await this.prisma.silo.findUnique({ where: { codigo: dto.codigo } });
    if (existing) {
      throw new ConflictException(`El silo con código ${dto.codigo} ya existe`);
    }

    const silo = await this.prisma.silo.create({
      data: {
        codigo: dto.codigo,
        capacidad: dto.capacidad,
        unidad: dto.unidad || 'KG',
        estado: dto.estado || 'ACTIVO',
        descripcion: dto.descripcion,
      },
    });

    this.logger.log(`Silo creado: ${silo.codigo}`);
    return silo;
  }

  async findAll(estado?: string) {
    const where = estado ? { estado } : {};
    return this.prisma.silo.findMany({
      where,
      include: {
        _count: { select: { inventarios: true } },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  async findOne(id: string) {
    const silo = await this.prisma.silo.findUnique({
      where: { id },
      include: {
        inventarios: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!silo) {
      throw new NotFoundException(`Silo con id ${id} no encontrado`);
    }

    return silo;
  }

  async findByCodigo(codigo: string) {
    const silo = await this.prisma.silo.findUnique({
      where: { codigo },
      include: { inventarios: true },
    });

    if (!silo) {
      throw new NotFoundException(`Silo con código ${codigo} no encontrado`);
    }

    return silo;
  }

  async update(id: string, dto: UpdateSiloDto) {
    const existing = await this.prisma.silo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Silo con id ${id} no encontrado`);
    }

    if (dto.codigo && dto.codigo !== existing.codigo) {
      const duplicate = await this.prisma.silo.findUnique({ where: { codigo: dto.codigo } });
      if (duplicate) {
        throw new ConflictException(`El código ${dto.codigo} ya está en uso`);
      }
    }

    const silo = await this.prisma.silo.update({
      where: { id },
      data: {
        ...(dto.codigo && { codigo: dto.codigo }),
        ...(dto.capacidad !== undefined && { capacidad: dto.capacidad }),
        ...(dto.unidad && { unidad: dto.unidad }),
        ...(dto.estado && { estado: dto.estado }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
      },
    });

    this.logger.log(`Silo actualizado: ${silo.codigo}`);
    return silo;
  }

  async remove(id: string) {
    const silo = await this.prisma.silo.findUnique({
      where: { id },
      include: { _count: { select: { inventarios: true } } },
    });

    if (!silo) {
      throw new NotFoundException(`Silo con id ${id} no encontrado`);
    }

    if (silo._count.inventarios > 0) {
      throw new ConflictException('No se puede eliminar un silo con registros de inventario');
    }

    await this.prisma.silo.delete({ where: { id } });
    this.logger.log(`Silo eliminado: ${silo.codigo}`);
    return { message: `Silo ${silo.codigo} eliminado` };
  }

  async toggleEstado(id: string) {
    const silo = await this.prisma.silo.findUnique({ where: { id } });
    if (!silo) {
      throw new NotFoundException(`Silo con id ${id} no encontrado`);
    }

    const newEstado = silo.estado === 'ACTIVO' ? 'MANTENIMIENTO' : 'ACTIVO';
    return this.prisma.silo.update({
      where: { id },
      data: { estado: newEstado },
    });
  }

  async getResumen() {
    const [total, activos, mantenimiento, porUnidad] = await Promise.all([
      this.prisma.silo.count(),
      this.prisma.silo.count({ where: { estado: 'ACTIVO' } }),
      this.prisma.silo.count({ where: { estado: 'MANTENIMIENTO' } }),
      this.prisma.silo.groupBy({
        by: ['unidad'],
        _count: true,
        _sum: { capacidad: true },
      }),
    ]);

    return {
      total,
      activos,
      mantenimiento,
      porUnidad: porUnidad.map(u => ({
        unidad: u.unidad,
        cantidad: u._count,
        capacidadTotal: u._sum.capacidad,
      })),
    };
  }
}
