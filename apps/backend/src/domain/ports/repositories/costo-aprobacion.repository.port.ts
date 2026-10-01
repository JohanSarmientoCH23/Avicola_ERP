import { CostoAprobacion } from '../../entities';

export interface ICostoAprobacionRepository {
  findByCostoId(costoId: string): Promise<CostoAprobacion | null>;
  create(data: Partial<CostoAprobacion>): Promise<CostoAprobacion>;
  update(id: string, data: Partial<CostoAprobacion>): Promise<CostoAprobacion>;
}
