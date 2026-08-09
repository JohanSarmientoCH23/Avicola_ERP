import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKPIs(fecha?: string) {
    const fechaBase = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(fechaBase);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaBase);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
    const endOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);

    const reportesHoy = await this.prisma.reporteDiario.findMany({
      where: { fecha: { gte: startOfDay, lte: endOfDay } },
      include: {
        detallesGalpon: true,
        produccionesHuevo: { include: { tipoHuevo: true } },
      },
    });

    const galpones = await this.prisma.galpon.findMany({ where: { estado: 'ACTIVO' } });

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
      where: { reporte: { fecha: { gte: startOfMonth, lte: endOfMonth } } },
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
    });

    const comparaciones = await this.prisma.comparacion.findMany({
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
      alertas,
      galponesActivos: galpones.length,
    };
  }

  async getProduccionPorGalpon(fecha?: string) {
    const fechaBase = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(fechaBase);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaBase);
    endOfDay.setHours(23, 59, 59, 999);

    const detalles = await this.prisma.detalleGalpon.findMany({
      where: { reporte: { fecha: { gte: startOfDay, lte: endOfDay } } },
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

  async getTendenciaMensual(meses: number = 6) {
    const now = new Date();
    const tendencia: { mes: string; produccion: number; mortalidad: number }[] = [];

    for (let i = meses - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const produccion = await this.prisma.detalleGalpon.findMany({
        where: { reporte: { fecha: { gte: start, lte: end } } },
        select: { produccion: true, mortalidad: true },
      });

      let totalProd = 0;
      let totalMort = 0;
      for (const item of produccion) {
        totalProd += item.produccion;
        totalMort += item.mortalidad;
      }

      tendencia.push({
        mes: start.toISOString().slice(0, 7),
        produccion: totalProd,
        mortalidad: totalMort,
      });
    }

    return tendencia;
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
}
