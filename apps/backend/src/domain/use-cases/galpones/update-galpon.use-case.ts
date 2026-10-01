import { NotFoundException } from '@nestjs/common';
import { IGalponRepository } from '../../ports/repositories/galpon.repository.port';

export interface UpdateGalponCommand {
  id: string;
  data: {
    codigo?: string;
    capacidad?: number;
    loteId?: string;
    descripcion?: string;
    gallinasActuales?: number;
    estado?: string;
  };
}

export class UpdateGalponUseCase {
  constructor(private readonly galponRepo: IGalponRepository) {}

  async execute(command: UpdateGalponCommand): Promise<any> {
    const galpon = await this.galponRepo.findById(command.id);
    if (!galpon) throw new NotFoundException('Galpón no encontrado');
    return this.galponRepo.update(command.id, command.data);
  }
}
