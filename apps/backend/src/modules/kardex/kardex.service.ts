import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, TipoBandeja } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';

type Tx = Prisma.TransactionClient;

const TIPOS_ENTRADA = ['ENTRADA', 'PRODUCCION', 'ENTRADA_LOTE', 'AJUSTE'];
const TIPO_BANDEJAS = new Set<string>(Object.values(TipoBandeja));

@Injectable()
export class KardexService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createMovimiento(dto: CreateMovimientoDto, usuarioId: string, ip?: string) {
    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }
    await this.validateReferencias(dto);

    return this.prisma.$transaction(
      async (tx) => {
        let movimiento: any;

        if (dto.tipoProducto === 'GALLINA' && dto.tipoMovimiento === 'TRASLADO') {
          movimiento = await this.createTrasladoGallinas(tx, dto, usuarioId);
        } else {
          movimiento = await this.createMovimientoSimple(tx, dto, usuarioId);
          await this.applyStockEffect(tx, dto);
        }

        await this.auditService.log(
          {
            usuarioId,
            accion: 'CREAR_MOVIMIENTO',
            entidad: 'MOVIMIENTO_INVENTARIO',
            entidadId: movimiento.id,
            cambios: {
              tipo: dto.tipoMovimiento,
              producto: dto.tipoProducto,
              cantidad: dto.cantidad,
              galpon: dto.galponId,
            },
            ip,
          },
          tx,
        );

        return movimiento;
      },
      { timeout: 15000 },
    );
  }

  async getKardex(tipoProducto: string, params: {
    galponId?: string;
    tipoHuevoId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(params.limit) || 50));

    let movimientos: any[] = [];

    const buildWhere = (extra?: any) => {
      const where: any = { ...extra };
      if (params.galponId) where.galponId = params.galponId;
      if (params.tipoHuevoId) where.tipoHuevoId = params.tipoHuevoId;
      if (params.fechaInicio || params.fechaFin) {
        where.fecha = {};
        if (params.fechaInicio) where.fecha.gte = new Date(params.fechaInicio);
        if (params.fechaFin) where.fecha.lte = new Date(params.fechaFin);
      }
      return where;
    };

    const orderBy = [{ fecha: 'asc' as Prisma.SortOrder }, { createdAt: 'asc' as Prisma.SortOrder }];
    const includeCommon = {
      usuario: { select: { nombre: true, apellido: true } },
    };

    switch (tipoProducto) {
      case 'GALLINA':
        movimientos = await this.prisma.movimientoGallina.findMany({
          where: buildWhere(),
          orderBy,
          include: { galpon: { select: { codigo: true } }, ...includeCommon },
        });
        break;
      case 'HUEVO':
        movimientos = await this.prisma.movimientoHuevo.findMany({
          where: buildWhere(),
          orderBy,
          include: { tipoHuevo: { select: { codigo: true, nombre: true } }, ...includeCommon },
        });
        break;
      case 'ALIMENTO':
        movimientos = await this.prisma.movimientoAlimento.findMany({
          where: buildWhere(),
          orderBy,
          include: { galpon: { select: { codigo: true } }, ...includeCommon },
        });
        break;
      case 'BANDEJA':
        movimientos = await this.prisma.movimientoBandeja.findMany({
          where: buildWhere(),
          orderBy,
          include: { galpon: { select: { codigo: true } }, ...includeCommon },
        });
        break;
      default:
        throw new BadRequestException('tipoProducto inválido: use GALLINA, HUEVO, ALIMENTO o BANDEJA');
    }

    const total = movimientos.length;
    const saldoActual = movimientos.reduce((acc, m) => acc + this.signedAmount(m), 0);

    const conSaldo: any[] = [];
    let acumulado = 0;
    for (const m of movimientos) {
      acumulado += this.signedAmount(m);
      conSaldo.push({ ...m, saldoCalculado: acumulado });
    }

    const desde = (page - 1) * limit;
    const pagina = conSaldo.slice(desde, desde + limit).reverse();

    return {
      data: pagina,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      saldoActual,
    };
  }

  async getResumen(tipoProducto: string, fecha?: string) {
    const fechaBase = fecha ? new Date(fecha) : new Date();
    const startOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
    const endOfMonth = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);

    const whereFecha = { fecha: { gte: startOfMonth, lte: endOfMonth } };

    let movimientos: any[] = [];

    switch (tipoProducto) {
      case 'GALLINA':
        movimientos = await this.prisma.movimientoGallina.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
      case 'HUEVO':
        movimientos = await this.prisma.movimientoHuevo.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
      case 'ALIMENTO':
        movimientos = await this.prisma.movimientoAlimento.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
      case 'BANDEJA':
        movimientos = await this.prisma.movimientoBandeja.findMany({ where: whereFecha, orderBy: { fecha: 'asc' } });
        break;
      default:
        throw new BadRequestException('tipoProducto inválido: use GALLINA, HUEVO, ALIMENTO o BANDEJA');
    }

    let entradas = 0;
    let salidas = 0;

    for (const m of movimientos) {
      const signed = this.signedAmount(m);
      if (signed >= 0) entradas += Math.abs(signed);
      else salidas += Math.abs(signed);
    }

    return {
      tipoProducto,
      mes: fechaBase.toISOString().slice(0, 7),
      entradas,
      salidas,
      saldo: entradas - salidas,
      totalMovimientos: movimientos.length,
    };
  }

  async getHistorialGalpon(galponId: string) {
    const [gallinas, alimento, bandejas] = await Promise.all([
      this.prisma.movimientoGallina.findMany({
        where: { galponId }, orderBy: { fecha: 'desc' }, take: 50,
        include: { usuario: { select: { nombre: true, apellido: true } } },
      }),
      this.prisma.movimientoAlimento.findMany({
        where: { galponId }, orderBy: { fecha: 'desc' }, take: 50,
        include: { usuario: { select: { nombre: true, apellido: true } } },
      }),
      this.prisma.movimientoBandeja.findMany({
        where: { galponId }, orderBy: { fecha: 'desc' }, take: 50,
        include: { usuario: { select: { nombre: true, apellido: true } } },
      }),
    ]);

    const todos = [
      ...gallinas.map(m => ({ ...m, tipoProducto: 'GALLINA' })),
      ...alimento.map(m => ({ ...m, tipoProducto: 'ALIMENTO' })),
      ...bandejas.map(m => ({ ...m, tipoProducto: 'BANDEJA' })),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return todos.slice(0, 100);
  }

  private signedAmount(m: { tipoMovimiento: string; cantidad?: number | null; cantidadKg?: any; destino?: string | null; origen?: string | null }): number {
    const cantidad = Number(m.cantidad ?? m.cantidadKg ?? 0);
    if (TIPOS_ENTRADA.includes(m.tipoMovimiento)) return cantidad;
    if (m.tipoMovimiento === 'TRASLADO' || m.tipoMovimiento === 'TRANSFERENCIA') {
      return m.destino && !m.origen ? -cantidad : cantidad;
    }
    return -cantidad;
  }

  private async validateReferencias(dto: CreateMovimientoDto) {
    if (dto.tipoProducto === 'GALLINA' && !dto.galponId) {
      throw new BadRequestException('galponId es requerido para movimientos de gallina');
    }
    if (dto.tipoProducto === 'HUEVO' && !dto.tipoHuevoId) {
      throw new BadRequestException('tipoHuevoId es requerido para movimientos de huevo');
    }
    if (dto.tipoProducto === 'ALIMENTO' && !dto.galponId) {
      throw new BadRequestException('galponId es requerido para movimientos de alimento');
    }
    if (dto.tipoProducto === 'BANDEJA') {
      if (!dto.galponId) {
        throw new BadRequestException('galponId es requerido para movimientos de bandejas');
      }
      if (!dto.tipoBandeja || !TIPO_BANDEJAS.has(dto.tipoBandeja)) {
        throw new BadRequestException(`tipoBandeja inválido: use ${Object.values(TipoBandeja).join(', ')}`);
      }
    }

    if (dto.galponId) {
      const galpon = await this.prisma.galpon.findUnique({ where: { id: dto.galponId } });
      if (!galpon) throw new NotFoundException('Galpón no encontrado');
    }

    if (dto.tipoHuevoId) {
      const tipoHuevo = await this.prisma.tipoHuevo.findUnique({ where: { id: dto.tipoHuevoId } });
      if (!tipoHuevo) throw new NotFoundException('Tipo de huevo no encontrado');
    }

    if (['VENTA', 'DESPACHO'].includes(dto.tipoMovimiento) && !dto.destino) {
      throw new BadRequestException('Se requiere destino para movimientos de venta/despacho');
    }
  }

  private async createMovimientoSimple(tx: Tx, dto: CreateMovimientoDto, usuarioId: string) {
    const base = {
      fecha: new Date(dto.fecha),
      tipoMovimiento: dto.tipoMovimiento,
      cantidad: dto.cantidad,
      origen: dto.origen,
      destino: dto.destino,
      referencia: dto.referencia,
      usuarioId,
      observacion: dto.observacion,
    };

    switch (dto.tipoProducto) {
      case 'GALLINA':
        return tx.movimientoGallina.create({
          data: { ...base, galponId: dto.galponId! },
          include: {
            galpon: { select: { codigo: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
      case 'HUEVO':
        return tx.movimientoHuevo.create({
          data: { ...base, tipoHuevoId: dto.tipoHuevoId! },
          include: {
            tipoHuevo: { select: { codigo: true, nombre: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
      case 'ALIMENTO':
        return tx.movimientoAlimento.create({
          data: { ...base, cantidadKg: dto.cantidad, galponId: dto.galponId },
          include: {
            galpon: { select: { codigo: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
      case 'BANDEJA':
        return tx.movimientoBandeja.create({
          data: { ...base, tipo: dto.tipoBandeja as TipoBandeja, galponId: dto.galponId },
          include: {
            galpon: { select: { codigo: true } },
            usuario: { select: { nombre: true, apellido: true } },
          },
        });
      default:
        throw new BadRequestException('tipoProducto inválido');
    }
  }

  private async createTrasladoGallinas(tx: Tx, dto: CreateMovimientoDto, usuarioId: string) {
    if (!dto.galponId) {
      throw new BadRequestException('TRASLADO de gallinas requiere galponId (galpón destino)');
    }
    if (!dto.origen) {
      throw new BadRequestException('TRASLADO de gallinas requiere "origen" con el código del galpón origen');
    }

    const destino = await tx.galpon.findUnique({ where: { id: dto.galponId } });
    if (!destino) throw new NotFoundException('Galpón destino no encontrado');

    const origen = await tx.galpon.findUnique({ where: { codigo: dto.origen } });
    if (!origen) throw new NotFoundException(`Galpón origen "${dto.origen}" no encontrado`);
    if (origen.id === destino.id) {
      throw new BadRequestException('El galpón origen y destino no pueden ser el mismo');
    }
    if (dto.cantidad > origen.gallinasActuales) {
      throw new BadRequestException(
        `La cantidad (${dto.cantidad}) excede las gallinas actuales (${origen.gallinasActuales}) del galpón origen ${origen.codigo}`
      );
    }

    const fecha = new Date(dto.fecha);
    const base = {
      fecha,
      tipoMovimiento: 'TRASLADO',
      cantidad: dto.cantidad,
      referencia: dto.referencia,
      usuarioId,
      observacion: dto.observacion,
    };

    await tx.movimientoGallina.create({
      data: { ...base, galponId: origen.id, destino: destino.codigo },
    });

    const movEntrada = await tx.movimientoGallina.create({
      data: { ...base, galponId: destino.id, origen: origen.codigo },
      include: {
        galpon: { select: { codigo: true } },
        usuario: { select: { nombre: true, apellido: true } },
      },
    });

    await this.applyGallinaSnapshot(tx, origen.id, fecha, { entradas: 0, mortalidad: 0, ventas: 0, traslados: dto.cantidad });
    await this.applyGallinaSnapshot(tx, destino.id, fecha, { entradas: dto.cantidad, mortalidad: 0, ventas: 0, traslados: 0 });

    await tx.galpon.update({
      where: { id: origen.id },
      data: { gallinasActuales: { decrement: dto.cantidad } },
    });
    await tx.galpon.update({
      where: { id: destino.id },
      data: { gallinasActuales: { increment: dto.cantidad } },
    });

    return movEntrada;
  }

  private async applyStockEffect(tx: Tx, dto: CreateMovimientoDto) {
    const fecha = new Date(dto.fecha);
    const signo = this.signedAmount({ tipoMovimiento: dto.tipoMovimiento, cantidad: dto.cantidad, destino: dto.destino, origen: dto.origen }) >= 0 ? 1 : -1;

    switch (dto.tipoProducto) {
      case 'GALLINA': {
        const galpon = await tx.galpon.findUnique({ where: { id: dto.galponId! } });
        if (!galpon) throw new NotFoundException('Galpón no encontrado');
        if (signo < 0 && dto.cantidad > galpon.gallinasActuales) {
          throw new BadRequestException(
            `La cantidad (${dto.cantidad}) excede las gallinas actuales (${galpon.gallinasActuales}) del galpón ${galpon.codigo}`
          );
        }
        await this.applyGallinaSnapshot(tx, dto.galponId!, fecha, this.gallinaDelta(dto, signo));
        await tx.galpon.update({
          where: { id: dto.galponId! },
          data: { gallinasActuales: signo > 0 ? { increment: dto.cantidad } : { decrement: dto.cantidad } },
        });
        break;
      }
      case 'HUEVO': {
        if (signo < 0) {
          const saldo = await this.getSaldoHuevo(tx, dto.tipoHuevoId!);
          if (dto.cantidad > saldo) {
            throw new BadRequestException(`Saldo insuficiente de huevos: disponible ${saldo}, solicitado ${dto.cantidad}`);
          }
        }
        await this.applyHuevoSnapshot(tx, dto.tipoHuevoId!, fecha, this.huevoDelta(dto, signo));
        break;
      }
      case 'ALIMENTO': {
        if (signo < 0) {
          const saldo = await this.getSaldoAlimento(tx, dto.galponId!);
          if (dto.cantidad > saldo) {
            throw new BadRequestException(`Saldo insuficiente de alimento: disponible ${saldo} kg, solicitado ${dto.cantidad} kg`);
          }
        }
        await this.applyAlimentoSnapshot(tx, dto.galponId!, fecha, this.alimentoDelta(dto, signo));
        break;
      }
      case 'BANDEJA': {
        const tipo = dto.tipoBandeja as TipoBandeja;
        if (signo < 0) {
          const saldo = await this.getSaldoBandeja(tx, dto.galponId!, tipo);
          if (dto.cantidad > saldo) {
            throw new BadRequestException(`Saldo insuficiente de bandejas ${tipo}: disponible ${saldo}, solicitado ${dto.cantidad}`);
          }
        }
        await this.applyBandejaSnapshot(tx, dto.galponId!, fecha, tipo, this.bandejaDelta(dto, signo));
        break;
      }
    }
  }

  private gallinaDelta(dto: CreateMovimientoDto, signo: number) {
    const zero = { entradas: 0, mortalidad: 0, ventas: 0, traslados: 0 };
    if (dto.tipoMovimiento === 'MORTALIDAD') return { ...zero, mortalidad: dto.cantidad };
    if (signo > 0) return { ...zero, entradas: dto.cantidad };
    if (dto.tipoMovimiento === 'TRASLADO' || dto.tipoMovimiento === 'TRANSFERENCIA') {
      return { ...zero, traslados: dto.cantidad };
    }
    return { ...zero, ventas: dto.cantidad };
  }

  private huevoDelta(dto: CreateMovimientoDto, signo: number) {
    const zero = { produccion: 0, ventas: 0, perdidas: 0, consumo: 0 };
    if (signo > 0) return { ...zero, produccion: dto.cantidad };
    if (dto.tipoMovimiento === 'MORTALIDAD') return { ...zero, perdidas: dto.cantidad };
    return { ...zero, ventas: dto.cantidad };
  }

  private alimentoDelta(dto: CreateMovimientoDto, signo: number) {
    const zero = { entradasKg: 0, consumoKg: 0 };
    if (signo > 0) return { ...zero, entradasKg: dto.cantidad };
    return { ...zero, consumoKg: dto.cantidad };
  }

  private bandejaDelta(dto: CreateMovimientoDto, signo: number) {
    const zero = { entradas: 0, salidas: 0 };
    if (signo > 0) return { ...zero, entradas: dto.cantidad };
    return { ...zero, salidas: dto.cantidad };
  }

  private async getSaldoHuevo(tx: Tx, tipoHuevoId: string): Promise<number> {
    const last = await tx.inventarioHuevo.findFirst({
      where: { tipoHuevoId },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (last) return Number(last.saldoFinal);
    const movs = await tx.movimientoHuevo.findMany({ where: { tipoHuevoId } });
    return movs.reduce((acc, m) => acc + this.signedAmount(m), 0);
  }

  private async getSaldoAlimento(tx: Tx, galponId: string): Promise<number> {
    const last = await tx.inventarioAlimento.findFirst({
      where: { galponId },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (last) return Number(last.saldoFinalKg);
    const movs = await tx.movimientoAlimento.findMany({ where: { galponId } });
    return movs.reduce((acc, m) => acc + this.signedAmount(m), 0);
  }

  private async getSaldoBandeja(tx: Tx, galponId: string, tipo: TipoBandeja): Promise<number> {
    const last = await tx.inventarioBandeja.findFirst({
      where: { galponId, tipo },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (last) return last.saldoBodega;
    const movs = await tx.movimientoBandeja.findMany({ where: { galponId, tipo } });
    return movs.reduce((acc, m) => acc + this.signedAmount(m), 0);
  }

  private async applyGallinaSnapshot(
    tx: Tx,
    galponId: string,
    fecha: Date,
    delta: { entradas: number; mortalidad: number; ventas: number; traslados: number },
  ) {
    const existing = await tx.inventarioGallina.findUnique({
      where: { galponId_fecha: { galponId, fecha } },
    });

    if (existing) {
      const entradas = existing.entradas + delta.entradas;
      const mortalidad = existing.mortalidad + delta.mortalidad;
      const ventas = existing.ventas + delta.ventas;
      const traslados = existing.traslados + delta.traslados;
      const saldoFinal = existing.saldoInicial + entradas - mortalidad - ventas - traslados;
      if (saldoFinal < 0) {
        throw new BadRequestException('El movimiento dejaría el inventario de gallinas con saldo negativo');
      }
      return tx.inventarioGallina.update({
        where: { id: existing.id },
        data: { entradas, mortalidad, ventas, traslados, saldoFinal },
      });
    }

    const saldoInicial = await this.getSaldoInicialGallina(tx, galponId, fecha);
    const saldoFinal = saldoInicial + delta.entradas - delta.mortalidad - delta.ventas - delta.traslados;
    if (saldoFinal < 0) {
      throw new BadRequestException('El movimiento dejaría el inventario de gallinas con saldo negativo');
    }
    return tx.inventarioGallina.create({
      data: { galponId, fecha, saldoInicial, ...delta, saldoFinal },
    });
  }

  private async applyHuevoSnapshot(
    tx: Tx,
    tipoHuevoId: string,
    fecha: Date,
    delta: { produccion: number; ventas: number; perdidas: number; consumo: number },
  ) {
    const existing = await tx.inventarioHuevo.findUnique({
      where: { tipoHuevoId_fecha: { tipoHuevoId, fecha } },
    });

    if (existing) {
      const produccion = existing.produccion + delta.produccion;
      const ventas = existing.ventas + delta.ventas;
      const perdidas = existing.perdidas + delta.perdidas;
      const consumo = existing.consumo + delta.consumo;
      const saldoFinal = existing.saldoInicial + produccion - ventas - perdidas - consumo;
      if (saldoFinal < 0) {
        throw new BadRequestException('El movimiento dejaría el inventario de huevos con saldo negativo');
      }
      return tx.inventarioHuevo.update({
        where: { id: existing.id },
        data: { produccion, ventas, perdidas, consumo, saldoFinal },
      });
    }

    const saldoInicial = await this.getSaldoInicialHuevo(tx, tipoHuevoId, fecha);
    const saldoFinal = saldoInicial + delta.produccion - delta.ventas - delta.perdidas - delta.consumo;
    if (saldoFinal < 0) {
      throw new BadRequestException('El movimiento dejaría el inventario de huevos con saldo negativo');
    }
    return tx.inventarioHuevo.create({
      data: { tipoHuevoId, fecha, saldoInicial, ...delta, saldoFinal },
    });
  }

  private async applyAlimentoSnapshot(
    tx: Tx,
    galponId: string,
    fecha: Date,
    delta: { entradasKg: number; consumoKg: number },
  ) {
    const existing = await tx.inventarioAlimento.findUnique({
      where: { galponId_fecha: { galponId, fecha } },
    });

    if (existing) {
      const entradasKg = Number(existing.entradasKg) + delta.entradasKg;
      const consumoKg = Number(existing.consumoKg) + delta.consumoKg;
      const saldoFinalKg = Number(existing.saldoInicialKg) + entradasKg - consumoKg;
      if (saldoFinalKg < 0) {
        throw new BadRequestException('El movimiento dejaría el inventario de alimento con saldo negativo');
      }
      return tx.inventarioAlimento.update({
        where: { id: existing.id },
        data: { entradasKg, consumoKg, saldoFinalKg },
      });
    }

    const saldoInicialKg = await this.getSaldoInicialAlimento(tx, galponId, fecha);
    const saldoFinalKg = saldoInicialKg + delta.entradasKg - delta.consumoKg;
    if (saldoFinalKg < 0) {
      throw new BadRequestException('El movimiento dejaría el inventario de alimento con saldo negativo');
    }
    return tx.inventarioAlimento.create({
      data: { galponId, fecha, saldoInicialKg, ...delta, saldoFinalKg },
    });
  }

  private async applyBandejaSnapshot(
    tx: Tx,
    galponId: string,
    fecha: Date,
    tipo: TipoBandeja,
    delta: { entradas: number; salidas: number },
  ) {
    const existing = await tx.inventarioBandeja.findUnique({
      where: { galponId_fecha_tipo: { galponId, fecha, tipo } },
    });

    if (existing) {
      const entradas = existing.entradas + delta.entradas;
      const salidas = existing.salidas + delta.salidas;
      const saldoBodega = existing.saldoAnterior + entradas - salidas;
      if (saldoBodega < 0) {
        throw new BadRequestException('El movimiento dejaría el inventario de bandejas con saldo negativo');
      }
      return tx.inventarioBandeja.update({
        where: { id: existing.id },
        data: { entradas, salidas, saldoBodega },
      });
    }

    const saldoAnterior = await this.getSaldoInicialBandeja(tx, galponId, tipo, fecha);
    const saldoBodega = saldoAnterior + delta.entradas - delta.salidas;
    if (saldoBodega < 0) {
      throw new BadRequestException('El movimiento dejaría el inventario de bandejas con saldo negativo');
    }
    return tx.inventarioBandeja.create({
      data: { galponId, fecha, tipo, saldoAnterior, ...delta, saldoBodega },
    });
  }

  private async getSaldoInicialGallina(tx: Tx, galponId: string, fecha: Date): Promise<number> {
    const prev = await tx.inventarioGallina.findFirst({
      where: { galponId, fecha: { lt: fecha } },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (prev) return prev.saldoFinal;
    const galpon = await tx.galpon.findUnique({ where: { id: galponId } });
    return galpon ? galpon.gallinasActuales : 0;
  }

  private async getSaldoInicialHuevo(tx: Tx, tipoHuevoId: string, fecha: Date): Promise<number> {
    const prev = await tx.inventarioHuevo.findFirst({
      where: { tipoHuevoId, fecha: { lt: fecha } },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (prev) return Number(prev.saldoFinal);
    const movs = await tx.movimientoHuevo.findMany({
      where: { tipoHuevoId, fecha: { lt: fecha } },
    });
    return movs.reduce((acc, m) => acc + this.signedAmount(m), 0);
  }

  private async getSaldoInicialAlimento(tx: Tx, galponId: string, fecha: Date): Promise<number> {
    const prev = await tx.inventarioAlimento.findFirst({
      where: { galponId, fecha: { lt: fecha } },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (prev) return Number(prev.saldoFinalKg);
    const movs = await tx.movimientoAlimento.findMany({
      where: { galponId, fecha: { lt: fecha } },
    });
    return movs.reduce((acc, m) => acc + this.signedAmount(m), 0);
  }

  private async getSaldoInicialBandeja(tx: Tx, galponId: string, tipo: TipoBandeja, fecha: Date): Promise<number> {
    const prev = await tx.inventarioBandeja.findFirst({
      where: { galponId, tipo, fecha: { lt: fecha } },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    if (prev) return prev.saldoBodega;
    const movs = await tx.movimientoBandeja.findMany({
      where: { galponId, tipo, fecha: { lt: fecha } },
    });
    return movs.reduce((acc, m) => acc + this.signedAmount(m), 0);
  }
}
