import { IAuditPort } from '../../ports/services/audit.port';

export interface LogoutCommand {
  userId: string;
  ip?: string;
}

export class LogoutUseCase {
  constructor(
    private readonly auditPort: IAuditPort,
    private readonly deleteRefreshTokens: (userId: string) => Promise<void>,
  ) {}

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    await this.deleteRefreshTokens(command.userId);
    await this.auditPort.log({
      usuarioId: command.userId,
      accion: 'LOGOUT',
      entidad: 'USUARIO',
      entidadId: command.userId,
      ip: command.ip,
    });
    return { message: 'Sesión cerrada exitosamente' };
  }
}
