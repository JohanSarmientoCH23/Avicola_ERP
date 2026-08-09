import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email ya registrado');
    return this.prisma.usuario.create({ data: dto });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, nombre: true, apellido: true,
          rol: true, estado: true, telefono: true, createdAt: true, lastLoginAt: true,
        },
      }),
      this.prisma.usuario.count(),
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
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.usuario.update({ where: { id }, data: dto });
  }

  async updateLastLogin(id: string) {
    return this.prisma.usuario.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.usuario.update({
      where: { id },
      data: { estado: 'INACTIVO' },
    });
  }

  async changePassword(id: string, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.usuario.update({
      where: { id },
      data: { password: hashed },
    });
  }
}
