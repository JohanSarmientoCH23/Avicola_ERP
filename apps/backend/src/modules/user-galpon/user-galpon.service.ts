import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AssignGalponDto } from './dto/assign-galpon.dto';

@Injectable()
export class UserGalponService {
  constructor(private prisma: PrismaService) {}

  async assign(dto: AssignGalponDto) {
    const user = await this.prisma.usuario.findUnique({ where: { id: dto.usuarioId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const galpon = await this.prisma.galpon.findUnique({ where: { id: dto.galponId } });
    if (!galpon) throw new NotFoundException('Galpón no encontrado');

    const existing = await this.prisma.usuarioGalpon.findUnique({
      where: {
        usuarioId_galponId: {
          usuarioId: dto.usuarioId,
          galponId: dto.galponId,
        },
      },
    });

    if (existing) throw new ConflictException('El usuario ya está asignado a este galpón');

    return this.prisma.usuarioGalpon.create({
      data: {
        usuarioId: dto.usuarioId,
        galponId: dto.galponId,
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true, rol: true } },
        galpon: { select: { id: true, codigo: true, capacidad: true } },
      },
    });
  }

  async unassign(usuarioId: string, galponId: string) {
    const asignacion = await this.prisma.usuarioGalpon.findUnique({
      where: {
        usuarioId_galponId: { usuarioId, galponId },
      },
    });

    if (!asignacion) throw new NotFoundException('Asignación no encontrada');

    await this.prisma.usuarioGalpon.delete({
      where: { id: asignacion.id },
    });

    return { message: 'Asignación eliminada exitosamente' };
  }

  async findByUser(usuarioId: string) {
    return this.prisma.usuarioGalpon.findMany({
      where: { usuarioId },
      include: {
        galpon: { select: { id: true, codigo: true, capacidad: true, gallinasActuales: true, estado: true } },
      },
    });
  }

  async findByGalpon(galponId: string) {
    return this.prisma.usuarioGalpon.findMany({
      where: { galponId },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true, rol: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.usuarioGalpon.findMany({
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true, rol: true } },
        galpon: { select: { id: true, codigo: true, capacidad: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    const asignacion = await this.prisma.usuarioGalpon.findUnique({ where: { id } });
    if (!asignacion) throw new NotFoundException('Asignación no encontrada');

    await this.prisma.usuarioGalpon.delete({ where: { id } });
    return { message: 'Asignación eliminada exitosamente' };
  }
}
