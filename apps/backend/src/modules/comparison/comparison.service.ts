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
    const galponesExcel = excelData?.galpones || excelData?.detalles || excelData?.data || [];
    const excelHuevos = excelData?.huevos || excelData?.clasificacion || [];

    const comparison = await this.prisma.$transaction(async tx => {
      const comp = await tx.comparacion.create({
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
        const galponExcel = galponesExcel.find(
          (g: any) => {
            const codigoExcel = String(g.codigo || g.galpon || g['galpón'] || '').toUpperCase().trim();
            const codigoOcr = detalle.galpon.codigo.toUpperCase().trim();
            return codigoExcel === codigoOcr;
          }
        );

        const getFieldValue = (obj: any, ...keys: string[]): number | undefined => {
          if (!obj) return undefined;
          for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null) return Number(obj[key]);
          }
          return undefined;
        };

        const campos = [
          { campo: 'mortalidad', valorOcr: detalle.mortalidad, valorExcel: getFieldValue(galponExcel, 'mortalidad', 'muertes', 'mort') },
          { campo: 'produccion', valorOcr: detalle.produccion, valorExcel: getFieldValue(galponExcel, 'produccion', 'producción', 'prod') },
          { campo: 'alimentoConsumo', valorOcr: Number(detalle.alimentoConsumo), valorExcel: getFieldValue(galponExcel, 'consumo', 'consumoAlimento', 'alimentoConsumo', 'consumo_alimento') },
          { campo: 'alimentoEntrada', valorOcr: Number(detalle.alimentoEntrada), valorExcel: getFieldValue(galponExcel, 'alimentoEntrada', 'entrada', 'entradaAlimento', 'alimento_entrada') },
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

          await tx.detalleComparacionGalpon.create({
            data: {
              comparacionId: comp.id,
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

        const huevoExcel = excelHuevos.find(
          (h: any) => {
            const codigoNormalizado = String(h.codigo || h.tipo || '').toUpperCase().replace(/[\.\s]/g, '');
            const codigoOcr = prod.tipoHuevo.codigo.toUpperCase().replace(/[\.\s]/g, '');
            return codigoNormalizado === codigoOcr;
          }
        );
        const valExcel = huevoExcel ? Number(huevoExcel.cantidad || huevoExcel.valor || 0) : 0;

        const diferencia = valOcr - valExcel;
        const porcentaje = valExcel > 0 ? (Math.abs(diferencia) / valExcel) * 100 : 0;

        let estado = 'CORRECTO';
        if (Math.abs(diferencia) > 0) estado = 'REVISAR';
        if (Math.abs(diferencia) > 50 || porcentaje > 5) estado = 'ERROR';

        if (estado === 'CORRECTO') camposCorrectos++;
        else camposConError++;

        await tx.detalleComparacion.create({
          data: {
            comparacionId: comp.id,
            campo: `Huevo ${prod.tipoHuevo.codigo}`,
            valorOcr: valOcr,
            valorExcel: valExcel,
            diferencia,
            estado,
          },
        });
      }

      const estadoFinal = camposConError > 0 ? 'CON_DIFERENCIAS' : 'CORRECTO';

      await tx.comparacion.update({
        where: { id: comp.id },
        data: {
          estado: estadoFinal,
          totalCampos,
          camposCorrectos,
          camposConError,
        },
      });

      return {
        comparacion: {
          id: comp.id,
          fecha: comp.fecha,
          estado: estadoFinal,
          totalCampos,
          camposCorrectos,
          camposConError,
        },
        detallesGalpon: comparacionesGalpon,
      };
    });

    return comparison;
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
