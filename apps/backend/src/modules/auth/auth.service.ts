import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Rol } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ip?: string) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (user.estado !== 'ACTIVO') throw new UnauthorizedException('Usuario inactivo');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

    await this.usersService.updateLastLogin(user.id);

    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.auditService.log({
      usuarioId: user.id,
      accion: 'LOGIN',
      entidad: 'USUARIO',
      entidadId: user.id,
      ip,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
      },
    };
  }

  async register(dto: RegisterDto, ip?: string) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.auditService.log({
      usuarioId: user.id,
      accion: 'REGISTRO',
      entidad: 'USUARIO',
      entidadId: user.id,
      ip,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
      },
    };
  }

  async refreshToken(token: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    await this.prisma.refreshToken.delete({ where: { id: refreshToken.id } });

    const payload = {
      sub: refreshToken.usuario.id,
      email: refreshToken.usuario.email,
      rol: refreshToken.usuario.rol,
    };
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(refreshToken.usuario.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, ip?: string) {
    await this.prisma.refreshToken.deleteMany({ where: { usuarioId: userId } });
    await this.auditService.log({
      usuarioId: userId,
      accion: 'LOGOUT',
      entidad: 'USUARIO',
      entidadId: userId,
      ip,
    });
    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.jwtService.sign({ sub: userId }, { expiresIn: '7d' });
    await this.prisma.refreshToken.create({
      data: {
        token,
        usuarioId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return token;
  }
}
