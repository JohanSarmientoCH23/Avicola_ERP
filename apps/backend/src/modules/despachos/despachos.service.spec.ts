import { Test, TestingModule } from '@nestjs/testing';
import { DespachosService } from './despachos.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('DespachosService', () => {
  let service: DespachosService;
  let prisma: any;
  let auditService: any;

  const mockDespacho = {
    id: 'uuid-1',
    fecha: new Date('2026-03-15'),
    cliente: 'Cliente Test',
    estado: 'PENDIENTE',
    creadoPorId: 'user-1',
  };

  const mockDetalle = {
    id: 'det-1',
    despachoId: 'uuid-1',
    tipoHuevoId: 'tipo-1',
    cantidad: 100,
    precioUnitario: 5000,
    subtotal: 500000,
  };

  beforeEach(async () => {
    prisma = {
      despacho: {
        create: jest.fn().mockResolvedValue(mockDespacho),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockDespacho]),
        update: jest.fn().mockResolvedValue({ ...mockDespacho, estado: 'APROBADO' }),
        count: jest.fn().mockResolvedValue(1),
      },
      despachoDetalle: {
        create: jest.fn().mockResolvedValue(mockDetalle),
        findMany: jest.fn().mockResolvedValue([mockDetalle]),
      },
      tipoHuevo: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tipo-1', codigo: 'JUMBO' }),
      },
      inventarioHuevo: {
        findFirst: jest.fn().mockResolvedValue({ saldoFinal: 500, tipoHuevoId: 'tipo-1' }),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      movimientoInventario: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(async (fn: any) => {
        const tx = {
          despacho: {
            create: jest.fn().mockResolvedValue(mockDespacho),
            update: jest.fn().mockResolvedValue({ ...mockDespacho, estado: 'APROBADO' }),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDespacho,
              detalles: [{ ...mockDetalle, tipoHuevo: { codigo: 'JUMBO', nombre: 'Jumbo' } }],
              creadoPor: { nombre: 'Test', apellido: 'User' },
            }),
          },
          despachoDetalle: {
            create: jest.fn().mockResolvedValue(mockDetalle),
            findMany: jest.fn().mockResolvedValue([mockDetalle]),
          },
          movimientoInventario: {
            create: jest.fn().mockResolvedValue({}),
          },
          inventarioHuevo: {
            findFirst: jest.fn().mockResolvedValue({ saldoFinal: 500 }),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      }),
    };

    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DespachosService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<DespachosService>(DespachosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a despacho with details', async () => {
      const dto = {
        fecha: '2026-03-15',
        cliente: 'Cliente Test',
        detalles: [{ tipoHuevoId: 'tipo-1', cantidad: 100, precioUnitario: 5000 }],
      };

      const result = await service.create(dto as any, 'user-1') as any;
      expect(result.id).toBe('uuid-1');
      expect(result.cliente).toBe('Cliente Test');
    });

    it('should reject empty detalles', async () => {
      const dto = { fecha: '2026-03-15', cliente: 'Test', detalles: [] };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject zero quantities', async () => {
      const dto = {
        fecha: '2026-03-15',
        cliente: 'Test',
        detalles: [{ tipoHuevoId: 'tipo-1', cantidad: 0 }],
      };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject insufficient stock', async () => {
      prisma.inventarioHuevo.findFirst.mockResolvedValue({ saldoFinal: 50, tipoHuevoId: 'tipo-1' });
      const dto = {
        fecha: '2026-03-15',
        cliente: 'Test',
        detalles: [{ tipoHuevoId: 'tipo-1', cantidad: 100 }],
      };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all despachos', async () => {
      const result = await service.findAll({});
      expect(result.data).toEqual([mockDespacho]);
    });
  });

  describe('findOne', () => {
    it('should return a despacho with details', async () => {
      prisma.despacho.findUnique.mockResolvedValue({
        ...mockDespacho,
        detalles: [mockDetalle],
        creadoPor: { nombre: 'Test', apellido: 'User' },
      });
      const result = await service.findOne('uuid-1');
      expect(result.id).toBe('uuid-1');
    });
  });

  describe('approve', () => {
    it('should approve a despacho', async () => {
      prisma.despacho.findUnique.mockResolvedValue({
        ...mockDespacho,
        detalles: [mockDetalle],
      });
      const result = await service.approve('uuid-1', 'user-1');
      expect(result.estado).toBe('APROBADO');
      expect(auditService.log).toHaveBeenCalled();
    });
  });
});
