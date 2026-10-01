import { ReporteOcrData } from '../../entities';

export interface IReporteOcrDataRepository {
  findByReporteId(reporteId: string): Promise<ReporteOcrData | null>;
  create(data: Partial<ReporteOcrData>): Promise<ReporteOcrData>;
  update(id: string, data: Partial<ReporteOcrData>): Promise<ReporteOcrData>;
}
