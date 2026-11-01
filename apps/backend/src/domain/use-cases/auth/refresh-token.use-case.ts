import { UnauthorizedException } from '@nestjs/common';
import { IJwtPort } from '../../ports/services/jwt.port';

export interface RefreshTokenCommand {
  token: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly jwtPort: IJwtPort,
    private readonly findRefreshToken: (token: string) => Promise<any>,
    private readonly deleteRefreshToken: (id: string) => Promise<void>,
    private readonly createRefreshToken: (userId: string) => Promise<string>,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    if (!command?.token) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    const refreshToken = await this.findRefreshToken(command.token);

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (refreshToken.usuario?.estado && refreshToken.usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    await this.deleteRefreshToken(refreshToken.id);

    const payload = {
      sub: refreshToken.usuario.id,
      email: refreshToken.usuario.email,
      rol: refreshToken.usuario.rol,
    };
    const newAccessToken = this.jwtPort.sign(payload);
    const newRefreshToken = await this.createRefreshToken(refreshToken.usuario.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
