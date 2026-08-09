import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ComparisonService {
  private readonly logger = new Logger(ComparisonService.name);

  constructor(private prisma: PrismaService) {}

  async compare(reporteOcrId: string, reporteExcelId: string, usuarioId: string) {
    const reporteOcr = await this.prisma.reporteDiario.findUnique({
      where: { id: reporteOcrId },
      include: {
        detallesGalpon: { include: { galpon: true } },
        produccionesHuevo: { include: { tipoHuevo: true } },
        inventarioBandejas: true,
      },
    });

    const reporteExcel = await this.prisma.reporteExcel.findUnique({
      where: { id: reporteExcelId },
    });

    if (!reporteOcr) throw new NotFoundException('Reporte OCR no encontrado');
    if (!reporteExcel) throw new NotFoundException('Reporte Excel no encontrado');

    const excelData = reporteExcel.datosParseados as any;

    const comparison = await this.prisma.comparacion.create({
      data: {
        fecha: reporteOcr.fecha,
        reporteOcrId,
        reporteExcelId,
        estado: 'PENDIENTE',
        creadoPorId: usuarioId,
      },
    });

    let totalCampos = 0;
    let camposCorrectos = 0;
    let camposConError = 0;

    const comparacionesGalpon: any[] = [];

    for (const detalle of reporteOcr.detallesGalpon) {
      const galponExcel = excelData?.galpones?.find(
        (g: any) => g.codigo === detalle.galpon.codigo
      );

      const campos = [
        { campo: 'mortalidad', valorOcr: detalle.mortalidad, valorExcel: galponExcel?.mortalidad },
        { campo: 'produccion', valorOcr: detalle.produccion, valorExcel: galponExcel?.produccion },
        { campo: 'alimentoConsumo', valorOcr: Number(detalle.alimentoConsumo), valorExcel: galponExcel?.consumo },
        { campo: 'alimentoEntrada', valorOcr: Number(detalle.alimentoEntrada), valorExcel: galponExcel?.alimentoEntrada },
      ];

      for (const campo of campos) {
        totalCampos++;
        const valOcr = Number(campo.valorOcr) || 0;
        const valExcel = Number(campo.valorExcel) || 0;
        const diferencia = valOcr - valExcel;
        const porcentaje = valExcel > 0 ? (Math.abs(diferencia) / valExcel) * 100 : 0;

        let estado = 'CORRECTO';
        if (Math.abs(diferencia) > 0) estado = 'REVISAR';
        if (Math.abs(diferencia) > 100 || porcentaje > 5) estado = 'ERROR';

        if (estado === 'CORRECTO') camposCorrectos++;
        else camposConError++;

        await this.prisma.detalleComparacionGalpon.create({
          data: {
            comparacionId: comparison.id,
            galponId: detalle.galponId,
            campo: campo.campo,
            valorOcr: valOcr,
            valorExcel: valExcel,
            diferencia,
            estado,
          },
        });

        comparacionesGalpon.push({
          galpon: detalle.galpon.codigo,
          campo: campo.campo,
          valorOcr: valOcr,
          valorExcel: valExcel,
          diferencia,
          estado,
        });
      }
    }

    const tiposHuevoOcr = reporteOcr.produccionesHuevo;

    for (const prod of tiposHuevoOcr) {
      totalCampos++;
      const valOcr = prod.cantidad;
      const valExcel = 0;
      const diferencia = valOcr - valExcel;
      let estado = 'CORRECTO';
      if (diferencia !== 0) estado = 'REVISAR';

      if (estado === 'CORRECTO') camposCorrectos++;
      else camposConError++;

      await this.prisma.detalleComparacion.create({
        data: {
          comparacionId: comparison.id,
          campo: `Huevo ${prod.tipoHuevo.codigo}`,
          valorOcr: valOcr,
          valorExcel: valExcel,
          diferencia,
          estado,
        },
      });
    }

    const estadoFinal = camposConError > 0 ? 'CON_DIFERENCIAS' : 'CORRECTO';

    await this.prisma.comparacion.update({
      where: { id: comparison.id },
      data: {
        estado: estadoFinal,
        totalCampos,
        camposCorrectos,
        camposConError,
      },
    });

    return {
      comparacion: {
        id: comparison.id,
        fecha: comparison.fecha,
        estado: estadoFinal,
        totalCampos,
        camposCorrectos,
        camposConError,
      },
      detallesGalpon: comparacionesGalpon,
    };
  }

  async findAll(pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;
    const [data, total] = await Promise.all([
      this.prisma.comparacion.findMany({
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporteOcr: {
            select: { id: true, fecha: true, fuente: true },
          },
          reporteExcel: {
            select: { id: true, fecha: true, nombreArchivo: true },
          },
        },
      }),
      this.prisma.comparacion.count(),
    ]);
    return { data, total, page: pagination.page, totalPages: Math.ceil(total / pagination.limit) };
  }

  async findOne(id: string) {
    const comparacion = await this.prisma.comparacion.findUnique({
      where: { id },
      include: {
        reporteOcr: {
          include: {
            detallesGalpon: { include: { galpon: true } },
            produccionesHuevo: { include: { tipoHuevo: true } },
          },
        },
        reporteExcel: true,
        detalles: true,
        detallesGalpon: { include: { galpon: true } },
      },
    });
    if (!comparacion) throw new NotFoundException('Comparación no encontrada');
    return comparacion;
  }

  async getStats(fecha: string) {
    const start = new Date(fecha);
    const end = new Date(fecha);
    end.setDate(end.getDate() + 1);

    const comparaciones = await this.prisma.comparacion.findMany({
      where: { fecha: { gte: start, lt: end } },
    });

    return {
      total: comparaciones.length,
      correctas: comparaciones.filter(c => c.estado === 'CORRECTO').length,
      conDiferencias: comparaciones.filter(c => c.estado === 'CON_DIFERENCIAS').length,
      errores: comparaciones.filter(c => c.estado === 'ERROR').length,
    };
  }
}
