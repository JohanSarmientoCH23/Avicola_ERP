import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GalponesService } from '../galpones/galpones.service';
import { CreateReportDto } from './dto/create-report.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { Prisma, Rol } from '@prisma/client';

const REPORT_INCLUDE: Prisma.ReporteDiarioInclude = {
  galponero: { select: { id: true, nombre: true, apellido: true } },
  detallesGalpon: { include: { galpon: true } },
  produccionesHuevo: { include: { tipoHuevo: true } },
  inventarioBandejas: true,
};

function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private galponesService: GalponesService,
    private auditService: AuditService,
  ) {}

  async createReport(dto: CreateReportDto, usuarioId: string, userRol?: string, ip?: string) {
    this.validateReportData(dto);
    await this.assertGalponesPermitidos(dto, usuarioId, userRol);

    const existing = await this.prisma.reporteDiario.findUnique({
      where: { fecha_galponeroId: { fecha: new Date(dto.fecha), galponeroId: usuarioId } },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un reporte para esta fecha de este galponero');
    }

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.reporteDiario.create({
        data: {
          fecha: new Date(dto.fecha),
          galponeroId: usuarioId,
          estado: 'BORRADOR',
          observaciones: dto.observaciones,
          fuente: (dto.fuente as any) || 'MANUAL',
        },
      });

      await this.writeReportData(tx, report.id, dto, report.fecha);

      await this.auditService.log({
        usuarioId,
        accion: 'CREAR_REPORTE',
        entidad: 'REPORTE_DIARIO',
        entidadId: report.id,
        cambios: { fecha: dto.fecha, fuente: dto.fuente, galpones: dto.detallesGalpon.length },
        ip,
      });

      return tx.reporteDiario.findUnique({ where: { id: report.id }, include: REPORT_INCLUDE });
    });
  }

  async updateReport(id: string, dto: CreateReportDto, usuarioId: string, userRol?: string, ip?: string) {
    this.validateReportData(dto);
    await this.assertGalponesPermitidos(dto, usuarioId, userRol);

    const report = await this.prisma.reporteDiario.findUnique({
      where: { id },
      include: { detallesGalpon: true, produccionesHuevo: true },
    });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    if (userRol === Rol.GALPONERO && report.galponeroId !== usuarioId) {
      throw new ForbiddenException('No puede editar un reporte de otro galponero');
    }

    const fechaReporte = report.fecha.toISOString().slice(0, 10);
    if (dto.fecha && dto.fecha !== fechaReporte) {
      throw new BadRequestException('No se puede cambiar la fecha de un reporte existente');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const detalle of report.detallesGalpon) {
        if (detalle.mortalidad > 0) {
          await tx.galpon.update({
            where: { id: detalle.galponId },
            data: { gallinasActuales: { increment: detalle.mortalidad } },
          });
        }
      }

      await tx.detalleGalpon.deleteMany({ where: { reporteId: id } });
      await tx.produccionHuevo.deleteMany({ where: { reporteId: id } });
      await tx.inventarioBandejaReporte.deleteMany({ where: { reporteId: id } });

      const dia = toDateOnly(report.fecha);
      const galponesAnteriores = report.detallesGalpon.map((d) => d.galponId);
      const tiposAnteriores = report.produccionesHuevo.map((p) => p.tipoHuevoId);
      if (galponesAnteriores.length > 0) {
        await tx.inventarioGallina.deleteMany({ where: { fecha: dia, galponId: { in: galponesAnteriores } } });
        await tx.inventarioAlimento.deleteMany({ where: { fecha: dia, galponId: { in: galponesAnteriores } } });
      }
      if (tiposAnteriores.length > 0) {
        await tx.inventarioHuevo.deleteMany({ where: { fecha: dia, tipoHuevoId: { in: tiposAnteriores } } });
      }

      await tx.reporteDiario.update({
        where: { id },
        data: {
          observaciones: dto.observaciones ?? null,
          fuente: (dto.fuente as any) || report.fuente,
          estado: 'BORRADOR',
        },
      });

      await this.writeReportData(tx, id, dto, report.fecha);

      await this.auditService.log({
        usuarioId,
        accion: 'ACTUALIZAR_REPORTE',
        entidad: 'REPORTE_DIARIO',
        entidadId: id,
        cambios: {
          fecha: dto.fecha,
          galpones: dto.detallesGalpon.length,
          estadoAnterior: report.estado,
          estadoNuevo: 'BORRADOR',
        },
        ip,
      });

      return tx.reporteDiario.findUnique({ where: { id }, include: REPORT_INCLUDE });
    });
  }

  private async assertGalponesPermitidos(dto: CreateReportDto, usuarioId: string, userRol?: string) {
    if (userRol !== Rol.GALPONERO) return;

    const asignaciones = await this.prisma.usuarioGalpon.findMany({
      where: { usuarioId },
      select: { galponId: true },
    });
    const permitidos = new Set(asignaciones.map((a) => a.galponId));
    const ajenos = dto.detallesGalpon.filter((d) => !permitidos.has(d.galponId));
    if (ajenos.length > 0) {
      throw new ForbiddenException('No tiene acceso a uno o más galpones incluidos en el reporte');
    }
  }

  private async writeReportData(tx: Prisma.TransactionClient, reportId: string, dto: CreateReportDto, fechaReporte: Date) {
    const dia = toDateOnly(fechaReporte);

    for (const detalle of dto.detallesGalpon) {
      const galpon = await tx.galpon.findUnique({ where: { id: detalle.galponId } });
      if (!galpon) throw new BadRequestException(`Galpón ${detalle.galponId} no encontrado`);

      const mortalidad = detalle.mortalidad || 0;
      const produccion = detalle.produccion || 0;
      const alimentoConsumo = detalle.alimentoConsumo || 0;
      const alimentoEntrada = detalle.alimentoEntrada || 0;
      const gallinas = detalle.gallinas || 0;

      if (mortalidad < 0) throw new BadRequestException(`Mortalidad no puede ser negativa en galpón ${galpon.codigo}`);
      if (produccion < 0) throw new BadRequestException(`Producción no puede ser negativa en galpón ${galpon.codigo}`);
      if (alimentoConsumo < 0) throw new BadRequestException(`Consumo de alimento no puede ser negativo en galpón ${galpon.codigo}`);
      if (alimentoEntrada < 0) throw new BadRequestException(`Entrada de alimento no puede ser negativa en galpón ${galpon.codigo}`);
      if (gallinas < 0) throw new BadRequestException(`Gallinas no puede ser negativo en galpón ${galpon.codigo}`);

      if (mortalidad > galpon.gallinasActuales) {
        throw new BadRequestException(`Mortalidad (${mortalidad}) excede gallinas actuales (${galpon.gallinasActuales}) en galpón ${galpon.codigo}`);
      }

      await tx.detalleGalpon.create({
        data: {
          reporteId: reportId,
          galponId: detalle.galponId,
          mortalidad,
          produccion,
          alimentoEntrada,
          alimentoConsumo,
          gallinas,
        },
      });

      const gallinasAntes = galpon.gallinasActuales;
      if (mortalidad > 0) {
        await tx.galpon.update({
          where: { id: detalle.galponId },
          data: { gallinasActuales: { decrement: mortalidad } },
        });
      }

      const inventarioGallinaData = {
        saldoInicial: gallinasAntes,
        entradas: 0,
        mortalidad,
        ventas: 0,
        traslados: 0,
        saldoFinal: gallinasAntes - mortalidad,
      };
      await tx.inventarioGallina.upsert({
        where: { galponId_fecha: { galponId: detalle.galponId, fecha: dia } },
        update: inventarioGallinaData,
        create: { galponId: detalle.galponId, fecha: dia, ...inventarioGallinaData },
      });

      const previoAlimento = await tx.inventarioAlimento.findFirst({
        where: { galponId: detalle.galponId, fecha: { lt: dia } },
        orderBy: { fecha: 'desc' },
        select: { saldoFinalKg: true },
      });
      const saldoInicialKg = Number(previoAlimento?.saldoFinalKg ?? 0);
      const inventarioAlimentoData = {
        saldoInicialKg,
        entradasKg: alimentoEntrada,
        consumoKg: alimentoConsumo,
        saldoFinalKg: saldoInicialKg + alimentoEntrada - alimentoConsumo,
      };
      await tx.inventarioAlimento.upsert({
        where: { galponId_fecha: { galponId: detalle.galponId, fecha: dia } },
        update: inventarioAlimentoData,
        create: { galponId: detalle.galponId, fecha: dia, ...inventarioAlimentoData },
      });
    }

    for (const prod of dto.produccionesHuevo) {
      const cantidad = prod.cantidad || 0;
      const salida = prod.salida || 0;

      if (cantidad < 0) throw new BadRequestException(`Cantidad de huevo no puede ser negativa`);
      if (salida < 0) throw new BadRequestException(`Salida de huevo no puede ser negativa`);

      await tx.produccionHuevo.create({
        data: {
          reporteId: reportId,
          tipoHuevoId: prod.tipoHuevoId,
          cantidad,
          salida,
          saldo: prod.saldo || 0,
        },
      });
    }

    const produccionHuevoAgrupada = await tx.produccionHuevo.groupBy({
      by: ['tipoHuevoId'],
      where: { reporte: { fecha: dia } },
      _sum: { cantidad: true, salida: true },
    });
    for (const grupo of produccionHuevoAgrupada) {
      const previoHuevo = await tx.inventarioHuevo.findFirst({
        where: { tipoHuevoId: grupo.tipoHuevoId, fecha: { lt: dia } },
        orderBy: { fecha: 'desc' },
        select: { saldoFinal: true },
      });
      const saldoInicial = previoHuevo?.saldoFinal ?? 0;
      const produccion = grupo._sum.cantidad ?? 0;
      const ventas = grupo._sum.salida ?? 0;
      const inventarioHuevoData = {
        saldoInicial,
        produccion,
        ventas,
        perdidas: 0,
        consumo: 0,
        saldoFinal: saldoInicial + produccion - ventas,
      };
      await tx.inventarioHuevo.upsert({
        where: { tipoHuevoId_fecha: { tipoHuevoId: grupo.tipoHuevoId, fecha: dia } },
        update: inventarioHuevoData,
        create: { tipoHuevoId: grupo.tipoHuevoId, fecha: dia, ...inventarioHuevoData },
      });
    }

    if (dto.inventarioBandejas) {
      for (const band of dto.inventarioBandejas) {
        const entradas = band.entradas || 0;
        const salidas = band.salidas || 0;

        if (entradas < 0) throw new BadRequestException(`Entradas de bandejas no puede ser negativo`);
        if (salidas < 0) throw new BadRequestException(`Salidas de bandejas no puede ser negativo`);

        await tx.inventarioBandejaReporte.create({
          data: {
            reporteId: reportId,
            tipo: band.tipo as any,
            entradas,
            salidas,
            saldoAnterior: band.saldoAnterior || 0,
            saldoBodega: band.saldoBodega || 0,
          },
        });
      }
    }
  }

  async findAllReports(pagination: PaginationDto, fecha?: string, usuarioId?: string, rol?: string) {
    const where: any = {};
    if (fecha) where.fecha = new Date(fecha);
    if (rol === Rol.GALPONERO && usuarioId) where.galponeroId = usuarioId;

    const [data, total] = await Promise.all([
      this.prisma.reporteDiario.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
        include: {
          galponero: { select: { id: true, nombre: true, apellido: true } },
          detallesGalpon: { include: { galpon: true } },
          produccionesHuevo: { include: { tipoHuevo: true } },
          inventarioBandejas: true,
        },
      }),
      this.prisma.reporteDiario.count({ where }),
    ]);
    return new PaginatedResult(data, total, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async findOneReport(id: string) {
    const report = await this.prisma.reporteDiario.findUnique({
      where: { id },
      include: {
        galponero: { select: { id: true, nombre: true, apellido: true } },
        detallesGalpon: { include: { galpon: true } },
        produccionesHuevo: { include: { tipoHuevo: true } },
        inventarioBandejas: true,
      },
    });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    return report;
  }

  async updateReportStatus(id: string, estado: string, usuarioId?: string, ip?: string) {
    const report = await this.prisma.reporteDiario.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no encontrado');

    if (report.estado === 'VALIDADO' || report.estado === 'RECHAZADO') {
      throw new ForbiddenException('No se puede modificar un reporte ya validado o rechazado');
    }

    const updated = await this.prisma.reporteDiario.update({
      where: { id },
      data: { estado: estado as any },
    });

    if (usuarioId) {
      await this.auditService.log({
        usuarioId,
        accion: 'CAMBIAR_ESTADO_REPORTE',
        entidad: 'REPORTE_DIARIO',
        entidadId: id,
        cambios: { estadoAnterior: report.estado, estadoNuevo: estado },
        ip,
      });
    }

    return updated;
  }

  async getTiposHuevo() {
    return this.prisma.tipoHuevo.findMany({ orderBy: { orden: 'asc' } });
  }

  private validateReportData(dto: CreateReportDto) {
    if (!dto.fecha) throw new BadRequestException('La fecha es requerida');
    if (!dto.detallesGalpon || dto.detallesGalpon.length === 0) {
      throw new BadRequestException('Debe incluir al menos un detalle de galpón');
    }
    if (!dto.produccionesHuevo || dto.produccionesHuevo.length === 0) {
      throw new BadRequestException('Debe incluir al menos una producción de huevo');
    }

    const galponIds = dto.detallesGalpon.map(d => d.galponId);
    const uniqueGalponIds = new Set(galponIds);
    if (uniqueGalponIds.size !== galponIds.length) {
      throw new BadRequestException('No puede haber galpones duplicados en el reporte');
    }
  }
}
