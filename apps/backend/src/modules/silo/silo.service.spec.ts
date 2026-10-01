import { Test, TestingModule } from '@nestjs/testing';
import { SiloService } from './silo.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SiloService', () => {
  let service: SiloService;
  let prisma: any;

  const mockSilo = {
    id: 'uuid-1',
    codigo: 'SILO-01',
    capacidad: 50000,
    unidad: 'KG',
    estado: 'ACTIVO',
    descripcion: 'Silo principal',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      silo: {
        create: jest.fn().mockResolvedValue(mockSilo),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockSilo]),
        update: jest.fn().mockResolvedValue(mockSilo),
        delete: jest.fn().mockResolvedValue(mockSilo),
        count: jest.fn().mockResolvedValue(1),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiloService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SiloService>(SiloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a silo', async () => {
      prisma.silo.findUnique.mockResolvedValue(null);
      const result = await service.create({ codigo: 'SILO-01', capacidad: 50000 });
      expect(result).toEqual(mockSilo);
      expect(prisma.silo.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if codigo already exists', async () => {
      prisma.silo.findUnique.mockResolvedValue(mockSilo);
      await expect(
        service.create({ codigo: 'SILO-01', capacidad: 50000 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all silos', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockSilo]);
    });

    it('should filter by estado', async () => {
      await service.findAll('ACTIVO');
      expect(prisma.silo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { estado: 'ACTIVO' } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a silo by id', async () => {
      prisma.silo.findUnique.mockResolvedValue(mockSilo);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockSilo);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.silo.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a silo', async () => {
      prisma.silo.findUnique.mockResolvedValueOnce(mockSilo);
      prisma.silo.findUnique.mockResolvedValueOnce(null);
      const result = await service.update('uuid-1', { capacidad: 60000 });
      expect(result).toEqual(mockSilo);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.silo.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a silo', async () => {
      prisma.silo.findUnique.mockResolvedValue({ ...mockSilo, _count: { inventarios: 0 } });
      const result = await service.remove('uuid-1');
      expect(result.message).toContain('eliminado');
    });

    it('should throw ConflictException if has inventory', async () => {
      prisma.silo.findUnique.mockResolvedValue({ ...mockSilo, _count: { inventarios: 5 } });
      await expect(service.remove('uuid-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleEstado', () => {
    it('should toggle estado from ACTIVO to MANTENIMIENTO', async () => {
      prisma.silo.findUnique.mockResolvedValue(mockSilo);
      prisma.silo.update.mockResolvedValue({ ...mockSilo, estado: 'MANTENIMIENTO' });
      const result = await service.toggleEstado('uuid-1');
      expect(result.estado).toBe('MANTENIMIENTO');
    });
  });

  describe('getResumen', () => {
    it('should return summary', async () => {
      prisma.silo.count.mockResolvedValue(5);
      prisma.silo.groupBy.mockResolvedValue([{ unidad: 'KG', _count: 3, _sum: { capacidad: 150000 } }]);
      const result = await service.getResumen();
      expect(result.total).toBe(5);
    });
  });
});
