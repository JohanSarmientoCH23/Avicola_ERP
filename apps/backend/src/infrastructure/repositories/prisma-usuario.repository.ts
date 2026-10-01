import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IUsuarioRepository } from '../../domain/ports/repositories/usuario.repository.port';
import { Usuario } from '../../domain/entities';

@Injectable()
export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Usuario | null> {
    const data = await this.prisma.usuario.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const data = await this.prisma.usuario.findUnique({ where: { email } });
    return data ? this.toDomain(data) : null;
  }

  async findAll(params?: { skip?: number; take?: number; where?: any }): Promise<Usuario[]> {
    const data = await this.prisma.usuario.findMany({
      skip: params?.skip,
      take: params?.take,
      where: params?.where,
      orderBy: { createdAt: 'desc' },
    });
    return data.map(this.toDomain);
  }

  async count(params?: { where?: any }): Promise<number> {
    return this.prisma.usuario.count({ where: params?.where });
  }

  async create(data: Partial<Usuario>): Promise<Usuario> {
    const created = await this.prisma.usuario.create({ data: data as any });
    return this.toDomain(created);
  }

  async update(id: string, data: Partial<Usuario>): Promise<Usuario> {
    const updated = await this.prisma.usuario.update({ where: { id }, data: data as any });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  private toDomain(data: any): Usuario {
    return new Usuario(
      data.id,
      data.email,
      data.password,
      data.nombre,
      data.apellido,
      data.rol,
      data.estado,
      data.avatar,
      data.telefono,
      data.lastLoginAt,
      data.createdAt,
      data.updatedAt,
    );
  }
}
