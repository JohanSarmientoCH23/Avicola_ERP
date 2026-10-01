import { Usuario } from '../../entities';

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findAll(params?: { skip?: number; take?: number; where?: any }): Promise<Usuario[]>;
  count(params?: { where?: any }): Promise<number>;
  create(data: Partial<Usuario>): Promise<Usuario>;
  update(id: string, data: Partial<Usuario>): Promise<Usuario>;
  delete(id: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
}
