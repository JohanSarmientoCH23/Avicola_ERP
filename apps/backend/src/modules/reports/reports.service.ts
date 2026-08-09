import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getReporteDiario(fecha: string) {
    const fechaDate = new Date(fecha);
    const start = new Date(fechaDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fechaDate);
    end.setHours(23, 59, 59, 999);

    const reportes = await this.prisma.reporteDiario.findMany({
      where: { fecha: { gte: start, lte: end } },
      include: {
        galponero: { select: { nombre: true, apellido: true } },
        detallesGalpon: { include: { galpon: true } },
        produccionesHuevo: { include: { tipoHuevo: true } },
        inventarioBandejas: true,
      },
    });

    return { fecha, reportes };
  }

  async getReporteSemanal(fechaInicio: string, fechaFin: string) {
    const reportes = await this.prisma.reporteDiario.findMany({
      where: {
        fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
      },
      include: {
        detallesGalpon: true,
        produccionesHuevo: { include: { tipoHuevo: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    const resumen = reportes.map(r => ({
      fecha: r.fecha,
      totalProduccion: r.detallesGalpon.reduce((sum, d) => sum + d.produccion, 0),
      totalMortalidad: r.detallesGalpon.reduce((sum, d) => sum + d.mortalidad, 0),
      totalConsumo: r.detallesGalpon.reduce((sum, d) => sum + Number(d.alimentoConsumo), 0),
    }));

    return { fechaInicio, fechaFin, resumen, totalReportes: reportes.length };
  }

  async getReporteMensual(anio: number, mes: number) {
    const start = new Date(anio, mes - 1, 1);
    const end = new Date(anio, mes, 0);

    const detalles = await this.prisma.detalleGalpon.findMany({
      where: { reporte: { fecha: { gte: start, lte: end } } },
      include: { galpon: true },
    });

    let totalProduccion = 0;
    let totalMortalidad = 0;
    let totalConsumo = 0;

    for (const d of detalles) {
      totalProduccion += d.produccion;
      totalMortalidad += d.mortalidad;
      totalConsumo += Number(d.alimentoConsumo);
    }

    return {
      anio,
      mes,
      totalProduccion,
      totalMortalidad,
      totalConsumo,
      diasReportados: await this.prisma.reporteDiario.count({
        where: { fecha: { gte: start, lte: end } },
      }),
    };
  }

  async getCSVData(tipo: string, fecha?: string) {
    const fechaDate = fecha ? new Date(fecha) : new Date();
    const start = new Date(fechaDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fechaDate);
    end.setHours(23, 59, 59, 999);

    if (tipo === 'diario') {
      const reportes = await this.prisma.reporteDiario.findMany({
        where: { fecha: { gte: start, lte: end } },
        include: {
          galponero: { select: { nombre: true, apellido: true } },
          detallesGalpon: { include: { galpon: true } },
        },
      });
      const rows: any[] = [];
      for (const r of reportes) {
        for (const d of r.detallesGalpon) {
          rows.push({
            fecha: r.fecha.toISOString().split('T')[0],
            galponero: `${r.galponero.nombre} ${r.galponero.apellido}`,
            galpon: d.galpon.codigo,
            mortalidad: d.mortalidad,
            produccion: d.produccion,
            alimentoConsumo: d.alimentoConsumo,
            gallinas: d.gallinas,
          });
        }
      }
      return rows;
    }
    return [];
  }

  generateCSV(data: any[]): string {
    if (!data.length) return 'Sin datos';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
