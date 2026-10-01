export class ReporteDiario {
  constructor(
    public readonly id: string,
    public readonly fecha: Date,
    public readonly galponeroId: string,
    public readonly estado: string = 'BORRADOR',
    public readonly observaciones?: string,
    public readonly fuente: string = 'MANUAL',
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
