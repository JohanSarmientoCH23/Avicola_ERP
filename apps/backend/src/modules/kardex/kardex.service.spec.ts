import { Test, TestingModule } from '@nestjs/testing';
import { KardexService } from './kardex.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('KardexService', () => {
  let service: KardexService;
  let prisma: any;
  let auditService: any;

  const mockMovimiento = {
    id: 'uuid-1',
    fecha: new Date('2026-03-15'),
    tipoMovimiento: 'ENTRADA',
    tipoProducto: 'HUEVO',
    cantidad: 100,
    productoRef: 'JUMBO',
    galponId: 'galpon-1',
    tipoHuevoId: 'tipo-1',
    origen: 'PRODUCCION',
    usuarioId: 'user-1',
    createdAt: new Date(),
    galpon: { codigo: '1A' },
    tipoHuevo: { codigo: 'JUMBO', nombre: 'Jumbo' },
    usuario: { nombre: 'Test', apellido: 'User' },
  };

  beforeEach(async () => {
    prisma = {
      movimientoInventario: {
        create: jest.fn().mockResolvedValue(mockMovimiento),
        findMany: jest.fn().mockResolvedValue([mockMovimiento]),
        count: jest.fn().mockResolvedValue(1),
      },
      saldoInventario: {
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
    it('should create an entry movement', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'ENTRADA',
        tipoProducto: 'HUEVO',
        cantidad: 100,
        productoRef: 'JUMBO',
        galponId: 'galpon-1',
        tipoHuevoId: 'tipo-1',
        origen: 'PRODUCCION',
        destino: undefined,
        referencia: undefined,
        observacion: undefined,
      };

      const result = await service.createMovimiento(dto as any, 'user-1');
      expect(result).toEqual(mockMovimiento);
      expect(prisma.movimientoInventario.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should reject negative quantities', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'ENTRADA',
        tipoProducto: 'HUEVO',
        cantidad: -5,
        galponId: 'galpon-1',
      };

      await expect(
        service.createMovimiento(dto as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject egg movement without tipoHuevoId', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'ENTRADA',
        tipoProducto: 'HUEVO',
        cantidad: 100,
        galponId: undefined,
        tipoHuevoId: undefined,
      };

      await expect(
        service.createMovimiento(dto as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject venta without destino', async () => {
      const dto = {
        fecha: '2026-03-15',
        tipoMovimiento: 'VENTA',
        tipoProducto: 'HUEVO',
        cantidad: 100,
        tipoHuevoId: 'tipo-1',
        galponId: undefined,
        destino: undefined,
      };

      await expect(
        service.createMovimiento(dto as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getKardex', () => {
    it('should return paginated movements', async () => {
      const result = await service.getKardex('HUEVO', {});
      expect(result.data.length).toBe(1);
      expect(result.data[0].saldoCalculado).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should calculate saldo for entries', async () => {
      const entryMov = { ...mockMovimiento, tipoMovimiento: 'ENTRADA', cantidad: 100 };
      prisma.movimientoInventario.findMany.mockResolvedValue([entryMov]);
      prisma.movimientoInventario.count.mockResolvedValue(1);

      const result = await service.getKardex('HUEVO', {});
      expect(result.saldoActual).toBe(100);
    });

    it('should calculate saldo for exits', async () => {
      const exitMov = { ...mockMovimiento, tipoMovimiento: 'SALIDA', cantidad: 30 };
      prisma.movimientoInventario.findMany.mockResolvedValue([exitMov]);
      prisma.movimientoInventario.count.mockResolvedValue(1);

      const result = await service.getKardex('HUEVO', {});
      expect(result.saldoActual).toBe(-30);
    });
  });

  describe('getResumen', () => {
    it('should return monthly summary', async () => {
      prisma.movimientoInventario.findMany.mockResolvedValue([
        { ...mockMovimiento, tipoMovimiento: 'ENTRADA', cantidad: 200 },
        { ...mockMovimiento, tipoMovimiento: 'SALIDA', cantidad: 50 },
      ]);

      const result = await service.getResumen('HUEVO');
      expect(result.entradas).toBe(200);
      expect(result.salidas).toBe(50);
      expect(result.saldo).toBe(150);
    });
  });
});
