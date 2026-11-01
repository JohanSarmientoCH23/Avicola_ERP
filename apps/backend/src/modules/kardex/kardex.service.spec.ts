import { Test, TestingModule } from '@nestjs/testing';
import { KardexService } from './kardex.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('KardexService', () => {
  let service: KardexService;
  let prisma: any;
  let auditService: any;
  let tx: any;

  const mockMovimientoHuevo = {
    id: 'mov-1',
    fecha: new Date('2026-03-15'),
    tipoMovimiento: 'ENTRADA',
    cantidad: 100,
    tipoHuevoId: 'tipo-1',
    origen: 'PRODUCCION',
    destino: null,
    usuarioId: 'user-1',
    createdAt: new Date(),
    tipoHuevo: { codigo: 'JUMBO', nombre: 'Jumbo' },
    usuario: { nombre: 'Test', apellido: 'User' },
  };

  beforeEach(async () => {
    tx = {
      movimientoHuevo: {
        create: jest.fn().mockResolvedValue(mockMovimientoHuevo),
        findMany: jest.fn().mockResolvedValue([]),
      },
      movimientoGallina: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      movimientoAlimento: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      movimientoBandeja: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      inventarioHuevo: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      inventarioGallina: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      inventarioAlimento: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      inventarioBandeja: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      galpon: {
        findUnique: jest.fn().mockResolvedValue({ id: 'galpon-1', codigo: '1A', gallinasActuales: 25000 }),
        update: jest.fn().mockResolvedValue({}),
      },
      tipoHuevo: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tipo-1', codigo: 'JUMBO' }),
      },
      auditoria: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prisma = {
      $transaction: jest.fn(async (fn: any) => fn(tx)),
      movimientoHuevo: {
        findMany: jest.fn().mockResolvedValue([mockMovimientoHuevo]),
      },
      movimientoGallina: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      movimientoAlimento: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      movimientoBandeja: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      galpon: tx.galpon,
      tipoHuevo: tx.tipoHuevo,
    };

    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KardexService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<KardexService>(KardexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMovimiento', () => {
    it('should create an entry movement and update snapshot atomically', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'ENTRADA',
        tipoProducto: 'HUEVO',
        cantidad: 100,
        tipoHuevoId: 'tipo-1',
      };

      const result = await service.createMovimiento(dto as any, 'user-1');
      expect(result).toEqual(mockMovimientoHuevo);
      expect(tx.movimientoHuevo.create).toHaveBeenCalled();
      expect(tx.inventarioHuevo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipoHuevoId: 'tipo-1',
            saldoInicial: 0,
            produccion: 100,
            saldoFinal: 100,
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should reject zero and negative quantities', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'ENTRADA',
        tipoProducto: 'HUEVO',
        cantidad: 0,
        tipoHuevoId: 'tipo-1',
      };

      await expect(service.createMovimiento(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject egg movement without tipoHuevoId', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'ENTRADA',
        tipoProducto: 'HUEVO',
        cantidad: 100,
      };

      await expect(service.createMovimiento(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject gallina movement without galponId', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'ENTRADA',
        tipoProducto: 'GALLINA',
        cantidad: 10,
      };

      await expect(service.createMovimiento(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject venta without destino', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'VENTA',
        tipoProducto: 'HUEVO',
        cantidad: 100,
        tipoHuevoId: 'tipo-1',
      };

      await expect(service.createMovimiento(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject salida that exceeds stock', async () => {
      tx.inventarioHuevo.findFirst.mockResolvedValue({ saldoFinal: 50 });
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'VENTA',
        tipoProducto: 'HUEVO',
        cantidad: 100,
        tipoHuevoId: 'tipo-1',
        destino: 'Cliente X',
      };

      await expect(service.createMovimiento(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should create dual movements for gallina TRASLADO', async () => {
      tx.galpon.findUnique.mockImplementation(({ where }: any) => {
        if (where.codigo === '1A') return Promise.resolve({ id: 'galpon-origen', codigo: '1A', gallinasActuales: 100 });
        if (where.id === 'galpon-origen') return Promise.resolve({ id: 'galpon-origen', codigo: '1A', gallinasActuales: 100 });
        if (where.id === 'galpon-destino') return Promise.resolve({ id: 'galpon-destino', codigo: '2B', gallinasActuales: 0 });
        return Promise.resolve(null);
      });
      tx.movimientoGallina.create
        .mockResolvedValueOnce({ id: 'mov-salida' })
        .mockResolvedValueOnce({
          id: 'mov-entrada',
          galpon: { codigo: '2B' },
          usuario: { nombre: 'T', apellido: 'U' },
        });

      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'TRASLADO',
        tipoProducto: 'GALLINA',
        cantidad: 30,
        galponId: 'galpon-destino',
        origen: '1A',
      };

      const result = await service.createMovimiento(dto as any, 'user-1');
      expect(result.id).toBe('mov-entrada');
      expect(tx.movimientoGallina.create).toHaveBeenCalledTimes(2);
      expect(tx.galpon.update).toHaveBeenCalledTimes(2);
    });

    it('should reject TRASLADO exceeding origin stock', async () => {
      tx.galpon.findUnique.mockImplementation(({ where }: any) => {
        if (where.codigo === '1A') return Promise.resolve({ id: 'galpon-origen', codigo: '1A', gallinasActuales: 10 });
        if (where.id === 'galpon-destino') return Promise.resolve({ id: 'galpon-destino', codigo: '2B', gallinasActuales: 0 });
        return Promise.resolve(null);
      });

      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'TRASLADO',
        tipoProducto: 'GALLINA',
        cantidad: 50,
        galponId: 'galpon-destino',
        origen: '1A',
      };

      await expect(service.createMovimiento(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getKardex', () => {
    it('should return paginated movements with full-history saldo', async () => {
      const result = await service.getKardex('HUEVO', {});
      expect(result.data.length).toBe(1);
      expect(result.data[0].saldoCalculado).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.saldoActual).toBe(100);
    });

    it('should compute saldo across the full history, not just the page', async () => {
      prisma.movimientoHuevo.findMany.mockResolvedValue([
        { ...mockMovimientoHuevo, id: 'm1', tipoMovimiento: 'ENTRADA', cantidad: 100 },
        { ...mockMovimientoHuevo, id: 'm2', tipoMovimiento: 'ENTRADA', cantidad: 50 },
        { ...mockMovimientoHuevo, id: 'm3', tipoMovimiento: 'VENTA', cantidad: 30 },
      ]);

      const result = await service.getKardex('HUEVO', { page: 2, limit: 2 });
      expect(result.saldoActual).toBe(120);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it('should clamp invalid page/limit instead of dividing by zero', async () => {
      const result = await service.getKardex('HUEVO', { page: 0 as any, limit: 0 as any });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(Number.isFinite(result.totalPages)).toBe(true);
    });
  });

  describe('getResumen', () => {
    it('should return monthly summary', async () => {
      prisma.movimientoHuevo.findMany.mockResolvedValue([
        { ...mockMovimientoHuevo, tipoMovimiento: 'ENTRADA', cantidad: 200 },
        { ...mockMovimientoHuevo, tipoMovimiento: 'SALIDA', cantidad: 50 },
      ]);

      const result = await service.getResumen('HUEVO');
      expect(result.entradas).toBe(200);
      expect(result.salidas).toBe(50);
      expect(result.saldo).toBe(150);
    });
  });
});
