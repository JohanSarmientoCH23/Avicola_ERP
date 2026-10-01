import { IGalponRepository } from '../../ports/repositories/galpon.repository.port';
import { Galpon } from '../../entities';

export interface CreateGalponCommand {
  codigo: string;
  capacidad: number;
  loteId?: string;
  descripcion?: string;
  gallinasActuales?: number;
  estado?: string;
}

export class CreateGalponUseCase {
  constructor(private readonly galponRepo: IGalponRepository) {}

  async execute(command: CreateGalponCommand): Promise<any> {
    return this.galponRepo.create({
      codigo: command.codigo,
      capacidad: command.capacidad,
      loteId: command.loteId,
      descripcion: command.descripcion,
      gallinasActuales: command.gallinasActuales || 0,
      estado: (command.estado as any) || 'ACTIVO',
    });
  }
}
