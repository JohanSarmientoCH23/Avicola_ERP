import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Rol } from '@prisma/client';

function parseFechaBase(fecha?: string): Date {
  if (!fecha) return new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(fecha);
}

function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKPIs(fecha?: string, usuarioId?: string, rol?: string, dias?: number) {
    const diasPeriodo = Math.min(Math.max(Math.trunc(Number(dias)) || 1, 1), 365);
    const fechaBase = parseFechaBase(fecha);
    const hasta = toDateOnly(fechaBase);
    const desde = addDays(hasta, -(diasPeriodo - 1));
    const rango = { gte: desde, lt: addDays(hasta, 1) };

    const hastaPrev = addDays(desde, -1);
    const desdePrev = addDays(hastaPrev, -(diasPeriodo - 1));
    const rangoPrev = { gte: desdePrev, lt: addDays(hastaPrev, 1) };

    const inicioMes = new Date(Date.UTC(fechaBase.getFullYear(), fechaBase.getMonth(), 1));
    const finMes = new Date(Date.UTC(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1));

    let galponFilter: any = { estado: 'ACTIVO' };
    let galponIds: string[] | null = null;

    if (rol === Rol.GALPONERO && usuarioId) {
      const asignaciones = await this.prisma.usuarioGalpon.findMany({
        where: { usuarioId },
        select: { galponId: true },
      });
      galponIds = asignaciones.map(a => a.galponId);
      if (galponIds.length === 0) {
        return this.getEmptyKPIs();
      }
      galponFilter = { ...galponFilter, id: { in: galponIds } };
    }

    const galpones = await this.prisma.galpon.findMany({ where: galponFilter });
    const activeGalponIds = galpones.map(g => g.id);

    const reportesHoy = await this.prisma.reporteDiario.findMany({
      where: {
        fecha: rango,
        ...(rol === Rol.GALPONERO && usuarioId ? { galponeroId: usuarioId } : {}),
      },
      include: {
        detallesGalpon: { where: galponIds ? { galponId: { in: galponIds } } : undefined },
        produccionesHuevo: { include: { tipoHuevo: true } },
      },
    });

    let totalMortalidad = 0;
    let totalProduccion = 0;
    let totalGallinas = 0;
    let totalConsumo = 0;
    let totalEntrada = 0;
    let totalGallinasReportadas = 0;
    const galponesConReporte = new Set<string>();

    for (const reporte of reportesHoy) {
      for (const detalle of reporte.detallesGalpon) {
        totalMortalidad += detalle.mortalidad;
        totalProduccion += detalle.produccion;
        totalGallinas += detalle.gallinas;
        totalConsumo += Number(detalle.alimentoConsumo);
        totalEntrada += Number(detalle.alimentoEntrada);
        totalGallinasReportadas += detalle.gallinas || 0;
        galponesConReporte.add(detalle.galponId);
      }
    }

    const totalGallinasVivas = galpones.reduce((sum, g) => sum + g.gallinasActuales, 0);

    const basePostura = totalGallinasReportadas > 0 ? totalGallinasReportadas : totalGallinasVivas * diasPeriodo;
    const porcentajePostura = basePostura > 0
      ? ((totalProduccion / basePostura) * 100).toFixed(2)
      : '0';

    const mortalidadPorcentaje = basePostura > 0
      ? ((totalMortalidad / basePostura) * 100).toFixed(2)
      : '0';

    const previo = await this.prisma.detalleGalpon.aggregate({
      where: {
        reporte: {
          fecha: rangoPrev,
          ...(rol === Rol.GALPONERO && usuarioId ? { galponeroId: usuarioId } : {}),
        },
        ...(galponIds ? { galponId: { in: galponIds } } : {}),
      },
      _sum: { produccion: true },
    });
    const produccionAnterior = previo._sum.produccion || 0;
    const variacionPorcentaje = produccionAnterior > 0
      ? Number((((totalProduccion - produccionAnterior) / produccionAnterior) * 100).toFixed(1))
      : null;

    const produccionMensual = await this.prisma.detalleGalpon.findMany({
      where: {
        reporte: { fecha: { gte: inicioMes, lt: finMes } },
        ...(galponIds ? { galponId: { in: galponIds } } : {}),
      },
      select: { produccion: true, mortalidad: true },
    });

    let produccionMesTotal = 0;
    let mortalidadMesTotal = 0;
    for (const item of produccionMensual) {
      produccionMesTotal += item.produccion;
      mortalidadMesTotal += item.mortalidad;
    }

    const ultimaFechaHuevos = await this.prisma.inventarioHuevo.findFirst({
      orderBy: { fecha: 'desc' },
      select: { fecha: true },
    });
    const inventarioHuevosFilas = ultimaFechaHuevos
      ? await this.prisma.inventarioHuevo.findMany({
          where: { fecha: ultimaFechaHuevos.fecha },
          include: { tipoHuevo: { select: { id: true, codigo: true, nombre: true, orden: true } } },
        })
      : [];
    const inventarioHuevos = inventarioHuevosFilas
      .map((inv) => ({
        tipoHuevoId: inv.tipoHuevoId,
        _sum: { saldoFinal: inv.saldoFinal },
        tipoHuevo: inv.tipoHuevo,
      }))
      .sort((a, b) => (a.tipoHuevo?.orden ?? 999) - (b.tipoHuevo?.orden ?? 999));

    const ultimaFechaAlimento = await this.prisma.inventarioAlimento.findFirst({
      orderBy: { fecha: 'desc' },
      select: { fecha: true },
    });
    const inventarioAlimento = await this.prisma.inventarioAlimento.aggregate({
      _sum: { saldoFinalKg: true },
      where: {
        ...(galponIds ? { galponId: { in: galponIds } } : {}),
        ...(ultimaFechaAlimento ? { fecha: ultimaFechaAlimento.fecha } : {}),
      },
    });

    const comparaciones = await this.prisma.comparacion.findMany({
      where: { fecha: rango },
    });

    const conciliacionesPendientes = await this.prisma.conciliacion.count({
      where: { estado: 'PENDIENTE' },
    });

    const reportesExcelHoy = await this.prisma.reporteExcel.count({
      where: { fecha: rango },
    });

    const alertas: string[] = [];
    if (totalMortalidad > totalGallinasVivas * 0.01) {
      alertas.push('Mortalidad superior al 1% detectada');
    }
    if (comparaciones.some(c => c.estado === 'CON_DIFERENCIAS')) {
      alertas.push('Existen diferencias en la comparaciÃ³n de reportes');
    }
    if (Number(porcentajePostura) < 80 && totalGallinasVivas > 0) {
      alertas.push('Porcentaje de postura por debajo del 80%');
    }
    if (conciliacionesPendientes > 0) {
      alertas.push(`${conciliacionesPendientes} conciliaciÃ³n(es) pendiente(s)`);
    }

    return {
      produccionDiaria: {
        total: totalProduccion,
        mortalidad: totalMortalidad,
        gallinas: totalGallinas,
        consumo: totalConsumo,
        entradaAlimento: totalEntrada,
      },
      gallinasVivas: totalGallinasVivas,
      porcentajePostura: Number(porcentajePostura),
      mortalidadPorcentaje: Number(mortalidadPorcentaje),
      produccionMensual: {
        total: produccionMesTotal,
        mortalidad: mortalidadMesTotal,
      },
      periodo: { dias: diasPeriodo, desde, hasta },
      promedioDiario: Math.round(totalProduccion / diasPeriodo),
      produccionPeriodoAnterior: produccionAnterior,
      variacionPorcentaje,
      inventarioHuevos,
      inventarioAlimentoKg: Number(inventarioAlimento._sum.saldoFinalKg || 0),
      comparacionesHoy: {
        total: comparaciones.length,
        correctas: comparaciones.filter(c => c.estado === 'CORRECTO').length,
        conDiferencias: comparaciones.filter(c => c.estado === 'CON_DIFERENCIAS').length,
      },
      conciliacionesPendientes,
      reportesExcelHoy,
      alertas,
      galponesActivos: galpones.length,
      galponesConReporte: galponesConReporte.size,
      reportesRecibidos: reportesHoy.length,
    };
  }

  private getEmptyKPIs() {
    return {
      produccionDiaria: { total: 0, mortalidad: 0, gallinas: 0, consumo: 0, entradaAlimento: 0 },
      gallinasVivas: 0,
      porcentajePostura: 0,
      mortalidadPorcentaje: 0,
      produccionMensual: { total: 0, mortalidad: 0 },
      periodo: { dias: 1, desde: new Date(), hasta: new Date() },
      promedioDiario: 0,
      produccionPeriodoAnterior: 0,
      variacionPorcentaje: null,
      inventarioHuevos: [],
      inventarioAlimentoKg: 0,
      comparacionesHoy: { total: 0, correctas: 0, conDiferencias: 0 },
      conciliacionesPendientes: 0,
      reportesExcelHoy: 0,
      alertas: [],
      galponesActivos: 0,
      galponesConReporte: 0,
      reportesRecibidos: 0,
    };
  }

  async getProduccionPorGalpon(fecha?: string, usuarioId?: string, rol?: string, dias?: number) {
    const diasPeriodo = Math.min(Math.max(Math.trunc(Number(dias)) || 1, 1), 365);
    const fechaBase = parseFechaBase(fecha);
    const hasta = toDateOnly(fechaBase);
    const desde = addDays(hasta, -(diasPeriodo - 1));
    const rango = { gte: desde, lt: addDays(hasta, 1) };

    let galponFilter: any = {};
    if (rol === Rol.GALPONERO && usuarioId) {
      const asignaciones = await this.prisma.usuarioGalpon.findMany({
        where: { usuarioId },
        select: { galponId: true },
      });
      const galponIds = asignaciones.map(a => a.galponId);
      if (galponIds.length === 0) return [];
      galponFilter = { galponId: { in: galponIds } };
    }

    const agrupado = await this.prisma.detalleGalpon.groupBy({
      by: ['galponId'],
      where: {
        reporte: {
          fecha: rango,
          ...(rol === Rol.GALPONERO && usuarioId ? { galponeroId: usuarioId } : {}),
        },
        ...galponFilter,
      },
      _sum: { produccion: true, mortalidad: true, alimentoConsumo: true },
    });

    if (agrupado.length === 0) return [];

    const galpones = await this.prisma.galpon.findMany({
      where: { id: { in: agrupado.map(a => a.galponId) } },
      select: { id: true, codigo: true, capacidad: true, gallinasActuales: true },
      orderBy: { codigo: 'asc' },
    });

    const porGalpon = new Map(agrupado.map(a => [a.galponId, a]));

    return galpones.map(g => {
      const datos = porGalpon.get(g.id);
      const produccion = datos?._sum.produccion || 0;
      const mortalidad = datos?._sum.mortalidad || 0;
      const consumo = Number(datos?._sum.alimentoConsumo || 0);
      const gallinas = g.gallinasActuales;
      const meta = Math.round(gallinas * 0.8 * diasPeriodo);

      return {
        galpon: g.codigo,
        capacidad: g.capacidad,
        mortalidad,
        produccion,
        gallinas,
        consumo,
        meta,
        postura: gallinas > 0
          ? Number(((produccion / (gallinas * diasPeriodo)) * 100).toFixed(2))
          : 0,
      };
    });
  }

  async getTendenciaMensual(meses: number = 6, usuarioId?: string, rol?: string) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (meses - 1), 1));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

    let galponFilter: any = {};
    if (rol === Rol.GALPONERO && usuarioId) {
      const asignaciones = await this.prisma.usuarioGalpon.findMany({
        where: { usuarioId },
        select: { galponId: true },
      });
      const galponIds = asignaciones.map(a => a.galponId);
      if (galponIds.length === 0) return [];
      galponFilter = { galponId: { in: galponIds } };
    }

    const resultados = await this.prisma.detalleGalpon.groupBy({
      by: ['reporteId'],
      where: {
        reporte: { fecha: { gte: start, lt: end } },
        ...galponFilter,
      },
      _sum: { produccion: true, mortalidad: true },
    });

    const reportIds = resultados.map(r => r.reporteId);
    const reportes = await this.prisma.reporteDiario.findMany({
      where: { id: { in: reportIds } },
      select: { id: true, fecha: true },
    });

    const fechaMap = new Map(reportes.map(r => [r.id, r.fecha]));
    const monthData = new Map<string, { produccion: number; mortalidad: number }>();

    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      const key = d.toISOString().slice(0, 7);
      monthData.set(key, { produccion: 0, mortalidad: 0 });
    }

    for (const resultado of resultados) {
      const fecha = fechaMap.get(resultado.reporteId);
      if (fecha) {
        const key = fecha.toISOString().slice(0, 7);
        const existing = monthData.get(key);
        if (existing) {
          existing.produccion += resultado._sum.produccion || 0;
          existing.mortalidad += resultado._sum.mortalidad || 0;
        }
      }
    }

    return Array.from(monthData.entries()).map(([mes, data]) => ({
      mes,
      produccion: data.produccion,
      mortalidad: data.mortalidad,
    }));
  }

  async getCostosResumen(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const [totalDirecto, totalIndirecto] = await Promise.all([
      this.prisma.costoDirecto.aggregate({
        where: { ...where, estado: 'APROBADO', categoria: { tipo: 'DIRECTO' } },
        _sum: { monto: true },
      }),
      this.prisma.costoDirecto.aggregate({
        where: { ...where, estado: 'APROBADO', categoria: { tipo: 'INDIRECTO' } },
        _sum: { monto: true },
      }),
    ]);

    const gastosFijos = await this.prisma.gastoFijo.findMany({ where: { activo: true } });
    const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + Number(g.monto), 0);

    return {
      directo: Number(totalDirecto._sum.monto || 0),
      indirecto: Number(totalIndirecto._sum.monto || 0),
      gastosFijos: totalGastosFijos,
      total: Number(totalDirecto._sum.monto || 0) + Number(totalIndirecto._sum.monto || 0) + totalGastosFijos,
    };
  }

  async getMortalidadPorGalpon(fecha?: string, usuarioId?: string, rol?: string) {
    const fechaBase = parseFechaBase(fecha);
    const dia = toDateOnly(fechaBase);
    const rango = { gte: dia, lt: addDays(dia, 1) };

    let galponFilter: any = {};
    if (rol === Rol.GALPONERO && usuarioId) {
      const asignaciones = await this.prisma.usuarioGalpon.findMany({
        where: { usuarioId },
        select: { galponId: true },
      });
      const galponIds = asignaciones.map(a => a.galponId);
      if (galponIds.length === 0) return [];
      galponFilter = { galponId: { in: galponIds } };
    }

    const detalles = await this.prisma.detalleGalpon.findMany({
      where: {
        reporte: { fecha: rango },
        ...galponFilter,
      },
      include: { galpon: { select: { codigo: true, capacidad: true, gallinasActuales: true } } },
      orderBy: { galpon: { codigo: 'asc' } },
    });

    return detalles.map(d => {
      const mortalidadPct = d.galpon.gallinasActuales > 0
        ? (d.mortalidad / d.galpon.gallinasActuales) * 100
        : 0;

      let estado = 'NORMAL';
      if (mortalidadPct > 2) estado = 'CRITICO';
      else if (mortalidadPct > 1) estado = 'ALERTA';

      return {
        galpon: d.galpon.codigo,
        gallinasActuales: d.galpon.gallinasActuales,
        mortalidad: d.mortalidad,
        mortalidadPorcentaje: Math.round(mortalidadPct * 100) / 100,
        estado,
      };
    });
  }

  async getResumenDiario(usuarioId?: string, rol?: string) {
    const fechaBase = new Date();
    const dia = toDateOnly(fechaBase);
    const rango = { gte: dia, lt: addDays(dia, 1) };

    const reportes = await this.prisma.reporteDiario.findMany({
      where: {
        fecha: rango,
        ...(rol === Rol.GALPONERO && usuarioId ? { galponeroId: usuarioId } : {}),
      },
      include: {
        galponero: { select: { nombre: true, apellido: true } },
        _count: { select: { detallesGalpon: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reportes.map(r => ({
      id: r.id,
      fecha: r.fecha,
      fuente: r.fuente,
      estado: r.estado,
      galponero: `${r.galponero.nombre} ${r.galponero.apellido}`,
      detalleGalpones: r._count.detallesGalpon,
    }));
  }
}
