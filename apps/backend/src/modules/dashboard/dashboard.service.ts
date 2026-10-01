import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKPIs(fecha?: string, usuarioId?: string, rol?: string) {
    const fechaBase = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(fechaBase);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaBase);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
    const endOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);

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
        fecha: { gte: startOfDay, lte: endOfDay },
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

    for (const reporte of reportesHoy) {
      for (const detalle of reporte.detallesGalpon) {
        totalMortalidad += detalle.mortalidad;
        totalProduccion += detalle.produccion;
        totalGallinas += detalle.gallinas;
        totalConsumo += Number(detalle.alimentoConsumo);
        totalEntrada += Number(detalle.alimentoEntrada);
      }
    }

    const totalGallinasVivas = galpones.reduce((sum, g) => sum + g.gallinasActuales, 0);

    const porcentajePostura = totalGallinasVivas > 0
      ? ((totalProduccion / totalGallinasVivas) * 100).toFixed(2)
      : '0';

    const mortalidadPorcentaje = totalGallinasVivas > 0
      ? ((totalMortalidad / totalGallinasVivas) * 100).toFixed(2)
      : '0';

    const produccionMensual = await this.prisma.detalleGalpon.findMany({
      where: {
        reporte: { fecha: { gte: startOfMonth, lte: endOfMonth } },
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

    const inventarioHuevos = await this.prisma.inventarioHuevo.groupBy({
      by: ['tipoHuevoId'],
      _sum: { saldoFinal: true },
      orderBy: { tipoHuevoId: 'asc' },
    });

    const inventarioAlimento = await this.prisma.inventarioAlimento.aggregate({
      _sum: { saldoFinalKg: true },
      ...(galponIds ? { where: { galponId: { in: galponIds } } } : {}),
    });

    const comparaciones = await this.prisma.comparacion.findMany({
      where: { fecha: { gte: startOfDay, lte: endOfDay } },
    });

    const conciliacionesPendientes = await this.prisma.conciliacion.count({
      where: { estado: 'PENDIENTE' },
    });

    const reportesExcelHoy = await this.prisma.reporteExcel.count({
      where: { fecha: { gte: startOfDay, lte: endOfDay } },
    });

    const alertas: string[] = [];
    if (totalMortalidad > totalGallinasVivas * 0.01) {
      alertas.push('Mortalidad superior al 1% detectada');
    }
    if (comparaciones.some(c => c.estado === 'CON_DIFERENCIAS')) {
      alertas.push('Existen diferencias en la comparación de reportes');
    }
    if (Number(porcentajePostura) < 80 && totalGallinasVivas > 0) {
      alertas.push('Porcentaje de postura por debajo del 80%');
    }
    if (conciliacionesPendientes > 0) {
      alertas.push(`${conciliacionesPendientes} conciliación(es) pendiente(s)`);
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
    };
  }

  private getEmptyKPIs() {
    return {
      produccionDiaria: { total: 0, mortalidad: 0, gallinas: 0, consumo: 0, entradaAlimento: 0 },
      gallinasVivas: 0,
      porcentajePostura: 0,
      mortalidadPorcentaje: 0,
      produccionMensual: { total: 0, mortalidad: 0 },
      inventarioHuevos: [],
      inventarioAlimentoKg: 0,
      comparacionesHoy: { total: 0, correctas: 0, conDiferencias: 0 },
      conciliacionesPendientes: 0,
      reportesExcelHoy: 0,
      alertas: [],
      galponesActivos: 0,
    };
  }

  async getProduccionPorGalpon(fecha?: string, usuarioId?: string, rol?: string) {
    const fechaBase = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(fechaBase);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaBase);
    endOfDay.setHours(23, 59, 59, 999);

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
        reporte: { fecha: { gte: startOfDay, lte: endOfDay } },
        ...galponFilter,
      },
      include: { galpon: { select: { codigo: true, capacidad: true } } },
      orderBy: { galpon: { codigo: 'asc' } },
    });

    return detalles.map(d => ({
      galpon: d.galpon.codigo,
      capacidad: d.galpon.capacidad,
      mortalidad: d.mortalidad,
      produccion: d.produccion,
      gallinas: d.gallinas,
      consumo: Number(d.alimentoConsumo),
      postura: d.gallinas > 0 ? ((d.produccion / d.gallinas) * 100).toFixed(2) : '0',
    }));
  }

  async getTendenciaMensual(meses: number = 6, usuarioId?: string, rol?: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (meses - 1), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

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
        reporte: { fecha: { gte: start, lte: end } },
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
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
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
    const fechaBase = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(fechaBase);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaBase);
    endOfDay.setHours(23, 59, 59, 999);

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
        reporte: { fecha: { gte: startOfDay, lte: endOfDay } },
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
    const startOfDay = new Date(fechaBase);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaBase);
    endOfDay.setHours(23, 59, 59, 999);

    const reportes = await this.prisma.reporteDiario.findMany({
      where: {
        fecha: { gte: startOfDay, lte: endOfDay },
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
