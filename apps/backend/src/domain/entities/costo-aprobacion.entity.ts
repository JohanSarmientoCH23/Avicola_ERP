export class CostoAprobacion {
  constructor(
    public readonly id: string,
    public readonly costoId: string,
    public readonly estado: string = 'PENDIENTE',
    public readonly aprobadoPorId?: string,
    public readonly aprobadoEn?: Date,
    public readonly observaciones?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
