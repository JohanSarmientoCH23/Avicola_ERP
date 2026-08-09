import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCostoDto } from './dto/create-costo.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { CreateGastoFijoDto } from './dto/create-gasto-fijo.dto';
import { Rol } from '@prisma/client';

@Injectable()
export class CostsService {
  constructor(private prisma: PrismaService) {}

  async createCategoria(dto: CreateCategoriaDto, userId: string, userRol: Rol) {
    if (userRol !== Rol.ADMINISTRADOR && userRol !== Rol.CONTADOR) {
      throw new ForbiddenException('Solo ADMIN o CONTADOR pueden crear categorías');
    }
    return this.prisma.categoriaCosto.create({ data: dto });
  }

  async getCategorias(tipo?: string) {
    const where: any = { activo: true };
    if (tipo) where.tipo = tipo;
    return this.prisma.categoriaCosto.findMany({ where, orderBy: { nombre: 'asc' } });
  }

  async createCosto(dto: CreateCostoDto, userId: string, userRol: Rol) {
    if (userRol !== Rol.ADMINISTRADOR && userRol !== Rol.CONTADOR) {
      throw new ForbiddenException('Solo ADMIN o CONTADOR pueden registrar costos');
    }
    return this.prisma.costoDirecto.create({
      data: {
        ...dto,
        fecha: new Date(dto.fecha),
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        creadoPorId: userId,
      },
      include: { categoria: true, galpon: { select: { codigo: true } } },
    });
  }

  async getCostos(params: { tipo?: string; estado?: string; fechaInicio?: string; fechaFin?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params.tipo) where.categoria = { tipo: params.tipo };
    if (params.estado) where.estado = params.estado;
    if (params.fechaInicio || params.fechaFin) {
      where.fecha = {};
      if (params.fechaInicio) where.fecha.gte = new Date(params.fechaInicio);
      if (params.fechaFin) where.fecha.lte = new Date(params.fechaFin);
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.costoDirecto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        include: { categoria: true, galpon: { select: { codigo: true } }, creadoPor: { select: { nombre: true, apellido: true } } },
      }),
      this.prisma.costoDirecto.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveCosto(id: string, userId: string, userRol: Rol) {
    if (userRol !== Rol.ADMINISTRADOR && userRol !== Rol.CONTADOR) {
      throw new ForbiddenException('Solo ADMIN o CONTADOR pueden aprobar costos');
    }
    return this.prisma.costoDirecto.update({
      where: { id },
      data: { estado: 'APROBADO', aprobadoPorId: userId, aprobadoEn: new Date() },
    });
  }

  async rejectCosto(id: string, userId: string, userRol: Rol) {
    if (userRol !== Rol.ADMINISTRADOR && userRol !== Rol.CONTADOR) {
      throw new ForbiddenException('Solo ADMIN o CONTADOR pueden rechazar costos');
    }
    return this.prisma.costoDirecto.update({
      where: { id },
      data: { estado: 'RECHAZADO', aprobadoPorId: userId, aprobadoEn: new Date() },
    });
  }

  async getResumenCostos(fechaInicio?: string, fechaFin?: string) {
    const where: any = {};
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const [totalDirecto, totalIndirecto, porCategoria, gastosFijos] = await Promise.all([
      this.prisma.costoDirecto.aggregate({
        where: { ...where, estado: 'APROBADO', categoria: { tipo: 'DIRECTO' } },
        _sum: { monto: true },
        _count: true,
      }),
      this.prisma.costoDirecto.aggregate({
        where: { ...where, estado: 'APROBADO', categoria: { tipo: 'INDIRECTO' } },
        _sum: { monto: true },
        _count: true,
      }),
      this.prisma.costoDirecto.groupBy({
        by: ['categoriaId'],
        where: { ...where, estado: 'APROBADO' },
        _sum: { monto: true },
        _count: true,
      }),
      this.prisma.gastoFijo.findMany({ where: { activo: true }, orderBy: { concepto: 'asc' } }),
    ]);

    const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + Number(g.monto), 0);

    return {
      directo: { total: Number(totalDirecto._sum.monto || 0), count: totalDirecto._count },
      indirecto: { total: Number(totalIndirecto._sum.monto || 0), count: totalIndirecto._count },
      gastosFijosMensuales: totalGastosFijos,
      totalGeneral: Number(totalDirecto._sum.monto || 0) + Number(totalIndirecto._sum.monto || 0) + totalGastosFijos,
      porCategoria,
    };
  }

  async createGastoFijo(dto: CreateGastoFijoDto, userRol: Rol) {
    if (userRol !== Rol.ADMINISTRADOR && userRol !== Rol.CONTADOR) {
      throw new ForbiddenException('Solo ADMIN o CONTADOR pueden crear gastos fijos');
    }
    return this.prisma.gastoFijo.create({
      data: { ...dto, fechaInicio: new Date(dto.fechaInicio), fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null },
    });
  }

  async getGastosFijos() {
    return this.prisma.gastoFijo.findMany({ orderBy: { concepto: 'asc' } });
  }
}
