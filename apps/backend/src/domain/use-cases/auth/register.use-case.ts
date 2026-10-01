import { ConflictException } from '@nestjs/common';
import { IUsuarioRepository } from '../../ports/repositories/usuario.repository.port';
import { IJwtPort } from '../../ports/services/jwt.port';
import { IAuditPort } from '../../ports/services/audit.port';

export interface RegisterCommand {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  ip?: string;
}

export interface RegisterResult {
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

export class RegisterUseCase {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly jwtPort: IJwtPort,
    private readonly auditPort: IAuditPort,
    private readonly bcryptHash: (password: string, rounds: number) => Promise<string>,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const existingUser = await this.usuarioRepo.findByEmail(command.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await this.bcryptHash(command.password, 10);
    const user = await this.usuarioRepo.create({
      email: command.email,
      password: hashedPassword,
      nombre: command.nombre,
      apellido: command.apellido,
      telefono: command.telefono,
      rol: 'GALPONERO',
    } as any);

    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const accessToken = this.jwtPort.sign(payload);
    const refreshToken = this.jwtPort.sign({ sub: user.id }, { expiresIn: '7d' });

    await this.auditPort.log({
      usuarioId: user.id,
      accion: 'REGISTRO',
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
}
