import { UnauthorizedException } from '@nestjs/common';
import { IUsuarioRepository } from '../../ports/repositories/usuario.repository.port';
import { IJwtPort } from '../../ports/services/jwt.port';
import { IAuditPort } from '../../ports/services/audit.port';

export interface LoginCommand {
  email: string;
  password: string;
  ip?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export class LoginUseCase {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly jwtPort: IJwtPort,
    private readonly auditPort: IAuditPort,
    private readonly bcryptCompare: (password: string, hash: string) => Promise<boolean>,
    private readonly bcryptHash: (password: string, rounds: number) => Promise<string>,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.usuarioRepo.findByEmail(command.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      await this.auditPort.log({
        usuarioId: user.id,
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        entidadId: user.id,
        cambios: { razon: 'Usuario inactivo' },
        ip: command.ip,
      }).catch(() => {});
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await this.bcryptCompare(command.password, user.password);
    if (!isPasswordValid) {
      await this.auditPort.log({
        usuarioId: user.id,
        accion: 'LOGIN_FALLIDO',
        entidad: 'USUARIO',
        entidadId: user.id,
        cambios: { razon: 'Contraseña incorrecta' },
        ip: command.ip,
      }).catch(() => {});
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usuarioRepo.updateLastLogin(user.id);

    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const accessToken = this.jwtPort.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.auditPort.log({
      usuarioId: user.id,
      accion: 'LOGIN',
      entidad: 'USUARIO',
      entidadId: user.id,
      ip: command.ip,
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

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.jwtPort.sign({ sub: userId }, { expiresIn: '7d' });
    // Note: refresh token persistence handled by infrastructure
    return token;
  }
}
