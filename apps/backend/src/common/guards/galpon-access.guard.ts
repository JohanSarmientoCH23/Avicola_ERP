import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { GALPON_ACCESS_KEY } from '../decorators/galpon-access.decorator';
import { Rol } from '@prisma/client';

@Injectable()
export class GalponAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresGalponAccess = this.reflector.getAllAndOverride<boolean>(GALPON_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresGalponAccess) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('No autenticado');

    if (user.rol === Rol.ADMINISTRADOR || user.rol === Rol.CONTADOR || user.rol === Rol.AUDITOR) {
      return true;
    }

    const galponId = request.params?.galponId || request.params?.id || request.body?.galponId;

    if (!galponId) return true;

    const asignacion = await this.prisma.usuarioGalpon.findUnique({
      where: {
        usuarioId_galponId: {
          usuarioId: user.id,
          galponId: galponId,
        },
      },
    });

    if (!asignacion) {
      throw new ForbiddenException('No tiene acceso a este galpón');
    }

    return true;
  }
}
