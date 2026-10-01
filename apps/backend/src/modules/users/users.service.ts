import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, creatorId?: string, ip?: string) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email ya registrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: {
        id: true, email: true, nombre: true, apellido: true,
        rol: true, estado: true, createdAt: true,
      },
    });

    if (creatorId) {
      await this.auditService.log({
        usuarioId: creatorId,
        accion: 'CREAR_USUARIO',
        entidad: 'USUARIO',
        entidadId: user.id,
        cambios: { email: user.email, nombre: user.nombre, rol: user.rol },
        ip,
      });
    }

    return user;
  }

  async findAll(pagination: PaginationDto, filters?: { rol?: string; estado?: string }): Promise<PaginatedResult<any>> {
    const where: any = {};
    if (filters?.rol) where.rol = filters.rol;
    if (filters?.estado) where.estado = filters.estado;

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, nombre: true, apellido: true,
          rol: true, estado: true, telefono: true, createdAt: true, lastLoginAt: true,
          _count: { select: { galponesAsignados: true } },
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return new PaginatedResult(data, total, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async findOne(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true, email: true, nombre: true, apellido: true,
        rol: true, estado: true, telefono: true, avatar: true,
        createdAt: true, lastLoginAt: true,
        galponesAsignados: {
          include: { galpon: { select: { id: true, codigo: true, capacidad: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto, updaterId?: string, ip?: string) {
    const existingUser = await this.findOne(id);

    if (updaterId === id) {
      throw new ForbiddenException('No puede modificar su propio usuario desde aquí');
    }

    if (existingUser.rol === Rol.ADMINISTRADOR && dto.rol && dto.rol !== Rol.ADMINISTRADOR) {
      throw new ForbiddenException('No se puede cambiar el rol de un administrador');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const { password, ...updateData } = dto as any;

    const updatePayload: any = { ...updateData };
    if (password) updatePayload.password = password;

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true, email: true, nombre: true, apellido: true,
        rol: true, estado: true, createdAt: true,
      },
    });

    if (updaterId) {
      await this.auditService.log({
        usuarioId: updaterId,
        accion: 'ACTUALIZAR_USUARIO',
        entidad: 'USUARIO',
        entidadId: id,
        cambios: updateData,
        ip,
      });
    }

    return updated;
  }

  async updateLastLogin(id: string) {
    return this.prisma.usuario.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async deactivate(id: string, deactivateId?: string, ip?: string) {
    const user = await this.findOne(id);

    if (user.rol === Rol.ADMINISTRADOR) {
      const adminCount = await this.prisma.usuario.count({ where: { rol: Rol.ADMINISTRADOR, estado: 'ACTIVO' } });
      if (adminCount <= 1) {
        throw new ForbiddenException('No se puede desactivar el único administrador del sistema');
      }
    }

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: { estado: 'INACTIVO' },
    });

    if (deactivateId) {
      await this.auditService.log({
        usuarioId: deactivateId,
        accion: 'DESACTIVAR_USUARIO',
        entidad: 'USUARIO',
        entidadId: id,
        cambios: { email: user.email, nombre: user.nombre },
        ip,
      });
    }

    return updated;
  }

  async changePassword(id: string, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.usuario.update({
      where: { id },
      data: { password: hashed },
    });
  }

  async getStats() {
    const total = await this.prisma.usuario.count();
    const activos = await this.prisma.usuario.count({ where: { estado: 'ACTIVO' } });
    const inactivos = await this.prisma.usuario.count({ where: { estado: 'INACTIVO' } });
    const bloqueados = await this.prisma.usuario.count({ where: { estado: 'BLOQUEADO' } });

    const porRol = await this.prisma.usuario.groupBy({
      by: ['rol'],
      _count: { id: true },
    });

    return { total, activos, inactivos, bloqueados, porRol };
  }
}
