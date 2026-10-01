export class DespachoAprobacion {
  constructor(
    public readonly id: string,
    public readonly despachoId: string,
    public readonly estado: string = 'PENDIENTE',
    public readonly aprobadoPorId?: string,
    public readonly aprobadoEn?: Date,
    public readonly observaciones?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
