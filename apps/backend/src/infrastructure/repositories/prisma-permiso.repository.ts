import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IPermisoRepository } from '../../domain/ports/repositories/permiso.repository.port';
import { Permiso } from '../../domain/entities';

@Injectable()
export class PrismaPermisoRepository implements IPermisoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Permiso | null> {
    const data = await this.prisma.permiso.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async findByCodigo(codigo: string): Promise<Permiso | null> {
    const data = await this.prisma.permiso.findUnique({ where: { codigo } });
    return data ? this.toDomain(data) : null;
  }

  async findAll(params?: { where?: any }): Promise<Permiso[]> {
    const data = await this.prisma.permiso.findMany({ where: params?.where, orderBy: { modulo: 'asc' } });
    return data.map(this.toDomain);
  }

  async create(data: Partial<Permiso>): Promise<Permiso> {
    const created = await this.prisma.permiso.create({ data: data as any });
    return this.toDomain(created);
  }

  async assignToRol(rol: string, permisoId: string): Promise<void> {
    await this.prisma.rolPermiso.upsert({
      where: { rol_permisoId: { rol: rol as any, permisoId } },
      update: {},
      create: { rol: rol as any, permisoId },
    });
  }

  async removeFromRol(rol: string, permisoId: string): Promise<void> {
    await this.prisma.rolPermiso.deleteMany({ where: { rol: rol as any, permisoId } });
  }

  async findByRol(rol: string): Promise<Permiso[]> {
    const data = await this.prisma.rolPermiso.findMany({
      where: { rol: rol as any },
      include: { permiso: true },
    });
    return data.map(rp => this.toDomain(rp.permiso));
  }

  private toDomain(data: any): Permiso {
    return new Permiso(data.id, data.codigo, data.descripcion, data.modulo, data.createdAt);
  }
}
