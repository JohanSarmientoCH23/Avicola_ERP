export interface IAuditPort {
  log(params: {
    usuarioId: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    cambios?: any;
    ip?: string;
    userAgent?: string;
  }): Promise<void>;
}
