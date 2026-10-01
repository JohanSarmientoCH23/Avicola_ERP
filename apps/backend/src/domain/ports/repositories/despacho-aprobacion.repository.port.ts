import { DespachoAprobacion } from '../../entities';

export interface IDespachoAprobacionRepository {
  findByDespachoId(despachoId: string): Promise<DespachoAprobacion | null>;
  create(data: Partial<DespachoAprobacion>): Promise<DespachoAprobacion>;
  update(id: string, data: Partial<DespachoAprobacion>): Promise<DespachoAprobacion>;
}
