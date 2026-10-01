export class Galpon {
  constructor(
    public readonly id: string,
    public readonly codigo: string,
    public readonly capacidad: number,
    public gallinasActuales: number = 0,
    public readonly estado: string = 'ACTIVO',
    public readonly loteId?: string,
    public readonly descripcion?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get isActivo(): boolean {
    return this.estado === 'ACTIVO';
  }

  get occupancyRate(): number {
    return this.capacidad > 0 ? (this.gallinasActuales / this.capacidad) * 100 : 0;
  }
}
