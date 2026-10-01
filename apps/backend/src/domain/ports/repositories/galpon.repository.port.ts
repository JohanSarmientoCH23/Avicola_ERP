import { Galpon } from '../../entities';

export interface IGalponRepository {
  findById(id: string): Promise<Galpon | null>;
  findByCodigo(codigo: string): Promise<Galpon | null>;
  findAll(params?: { include?: any; orderBy?: any }): Promise<Galpon[]>;
  create(data: Partial<Galpon>): Promise<Galpon>;
  update(id: string, data: Partial<Galpon>): Promise<Galpon>;
  delete(id: string): Promise<void>;
  updateGallinas(id: string, cantidad: number): Promise<Galpon>;
}
