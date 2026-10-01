export class Despacho {
  constructor(
    public readonly id: string,
    public readonly fecha: Date,
    public readonly cliente: string,
    public readonly creadoPorId: string,
    public readonly estado: string = 'PENDIENTE',
    public readonly guiaRemision?: string,
    public readonly direccion?: string,
    public readonly telefono?: string,
    public readonly observaciones?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
