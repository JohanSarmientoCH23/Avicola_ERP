export class Permiso {
  constructor(
    public readonly id: string,
    public readonly codigo: string,
    public readonly descripcion: string,
    public readonly modulo: string,
    public readonly createdAt?: Date,
  ) {}
}
