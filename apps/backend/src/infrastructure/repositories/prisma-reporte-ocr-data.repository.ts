import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IReporteOcrDataRepository } from '../../domain/ports/repositories/reporte-ocr-data.repository.port';
import { ReporteOcrData } from '../../domain/entities';

@Injectable()
export class PrismaReporteOcrDataRepository implements IReporteOcrDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByReporteId(reporteId: string): Promise<ReporteOcrData | null> {
    const data = await this.prisma.reporteOcrData.findUnique({ where: { reporteId } });
    return data ? this.toDomain(data) : null;
  }

  async create(data: Partial<ReporteOcrData>): Promise<ReporteOcrData> {
    const created = await this.prisma.reporteOcrData.create({ data: data as any });
    return this.toDomain(created);
  }

  async update(id: string, data: Partial<ReporteOcrData>): Promise<ReporteOcrData> {
    const updated = await this.prisma.reporteOcrData.update({ where: { id }, data: data as any });
    return this.toDomain(updated);
  }

  private toDomain(data: any): ReporteOcrData {
    return new ReporteOcrData(
      data.id,
      data.reporteId,
      data.imagenUrl,
      data.imagenMinioKey,
      data.textoOcr,
      data.datosOcr,
      data.confianza,
      data.procesadoEn,
      data.createdAt,
      data.updatedAt,
    );
  }
}
