import { NotFoundException } from '@nestjs/common';
import { IGalponRepository } from '../../ports/repositories/galpon.repository.port';

export class DeleteGalponUseCase {
  constructor(private readonly galponRepo: IGalponRepository) {}

  async execute(id: string): Promise<any> {
    const galpon = await this.galponRepo.findById(id);
    if (!galpon) throw new NotFoundException('Galpón no encontrado');
    return this.galponRepo.update(id, { estado: 'INACTIVO' as any });
  }
}
