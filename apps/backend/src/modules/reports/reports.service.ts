import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface ReportFilters {
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  galponId?: string;
  loteId?: string;
  tipoHuevoId?: string;
}

function parseFechaBase(fecha?: string): Date {
  if (!fecha) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  const parsed = new Date(fecha);
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getReporteDiario(filtros: ReportFilters) {
    const dia = parseFechaBase(filtros.fecha);
    const rango = { gte: dia, lt: addDays(dia, 1) };

    const galponFilter: any = {};
    if (filtros.galponId) galponFilter.galponId = filtros.galponId;

    const reportes = await this.prisma.reporteDiario.findMany({
      where: { fecha: rango },
      include: {
        galponero: { select: { nombre: true, apellido: true } },
        detallesGalpon: {
          where: Object.keys(galponFilter).length > 0 ? galponFilter : undefined,
          include: { galpon: true },
        },
        produccionesHuevo: {
          where: filtros.tipoHuevoId ? { tipoHuevoId: filtros.tipoHuevoId } : undefined,
          include: { tipoHuevo: true },
        },
        inventarioBandejas: true,
      },
    });

    let totalProduccion = 0;
    let totalMortalidad = 0;
    let totalConsumo = 0;

    for (const r of reportes) {
      for (const d of r.detallesGalpon) {
        totalProduccion += d.produccion;
        totalMortalidad += d.mortalidad;
        totalConsumo += Number(d.alimentoConsumo);
      }
    }

    return {
      fecha: filtros.fecha ?? dia.toISOString().slice(0, 10),
      filtros,
      resumen: { totalProduccion, totalMortalidad, totalConsumo },
      reportes,
    };
  }

  async getReporteSemanal(filtros: ReportFilters) {
    const where: any = {};
    if (filtros.fechaInicio || filtros.fechaFin) {
      where.fecha = {};
      if (filtros.fechaInicio) where.fecha.gte = parseFechaBase(filtros.fechaInicio);
      if (filtros.fechaFin) where.fecha.lt = addDays(parseFechaBase(filtros.fechaFin), 1);
    }

    const galponFilter: any = {};
    if (filtros.galponId) galponFilter.galponId = filtros.galponId;

    const reportes = await this.prisma.reporteDiario.findMany({
      where,
      include: {
        detallesGalpon: {
          where: Object.keys(galponFilter).length > 0 ? galponFilter : undefined,
          include: { galpon: true },
        },
        produccionesHuevo: { include: { tipoHuevo: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    const porDia = new Map<string, { fecha: Date; totalProduccion: number; totalMortalidad: number; totalConsumo: number }>();
    for (const r of reportes) {
      const key = r.fecha.toISOString().slice(0, 10);
      const acumulado = porDia.get(key) ?? { fecha: r.fecha, totalProduccion: 0, totalMortalidad: 0, totalConsumo: 0 };
      for (const d of r.detallesGalpon) {
        acumulado.totalProduccion += d.produccion;
        acumulado.totalMortalidad += d.mortalidad;
        acumulado.totalConsumo += Number(d.alimentoConsumo);
      }
      porDia.set(key, acumulado);
    }

    const resumen = Array.from(porDia.values()).sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime(),
    );

    return { filtros, resumen, totalReportes: reportes.length };
  }

  async getReporteMensual(anio: number, mes: number, filtros?: ReportFilters) {
    const start = new Date(Date.UTC(anio, mes - 1, 1));
    const end = new Date(Date.UTC(anio, mes, 1));

    const galponFilter: any = {};
    if (filtros?.galponId) galponFilter.galponId = filtros.galponId;

    const detalles = await this.prisma.detalleGalpon.findMany({
      where: {
        reporte: { fecha: { gte: start, lt: end } },
        ...galponFilter,
      },
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
      filtros,
      totalProduccion,
      totalMortalidad,
      totalConsumo,
      diasReportados: (await this.prisma.reporteDiario.findMany({
        where: { fecha: { gte: start, lt: end } },
        select: { fecha: true },
        distinct: ['fecha'],
      })).length,
    };
  }

  async getReporteInventarioHuevos(tipoHuevoId?: string) {
    const where: any = {};
    if (tipoHuevoId) where.tipoHuevoId = tipoHuevoId;

    const inventario = await this.prisma.inventarioHuevo.findMany({
      where,
      include: { tipoHuevo: true },
      orderBy: { fecha: 'desc' },
      take: 30,
    });

    return inventario;
  }

  async getReporteInventarioAlimento() {
    return this.prisma.inventarioAlimento.findMany({
      include: { galpon: { select: { codigo: true } } },
      orderBy: { fecha: 'desc' },
      take: 30,
    });
  }

  async getReporteInventarioAves(galponId?: string) {
    const where: any = {};
    if (galponId) where.galponId = galponId;

    return this.prisma.inventarioGallina.findMany({
      where,
      include: { galpon: { select: { codigo: true } } },
      orderBy: { fecha: 'desc' },
      take: 30,
    });
  }

  async getCSVData(tipo: string, filtros: ReportFilters) {
    const dia = parseFechaBase(filtros.fecha);
    const rango = { gte: dia, lt: addDays(dia, 1) };

    const galponFilter: any = {};
    if (filtros.galponId) galponFilter.galponId = filtros.galponId;

    if (tipo === 'diario') {
      const reportes = await this.prisma.reporteDiario.findMany({
        where: { fecha: rango },
        include: {
          galponero: { select: { nombre: true, apellido: true } },
          detallesGalpon: {
            where: Object.keys(galponFilter).length > 0 ? galponFilter : undefined,
            include: { galpon: true },
          },
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

    if (tipo === 'inventario_huevos') {
      const inventario = await this.getReporteInventarioHuevos(filtros.tipoHuevoId);
      return inventario.map(i => ({
        fecha: i.fecha.toISOString().split('T')[0],
        tipoHuevo: i.tipoHuevo.codigo,
        saldoInicial: i.saldoInicial,
        produccion: i.produccion,
        ventas: i.ventas,
        perdidas: i.perdidas,
        saldoFinal: i.saldoFinal,
      }));
    }

    if (tipo === 'inventario_alimento') {
      const inventario = await this.getReporteInventarioAlimento();
      return inventario.map(i => ({
        fecha: i.fecha.toISOString().split('T')[0],
        galpon: i.galpon?.codigo || '',
        saldoInicialKg: i.saldoInicialKg,
        entradasKg: i.entradasKg,
        consumoKg: i.consumoKg,
        saldoFinalKg: i.saldoFinalKg,
      }));
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
