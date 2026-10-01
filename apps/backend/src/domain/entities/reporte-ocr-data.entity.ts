export class ReporteOcrData {
  constructor(
    public readonly id: string,
    public readonly reporteId: string,
    public readonly imagenUrl?: string,
    public readonly imagenMinioKey?: string,
    public readonly textoOcr?: string,
    public readonly datosOcr?: any,
    public readonly confianza?: number,
    public readonly procesadoEn?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
