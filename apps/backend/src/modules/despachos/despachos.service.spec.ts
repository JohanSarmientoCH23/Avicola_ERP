import { Test, TestingModule } from '@nestjs/testing';
import { DespachosService } from './despachos.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('DespachosService', () => {
  let service: DespachosService;
  let prisma: any;
  let auditService: any;
  let tx: any;

  const mockCliente = { id: 'cliente-1', razonSocial: 'Cliente Test' };
  const mockDespacho = {
    id: 'uuid-1',
    fecha: new Date('2026-03-15'),
    clienteId: 'cliente-1',
    estado: 'PENDIENTE',
    creadoPorId: 'user-1',
  };
  const mockDetalle = {
    id: 'det-1',
    despachoId: 'uuid-1',
    tipoHuevoId: 'tipo-1',
    cantidad: 100,
    precioUnit: 5000,
    pesoTotal: 500000,
  };

  const buildTx = () => ({
    despacho: {
      create: jest.fn().mockResolvedValue(mockDespacho),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn().mockResolvedValue({
        ...mockDespacho,
        estado: 'APROBADO',
        cliente: mockCliente,
        detalles: [{ ...mockDetalle, tipoHuevo: { codigo: 'JUMBO', nombre: 'Jumbo' } }],
        creadoPor: { nombre: 'Test', apellido: 'User' },
      }),
      findMany: jest.fn().mockResolvedValue([mockDespacho]),
      count: jest.fn().mockResolvedValue(1),
    },
    despachoDetalle: {
      create: jest.fn().mockResolvedValue(mockDetalle),
      findMany: jest.fn().mockResolvedValue([mockDetalle]),
    },
    despachoAprobacion: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    cliente: {
      findUnique: jest.fn().mockResolvedValue(mockCliente),
    },
    tipoHuevo: {
      findUnique: jest.fn().mockResolvedValue({ id: 'tipo-1', codigo: 'JUMBO' }),
    },
    movimientoHuevo: {
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    inventarioHuevo: {
      findFirst: jest.fn().mockResolvedValue({ saldoFinal: 500, tipoHuevoId: 'tipo-1' }),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    auditoria: {
      create: jest.fn().mockResolvedValue({}),
    },
  });

  beforeEach(async () => {
    tx = buildTx();

    prisma = {
      $transaction: jest.fn(async (fn: any) => fn(tx)),
      cliente: {
        findUnique: jest.fn().mockResolvedValue(mockCliente),
      },
      tipoHuevo: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tipo-1', codigo: 'JUMBO' }),
      },
      inventarioHuevo: {
        findFirst: jest.fn().mockResolvedValue({ saldoFinal: 500, tipoHuevoId: 'tipo-1' }),
      },
      despacho: {
        create: jest.fn().mockResolvedValue(mockDespacho),
        findUnique: jest.fn().mockResolvedValue({ ...mockDespacho, detalles: [mockDetalle] }),
        findMany: jest.fn().mockResolvedValue([mockDespacho]),
        count: jest.fn().mockResolvedValue(1),
      },
      despachoDetalle: {
        create: jest.fn().mockResolvedValue(mockDetalle),
        findMany: jest.fn().mockResolvedValue([mockDetalle]),
      },
      movimientoHuevo: {
        findMany: jest.fn().mockResolvedValue([]),
      },
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
    it('should create a despacho with details but WITHOUT stock movement', async () => {
      const dto = {
        fecha: '2026-03-15',
        clienteId: 'cliente-1',
        detalles: [{ tipoHuevoId: 'tipo-1', cantidad: 100, precioUnit: 5000 }],
      };

      const result = await service.create(dto as any, 'user-1') as any;
      expect(result.id).toBe('uuid-1');
      expect(tx.despacho.create).toHaveBeenCalled();
      expect(tx.despachoDetalle.create).toHaveBeenCalled();
      expect(tx.movimientoHuevo.create).not.toHaveBeenCalled();
      expect(tx.inventarioHuevo.create).not.toHaveBeenCalled();
    });

    it('should reject empty detalles', async () => {
      const dto = { fecha: '2026-03-15', clienteId: 'cliente-1', detalles: [] };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject zero quantities', async () => {
      const dto = {
        fecha: '2026-03-15',
        clienteId: 'cliente-1',
        detalles: [{ tipoHuevoId: 'tipo-1', cantidad: 0 }],
      };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject insufficient stock', async () => {
      prisma.inventarioHuevo.findFirst.mockResolvedValue({ saldoFinal: 50, tipoHuevoId: 'tipo-1' });
      const dto = {
        fecha: '2026-03-15',
        clienteId: 'cliente-1',
        detalles: [{ tipoHuevoId: 'tipo-1', cantidad: 100 }],
      };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject unknown cliente', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);
      const dto = {
        fecha: '2026-03-15',
        clienteId: 'nope',
        detalles: [{ tipoHuevoId: 'tipo-1', cantidad: 10 }],
      };
      await expect(service.create(dto as any, 'user-1')).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated despachos with clamped limits', async () => {
      const result = await service.findAll({ page: 0 as any, limit: 9999 as any });
      expect(result.data).toEqual([mockDespacho]);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(100);
    });
  });

  describe('findOne', () => {
    it('should return a despacho with details', async () => {
      const result = await service.findOne('uuid-1');
      expect(result.id).toBe('uuid-1');
    });
  });

  describe('approve', () => {
    it('should approve, create movement and update snapshot inside the transaction', async () => {
      const result = await service.approve('uuid-1', 'user-1');
      expect(result?.estado).toBe('APROBADO');
      expect(tx.despacho.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'uuid-1' }) }),
      );
      expect(tx.movimientoHuevo.create).toHaveBeenCalledTimes(1);
      expect(tx.inventarioHuevo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipoHuevoId: 'tipo-1',
            ventas: 100,
            saldoFinal: 400,
          }),
        }),
      );
      expect(tx.despachoAprobacion.upsert).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should re-validate stock inside approve and reject if insufficient', async () => {
      tx.inventarioHuevo.findFirst.mockResolvedValue({ saldoFinal: 50 });
      await expect(service.approve('uuid-1', 'user-1')).rejects.toThrow(BadRequestException);
      expect(tx.movimientoHuevo.create).not.toHaveBeenCalled();
    });

    it('should reject approving twice (atomic claim fails)', async () => {
      tx.despacho.updateMany.mockResolvedValue({ count: 0 });
      tx.despacho.findUnique.mockResolvedValue({ ...mockDespacho, estado: 'APROBADO' });
      await expect(service.approve('uuid-1', 'user-1')).rejects.toThrow(BadRequestException);
      expect(tx.movimientoHuevo.create).not.toHaveBeenCalled();
    });

    it('should reject approving a cancelled despacho', async () => {
      tx.despacho.updateMany.mockResolvedValue({ count: 0 });
      tx.despacho.findUnique.mockResolvedValue({ ...mockDespacho, estado: 'CANCELADO' });
      await expect(service.approve('uuid-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('should cancel a pending despacho and clean legacy movements', async () => {
      tx.despacho.findUnique.mockResolvedValue({ ...mockDespacho, estado: 'CANCELADO' });
      const result = await service.cancel('uuid-1', 'user-1', 'Sin stock');
      expect(result?.estado).toBe('CANCELADO');
      expect(tx.movimientoHuevo.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ referencia: 'Despacho uuid-1' }) }),
      );
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should not allow cancelling an approved despacho', async () => {
      tx.despacho.updateMany.mockResolvedValue({ count: 0 });
      tx.despacho.findUnique.mockResolvedValue({ ...mockDespacho, estado: 'APROBADO' });
      await expect(service.cancel('uuid-1', 'user-1', 'x')).rejects.toThrow(ForbiddenException);
    });
  });
});
