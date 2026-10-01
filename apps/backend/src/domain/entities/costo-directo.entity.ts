export class CostoDirecto {
  constructor(
    public readonly id: string,
    public readonly categoriaId: string,
    public readonly descripcion: string,
    public readonly monto: number,
    public readonly fecha: Date,
    public readonly creadoPorId: string,
    public readonly fechaVencimiento?: Date,
    public readonly comprobanteUrl?: string,
    public readonly observaciones?: string,
    public readonly galponId?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
