import { IGalponRepository } from '../../ports/repositories/galpon.repository.port';

export class GetGalponesUseCase {
  constructor(private readonly galponRepo: IGalponRepository) {}

  async execute(params?: { where?: any }): Promise<any[]> {
    return this.galponRepo.findAll({
      where: params?.where,
      include: { lote: true, detallesReporte: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { codigo: 'asc' },
    });
  }
}
